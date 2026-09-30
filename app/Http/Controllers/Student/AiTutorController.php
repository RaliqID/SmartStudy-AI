<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\Subject;
use App\Services\AI\AiTutorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AiTutorController extends Controller
{
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $conversations = $user->conversations()
            ->with('subject:id,name,slug,icon,color')
            ->get();

        $subjects = Subject::active()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'icon', 'color']);

        // Determine active conversation — accept both ?conversation= and ?conversation_id=
        $activeConversation = null;
        $conversationParam = $request->query('conversation_id') ?? $request->query('conversation');
        if ($conversationParam) {
            $activeConversation = $conversations->firstWhere('id', (int) $conversationParam);
        }
        if (! $activeConversation && $conversations->isNotEmpty()) {
            $activeConversation = $conversations->first();
        }

        // Load messages for active conversation
        $messages = [];
        if ($activeConversation) {
            $messages = $activeConversation->messages()
                ->orderBy('created_at')
                ->get(['id', 'role', 'content', 'created_at'])
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'role' => $m->role,
                    'content' => $m->content,
                    'created_at' => $m->created_at->toISOString(),
                ]);
        }

        return Inertia::render('Student/AiTutor', [
            'conversations' => $conversations->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'subject' => $c->subject ? [
                    'id' => $c->subject->id,
                    'name' => $c->subject->name,
                ] : null,
                'total_messages' => $c->total_messages,
                'last_message_at' => $c->last_message_at?->toISOString(),
            ]),
            'subjects' => $subjects,
            'currentConversation' => $activeConversation ? [
                'id' => $activeConversation->id,
                'subject_id' => $activeConversation->subject_id,
                'title' => $activeConversation->title,
                'related_topics' => $activeConversation->related_topics,
                'messages' => $messages,
            ] : null,
        ]);
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'integer', 'exists:ai_conversations,id'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();
        $messageText = $validated['message'];
        $conversationId = $validated['conversation_id'] ?? null;
        $subjectId = $validated['subject_id'] ?? null;

        // Find or create conversation
        $conversation = null;

        if ($conversationId) {
            $conversation = AiConversation::where('id', $conversationId)
                ->where('user_id', $user->id)
                ->first();
            if (! $conversation) {
                abort(404, 'Conversation not found');
            }
        } elseif ($subjectId) {
            // Find most recent conversation for this subject, or create new
            $conversation = AiConversation::where('user_id', $user->id)
                ->where('subject_id', $subjectId)
                ->orderByDesc('last_message_at')
                ->first();

            if (! $conversation) {
                $subject = Subject::find($subjectId);
                $title = $subject ? "AI Tutor: {$subject->name}" : 'AI Tutor';
                $conversation = AiConversation::create([
                    'user_id' => $user->id,
                    'subject_id' => $subjectId,
                    'title' => $title,
                    'total_messages' => 0,
                ]);
            }
        } else {
            // No subject, create new conversation with generic title
            $conversation = AiConversation::create([
                'user_id' => $user->id,
                'subject_id' => null,
                'title' => 'AI Tutor',
                'total_messages' => 0,
            ]);
        }

        // Save user message
        $userMessage = AiMessage::create([
            'ai_conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $messageText,
        ]);

        // Prepare messages for AI: load conversation history (last 10 messages)
        $history = $conversation->messages()
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->reverse()
            ->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])
            ->toArray();

        // Build system prompt with subject context
        $subject = $conversation->subject;
        $systemPrompt = app(AiTutorService::class)->systemPrompt(
            $subject?->name,
            null // unit name not available here
        );

        // Prepare messages array for AI
        $aiMessages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $history,
            [['role' => 'user', 'content' => $messageText]]
        );

        // Return SSE stream
        return new StreamedResponse(function () use ($conversation, $userMessage, $aiMessages, $subject, $messageText) {
            $fullResponse = '';
            try {
                $service = app(AiTutorService::class);

                // Fail fast with an actionable message when the 9router
                // Dev-Stack gateway has no API key configured, instead of
                // letting the provider reject the request with a 401.
                if (! $service->isConfigured()) {
                    echo 'data: '.json_encode([
                        'error' => 'AI Tutor is not configured yet. Set AI_API_KEY for the 9router Dev-Stack gateway in your .env file.',
                    ])."\n\n";
                    @ob_flush();
                    @flush();

                    return;
                }

                // Emit conversation id first — frontend tracks new conversations
                echo 'data: '.json_encode(['conversation_id' => $conversation->id])."\n\n";
                if (ob_get_level() > 0) { @ob_flush(); }
                @flush();

                // Stream chunks
                foreach ($service->chatStream($aiMessages, null) as $chunk) {
                    $fullResponse .= $chunk;
                    echo "data: " . json_encode(['chunk' => $chunk]) . "\n\n";
                    if (ob_get_level() > 0) { @ob_flush(); }
                @flush();
                }

                // After stream ends — generate related topics (opsional 3)
                $relatedTopics = [];
                if ($fullResponse !== '') {
                    $relatedTopics = $service->relatedTopics($messageText, $fullResponse, $subject?->name);
                }

                // Save assistant response + update conversation
                if ($fullResponse !== '') {
                    DB::transaction(function () use ($conversation, $fullResponse, $relatedTopics) {
                        AiMessage::create([
                            'ai_conversation_id' => $conversation->id,
                            'role' => 'assistant',
                            'content' => $fullResponse,
                        ]);

                        $conversation->total_messages += 2;
                        $conversation->last_message_at = now();
                        $conversation->related_topics = $relatedTopics ?: $conversation->related_topics;
                        $conversation->save();
                    });
                } else {
                    $conversation->total_messages += 1;
                    $conversation->last_message_at = now();
                    $conversation->save();
                }

                echo "data: " . json_encode([
                    'done' => true,
                    'related_topics' => $relatedTopics,
                ]) . "\n\n";
                if (ob_get_level() > 0) { @ob_flush(); }
                @flush();

            } catch (\Exception $e) {
                Log::error('AI Tutor stream error', [
                    'conversation_id' => $conversation->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                // Send error chunk
                echo "data: " . json_encode(['error' => 'AI Tutor temporarily unavailable. Please try again.']) . "\n\n";
                if (ob_get_level() > 0) { @ob_flush(); }
                @flush();
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}