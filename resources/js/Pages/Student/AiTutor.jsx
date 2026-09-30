import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AppLayout from '@/Layouts/AppLayout';

/**
 * AiTutor — streaming chat with conversation history sidebar, subject switcher,
 * typing indicator, and related topic cards.
 *
 * Props:
 *   conversations: [{ id, title, last_message_at, subject_id }]
 *   currentConversation: { id, messages: [{ role, content, created_at }], related_topics? }
 *   subjects: [{ id, name, icon? }]
 *   activeSubjectId: number
 */

const FALLBACK_TOPICS = [
    { id: 1, title: 'Inequalities', subtitle: 'Next Lesson', icon: 'calculate' },
    { id: 2, title: 'Algebra Basics', subtitle: 'Review', icon: 'functions' },
];

function formatTime(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TypingDots() {
    return (
        <span className="flex items-center gap-1 py-1" aria-label="AI Tutor is typing">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-secondary animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                ></span>
            ))}
        </span>
    );
}

function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    const time = formatTime(message.created_at);

    if (isUser) {
        return (
            <div className="flex flex-col items-end gap-1">
                <div className="bg-surface-container-high rounded-2xl rounded-tr-sm px-md py-sm border-2 border-outline-variant border-b-4 max-w-[85%] sm:max-w-[80%]">
                    <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                {time && <span className="font-label-bold text-label-bold text-on-surface-variant/60 text-[10px] uppercase px-1">{time}</span>}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-start gap-1">
            <div className="flex items-end gap-sm max-w-[92%] sm:max-w-[85%]">
                <div className="w-10 h-10 rounded-full bg-secondary-container border-2 border-outline-variant flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        psychology
                    </span>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl rounded-tl-sm p-md border-2 border-outline-variant border-b-4">
                    <div className="chat-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                </div>
            </div>
            {time && <span className="font-label-bold text-label-bold text-on-surface-variant/60 text-[10px] uppercase px-12">{time}</span>}
        </div>
    );
}

function ConversationItem({ conversation, active }) {
    return (
        <Link
            href={`/student/ai?conversation=${conversation.id}`}
            className={`block rounded-2xl p-sm border-2 transition-all ${
                active
                    ? 'bg-secondary-container text-on-secondary-container border-secondary border-b-4'
                    : 'bg-surface-container-lowest border-transparent hover:bg-surface-container-high hover:border-outline-variant'
            }`}
        >
            <p className={`font-body-md text-body-md font-bold truncate ${active ? 'text-on-secondary-container' : 'text-on-surface'}`}>
                {conversation.title}
            </p>
            <p className={`font-label-bold text-label-bold text-[10px] uppercase mt-0.5 ${active ? 'text-on-secondary-container/70' : 'text-on-surface-variant/70'}`}>
                {formatTime(conversation.last_message_at) || '—'}
            </p>
        </Link>
    );
}

function RelatedTopicCard({ topic }) {
    return (
        <Link
            href={`/student/subjects?topic=${topic.id}`}
            className="bg-surface-container-lowest border-2 border-outline-variant border-b-4 rounded-xl p-sm flex items-center gap-md hover:bg-surface-container-lowest transition-colors btn-chunky"
        >
            <div className="w-10 h-10 rounded-lg bg-tertiary-container text-on-tertiary-container flex items-center justify-center border-2 border-outline-variant shrink-0">
                <span className="material-symbols-outlined" aria-hidden="true">{topic.icon || 'explore'}</span>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-body-md text-body-md text-on-surface font-bold truncate">{topic.title}</h4>
                <p className="text-xs font-body-md text-on-surface-variant truncate">{topic.subtitle || 'Explore'}</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant shrink-0" aria-hidden="true">chevron_right</span>
        </Link>
    );
}

export default function AiTutor({ auth, conversations = [], currentConversation = null, subjects = [], activeSubjectId = null }) {
    const csrfToken = usePage().props.csrf_token || document.querySelector('meta[name="csrf-token"]')?.content;

    const [messages, setMessages] = useState(currentConversation?.messages || []);
    const [conversationId, setConversationId] = useState(currentConversation?.id || null);
    const [subjectId, setSubjectId] = useState(activeSubjectId || subjects[0]?.id || null);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [streamText, setStreamText] = useState('');
    const [relatedTopics, setRelatedTopics] = useState(currentConversation?.related_topics || FALLBACK_TOPICS);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const scrollRef = useRef(null);
    const textareaRef = useRef(null);

    // Auto-scroll to newest message
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, streamText, streaming]);

    // Reset conversation-scoped state when the student switches conversation.
    // Done during render against the previous conversation id (React's
    // "adjusting state when a prop changes" pattern) instead of in an effect,
    // so the new conversation never renders once with the old messages.
    const [syncedConversationId, setSyncedConversationId] = useState(currentConversation?.id ?? null);
    if (syncedConversationId !== (currentConversation?.id ?? null)) {
        setSyncedConversationId(currentConversation?.id ?? null);
        setMessages(currentConversation?.messages || []);
        setConversationId(currentConversation?.id || null);
        setRelatedTopics(currentConversation?.related_topics || FALLBACK_TOPICS);
        setStreamText('');
        setStreaming(false);
    }

    const send = useCallback(
        async (rawText) => {
            const text = rawText.trim();
            if (!text || streaming) return;

            const optimisticUserMsg = { role: 'user', content: text, created_at: new Date().toISOString() };
            setMessages((m) => [...m, optimisticUserMsg]);
            setInput('');
            setStreaming(true);
            setStreamText('');

            if (textareaRef.current) textareaRef.current.style.height = 'auto';

            let full = '';
            let newConversationId = conversationId;
            let topics = null;

            try {
                const response = await fetch('/student/ai/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'text/event-stream',
                        'X-CSRF-TOKEN': csrfToken || '',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        message: text,
                        conversation_id: conversationId ?? undefined,
                        subject_id: subjectId ?? undefined,
                    }),
                });

                if (!response.ok || !response.body) {
                    throw new Error(`Request failed (${response.status})`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    // SSE events separated by blank lines
                    const events = buffer.split(/\n\n+/);
                    buffer = events.pop() || '';

                    for (const event of events) {
                        for (const line of event.split('\n')) {
                            if (!line.startsWith('data:')) continue;
                            const payload = line.slice(5).trim();
                            if (!payload || payload === '[DONE]') continue;

                            try {
                                const data = JSON.parse(payload);
                                if (typeof data.conversation_id !== 'undefined') {
                                    newConversationId = data.conversation_id;
                                }
                                if (Array.isArray(data.related_topics)) {
                                    topics = data.related_topics;
                                }
                                const chunk = data.chunk ?? data.content ?? data.delta ?? data.text;
                                if (typeof chunk === 'string') full += chunk;
                            } catch {
                                // Plain-text SSE fallback
                                full += payload;
                            }
                            setStreamText(full);
                        }
                    }
                }
            } catch {
                full = full || 'Sorry, something went wrong. Please try again.';
            } finally {
                setStreaming(false);
                setStreamText('');
                if (full) {
                    setMessages((m) => [...m, { role: 'assistant', content: full, created_at: new Date().toISOString() }]);
                }
                if (newConversationId) setConversationId(newConversationId);
                if (topics) setRelatedTopics(topics);
            }
        },
        [conversationId, csrfToken, streaming, subjectId],
    );

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(input);
        }
    };

    const handleTextareaInput = (e) => {
        setInput(e.target.value);
        const el = e.target;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    };

    const hasMessages = messages.length > 0 || streaming;

    const sidebarContent = (
        <>
            {/* Conversations */}
            <div className="flex flex-col gap-sm">
                <div className="flex items-center justify-between px-1">
                    <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
                        <span className="material-symbols-outlined text-secondary" aria-hidden="true">history</span>
                        History
                    </h2>
                    <Link
                        href="/student/ai"
                        className="flex items-center gap-1 font-label-bold text-label-bold text-primary hover:opacity-80"
                        aria-label="Start new conversation"
                    >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_circle</span>
                        New
                    </Link>
                </div>
                <div className="flex flex-col gap-xs max-h-64 overflow-y-auto pr-1">
                    {conversations.length > 0 ? (
                        conversations.map((c) => <ConversationItem key={c.id} conversation={c} active={c.id === conversationId} />)
                    ) : (
                        <p className="font-body-md text-body-md text-on-surface-variant/70 px-1 py-sm">No conversations yet. Say hi below!</p>
                    )}
                </div>
            </div>

            {/* Related Topics */}
            <div className="flex flex-col gap-sm">
                <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs px-1">
                    <span className="material-symbols-outlined text-tertiary" aria-hidden="true">explore</span>
                    Related Topics
                </h2>
                <div className="flex flex-col gap-sm">
                    {relatedTopics.map((topic) => (
                        <RelatedTopicCard key={topic.id} topic={topic} />
                    ))}
                </div>
            </div>
        </>
    );

    return (
        <AppLayout auth={auth}>
            {/* Full-height chat shell */}
            <div className="flex flex-col h-[calc(100vh-16rem)] md:h-[calc(100vh-8rem)] min-h-[480px] -m-lg md:-m-xl mb-0">
                {/* Chat header */}
                <header className="h-16 md:h-20 flex items-center justify-between gap-sm px-lg border-b-2 border-outline-variant bg-surface-container-lowest shrink-0">
                    <h1 className="font-headline-md md:font-headline-lg md:text-headline-lg flex items-center gap-sm text-on-surface">
                        <span className="material-symbols-outlined text-secondary text-[28px] md:text-[32px]" aria-hidden="true">auto_awesome</span>
                        AI Tutor
                    </h1>

                    <div className="flex items-center gap-sm">
                        {/* Subject context switcher */}
                        <div className="relative">
                            <label htmlFor="tutor-subject" className="sr-only">Subject context</label>
                            <select
                                id="tutor-subject"
                                value={subjectId ?? ''}
                                onChange={(e) => setSubjectId(Number(e.target.value))}
                                className="appearance-none bg-surface-container border-2 border-outline-variant border-b-4 rounded-xl pl-md pr-8 py-2 font-label-bold text-label-bold text-on-surface focus:outline-none focus:border-secondary cursor-pointer max-w-[140px] truncate"
                            >
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]" aria-hidden="true">
                                expand_more
                            </span>
                        </div>

                        {/* Mobile: open history drawer */}
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className="xl:hidden w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high border-2 border-transparent hover:border-outline-variant transition-all"
                            aria-label="Open conversation history"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">history</span>
                        </button>
                    </div>
                </header>

                <div className="flex flex-1 min-h-0">
                    {/* Messages canvas */}
                    <section className="flex-1 flex flex-col min-w-0 bg-surface-bright">
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg" aria-live="polite">
                            {!hasMessages && (
                                <div className="flex flex-col items-center gap-md text-center mt-auto mb-auto max-w-sm mx-auto">
                                    <div className="w-20 h-20 rounded-full bg-secondary-fixed border-2 border-outline-variant border-b-4 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-4xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                                            psychology
                                        </span>
                                    </div>
                                    <h2 className="font-headline-md text-headline-md text-on-surface">Hi! I&apos;m your AI Tutor</h2>
                                    <p className="font-body-md text-body-md text-on-surface-variant">
                                        Ask anything about your lessons — I&apos;ll break it down step by step.
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <MessageBubble key={i} message={msg} />
                            ))}

                            {/* Streaming assistant bubble / typing indicator */}
                            {streaming && (
                                <div className="flex items-end gap-sm max-w-[92%] sm:max-w-[85%]">
                                    <div className="w-10 h-10 rounded-full bg-secondary-container border-2 border-outline-variant flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                                            psychology
                                        </span>
                                    </div>
                                    <div className="bg-surface-container-lowest rounded-2xl rounded-tl-sm p-md border-2 border-outline-variant border-b-4">
                                        {streamText ? (
                                            <div className="chat-markdown">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown>
                                                <span className="inline-block w-2 h-4 bg-secondary align-text-bottom ml-0.5 animate-pulse" aria-hidden="true"></span>
                                            </div>
                                        ) : (
                                            <TypingDots />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input area */}
                        <div className="border-t-2 border-outline-variant bg-surface-container-lowest p-md md:p-lg flex flex-col gap-sm shrink-0">
                            {/* Quick actions */}
                            <div className="flex gap-sm overflow-x-auto max-w-3xl mx-auto w-full pb-1" style={{ scrollbarWidth: 'none' }}>
                                {[
                                    { icon: 'lightbulb', label: 'Explain Simpler' },
                                    { icon: 'extension', label: 'Give Example' },
                                    { icon: 'edit_note', label: 'Create Practice Quiz', primary: true },
                                ].map((chip) => (
                                    <button
                                        key={chip.label}
                                        type="button"
                                        onClick={() => send(chip.label)}
                                        disabled={streaming}
                                        className={`whitespace-nowrap rounded-full px-md py-xs font-label-bold text-label-bold btn-chunky border-2 flex items-center gap-xs disabled:opacity-50 ${
                                            chip.primary
                                                ? 'bg-secondary-container text-on-secondary-container border-secondary hover:opacity-90'
                                                : 'bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{chip.icon}</span>
                                        {chip.label}
                                    </button>
                                ))}
                            </div>

                            {/* Input box */}
                            <div className="max-w-3xl mx-auto w-full flex items-end gap-sm">
                                <div className="flex-1 bg-surface-container-highest border-2 border-outline-variant rounded-[24px] p-1.5 flex items-end focus-within:border-secondary transition-colors">
                                    <textarea
                                        ref={textareaRef}
                                        rows={1}
                                        value={input}
                                        onChange={handleTextareaInput}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask about this lesson..."
                                        aria-label="Message AI Tutor"
                                        className="w-full bg-transparent border-none focus:ring-0 resize-none font-body-md text-body-md text-on-surface min-h-[44px] max-h-[120px] py-2.5 px-4 overflow-y-auto focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => send(input)}
                                    disabled={streaming || !input.trim()}
                                    className="bg-primary text-on-primary font-label-bold text-label-bold px-lg py-sm rounded-2xl h-[52px] border-2 border-primary-fixed border-b-4 btn-chunky flex items-center justify-center gap-xs shrink-0 hover:bg-primary-container disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined" aria-hidden="true">send</span>
                                    <span className="hidden sm:inline">Send</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Right sidebar (desktop) */}
                    <aside className="hidden xl:flex w-80 border-l-2 border-outline-variant bg-surface flex-col gap-xl p-lg overflow-y-auto shrink-0">
                        {sidebarContent}
                    </aside>
                </div>
            </div>

            {/* Mobile history drawer */}
            {drawerOpen && (
                <div className="xl:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Conversation history">
                    <button
                        type="button"
                        className="absolute inset-0 bg-inverse-surface/50"
                        onClick={() => setDrawerOpen(false)}
                        aria-label="Close conversation history"
                    ></button>
                    <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-surface border-l-2 border-outline-variant p-lg flex flex-col gap-xl overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="font-headline-md text-headline-md text-on-surface">AI Tutor</h2>
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high border-2 border-transparent hover:border-outline-variant"
                                aria-label="Close"
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">close</span>
                            </button>
                        </div>
                        {sidebarContent}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
