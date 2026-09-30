<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        // ?month=YYYY-MM, default current month
        $monthParam = $request->query('month');
        $month = null;
        $monthStart = null;
        $monthEnd = null;

        if ($monthParam && preg_match('/^\d{4}-\d{2}$/', $monthParam)) {
            $month = $monthParam;
            $monthStart = \Carbon\Carbon::createFromFormat('Y-m', $month)->startOfMonth()->startOfDay();
            $monthEnd = \Carbon\Carbon::createFromFormat('Y-m', $month)->endOfMonth()->endOfDay();
        } else {
            $month = now()->format('Y-m');
            $monthStart = now()->startOfMonth()->startOfDay();
            $monthEnd = now()->endOfMonth()->endOfDay();
        }

        $events = Schedule::where('user_id', $user->id)
            ->where('is_active', true)
            ->whereBetween('event_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->with('subject:id,name,slug,icon,color')
            ->orderBy('event_date')
            ->orderBy('start_time')
            ->get()
            ->map(fn (Schedule $s) => [
                'id' => $s->id,
                'title' => $s->title,
                'description' => $s->description,
                'event_type' => $s->event_type,
                'event_date' => $s->event_date->toDateString(),
                'start_time' => $s->start_time,
                'end_time' => $s->end_time,
                'color' => $s->color,
                'is_completed' => $s->is_completed,
                'subject' => $s->subject ? [
                    'id' => $s->subject->id,
                    'name' => $s->subject->name,
                    'icon' => $s->subject->icon,
                    'color' => $s->subject->color,
                ] : null,
            ]);

        // Group by date for calendar rendering
        $groupedByDate = $events->groupBy('event_date')->map(fn ($group) => $group->values()->all());

        // Active subjects for the add-event form dropdown
        $subjects = \App\Models\Subject::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Student/Schedule', [
            'events' => $groupedByDate,
            'month' => $month,
            'subjects' => $subjects,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'event_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'description' => ['nullable', 'string', 'max:1000'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'event_type' => ['nullable', 'string', 'max:30'],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        Schedule::create([
            'user_id' => auth()->id(),
            'subject_id' => $validated['subject_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'event_type' => $validated['event_type'] ?? 'study_session',
            'event_date' => $validated['event_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'] ?? null,
            'color' => $validated['color'] ?? null,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Event scheduled successfully.');
    }

    public function update(Request $request, Schedule $schedule)
    {
        abort_unless($schedule->user_id === auth()->id(), 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'event_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'description' => ['nullable', 'string', 'max:1000'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'event_type' => ['nullable', 'string', 'max:30'],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $schedule->update($validated);

        return redirect()->back()->with('success', 'Event updated successfully.');
    }

    public function destroy(Schedule $schedule)
    {
        abort_unless($schedule->user_id === auth()->id(), 403);

        $schedule->delete();

        return redirect()->back()->with('success', 'Event deleted.');
    }

    public function toggleComplete(Schedule $schedule)
    {
        abort_unless($schedule->user_id === auth()->id(), 403);

        $schedule->update(['is_completed' => ! $schedule->is_completed]);

        return redirect()->back()->with('success', $schedule->is_completed ? 'Event marked as complete.' : 'Event marked as incomplete.');
    }
}
