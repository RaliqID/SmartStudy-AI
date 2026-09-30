import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

/**
 * Schedule — monthly calendar + per-day events, add/toggle/delete.
 *
 * Props:
 *   events: { 'YYYY-MM-DD': [{ id, title, event_type, start_time, end_time, location, color, is_completed, subject }] }
 *   month: 'YYYY-MM'
 *   subjects: [{ id, name }]
 */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const eventTypeMeta = {
    live_session: { icon: 'videocam', label: 'Live Session' },
    study_group: { icon: 'groups', label: 'Study Group' },
    assignment: { icon: 'assignment', label: 'Assignment' },
    exam: { icon: 'quiz', label: 'Exam' },
    reminder: { icon: 'notifications', label: 'Reminder' },
};
const fallbackEventMeta = { icon: 'event', label: 'Event' };

function pad(n) {
    return n.toString().padStart(2, '0');
}

function toISODate(year, month, day) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function shiftMonth(monthStr, delta) {
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function formatMonthTitle(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${y}`;
}

function formatTimeHM(value) {
    if (!value) return '';
    return value.slice(0, 5);
}

function EventCard({ event, onDelete, onToggle }) {
    const meta = eventTypeMeta[event.event_type] || fallbackEventMeta;
    const color = event.color || '#006590';
    return (
        <div className={`bg-surface rounded-2xl chunky-border p-md flex flex-col gap-sm ${event.is_completed ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-sm">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 shrink-0" style={{ backgroundColor: `${color}1a`, color }}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        {meta.icon}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-headline-md text-headline-md text-on-background truncate">{event.title}</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant truncate">
                        {[event.subject?.name, meta.label, event.location].filter(Boolean).join(' • ')}
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-between gap-sm">
                <span className="font-label-bold text-label-bold text-on-surface-variant">
                    {formatTimeHM(event.start_time)}
                    {event.end_time ? ` – ${formatTimeHM(event.end_time)}` : ''}
                </span>
                <div className="flex items-center gap-xs">
                    <button
                        type="button"
                        onClick={() => onToggle(event)}
                        aria-label={event.is_completed ? `Mark ${event.title} incomplete` : `Mark ${event.title} complete`}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 border-b-4 ${
                            event.is_completed
                                ? 'bg-primary-container text-on-primary-container border-primary'
                                : 'bg-surface-container text-on-surface-variant border-surface-container-highest hover:bg-surface-container-high'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                            {event.is_completed ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(event)}
                        aria-label={`Delete ${event.title}`}
                        className="w-9 h-9 rounded-xl bg-error-container/10 text-error flex items-center justify-center border-2 border-error/20 border-b-4 hover:bg-error-container/20"
                    >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Schedule({ auth, events = {}, month = '', subjects = [] }) {
    const monthStr = month || new Date().toISOString().slice(0, 7);
    const [year, monthIdx] = monthStr.split('-').map(Number);
    const today = new Date().toISOString().slice(0, 10);

    const [selectedDate, setSelectedDate] = useState(today);
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        event_type: 'live_session',
        subject_id: subjects[0]?.id || '',
        event_date: selectedDate,
        start_time: '09:00',
        end_time: '10:00',
        location: '',
    });

    const firstDay = new Date(year, monthIdx - 1, 1).getDay();
    const daysInMonth = new Date(year, monthIdx, 0).getDate();

    const goMonth = (delta) => {
        router.get(route('student.schedule'), { month: shiftMonth(monthStr, delta) }, { preserveState: true });
    };

    const submitForm = (e) => {
        e.preventDefault();
        post(route('student.schedule.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const toggleEvent = (event) => {
        router.patch(route('student.schedule.toggle', event.id), {}, { preserveScroll: true });
    };

    const deleteEvent = (event) => {
        router.delete(route('student.schedule.destroy', event.id), { preserveScroll: true });
    };

    const dayEvents = events[selectedDate] || [];

    // Calendar grid: leading blanks + days
    const calendarCells = [];
    for (let i = 0; i < firstDay; i++) calendarCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

    return (
        <AppLayout auth={auth}>
            {/* Header */}
            <header className="mb-lg flex flex-wrap items-end justify-between gap-sm">
                <div>
                    <h1 className="font-display text-display text-on-background mb-xs">Study Schedule</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant">Plan it. Do it. Streak it.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1 bg-primary-container text-on-primary-container px-md py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-primary hover:brightness-105"
                >
                    <span className="material-symbols-outlined" aria-hidden="true">add</span>
                    Add Event
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                {/* Calendar Card */}
                <div className="lg:col-span-2 bg-surface rounded-[24px] chunky-border p-lg flex flex-col gap-md">
                    <div className="flex justify-between items-center mb-sm">
                        <h2 className="font-headline-lg text-headline-lg text-on-background">{formatMonthTitle(monthStr)}</h2>
                        <div className="flex gap-xs">
                            <button
                                type="button"
                                onClick={() => goMonth(-1)}
                                aria-label="Previous month"
                                className="btn-chunky bg-surface-container border-surface-variant text-on-surface p-2 rounded-xl flex items-center justify-center hover:bg-surface-container-high border-2"
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => goMonth(1)}
                                aria-label="Next month"
                                className="btn-chunky bg-surface-container border-surface-variant text-on-surface p-2 rounded-xl flex items-center justify-center hover:bg-surface-container-high border-2"
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                        {WEEKDAYS.map((d) => (
                            <div key={d} className="font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2 sm:gap-3">
                        {calendarCells.map((day, idx) => {
                            if (day === null) return <div key={`blank-${idx}`} className="aspect-square rounded-xl bg-surface-container-lowest opacity-50 border-2 border-transparent"></div>;
                            const iso = toISODate(year, monthIdx - 1, day);
                            const dayEvents = events[iso] || [];
                            const isSelected = iso === selectedDate;
                            const isToday = iso === today;
                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    onClick={() => setSelectedDate(iso)}
                                    aria-label={`${day} ${MONTH_NAMES[monthIdx - 1]}, ${dayEvents.length} events`}
                                    aria-pressed={isSelected}
                                    className={`aspect-square rounded-xl border-2 border-b-4 bg-surface-container-lowest flex flex-col items-center justify-center relative hover:bg-surface-container-low transition-all active:translate-y-[2px] active:border-b-2 ${
                                        isSelected
                                            ? 'border-secondary bg-secondary-fixed text-on-secondary-container'
                                            : 'border-surface-container-highest border-b-surface-dim text-on-surface'
                                    }`}
                                >
                                    <span className={`font-headline-md text-headline-md ${isSelected ? 'text-on-secondary-container' : 'text-on-surface'} ${isToday && !isSelected ? 'text-secondary' : ''}`}>
                                        {day}
                                    </span>
                                    {dayEvents.length > 0 && (
                                        <span className="absolute bottom-1.5 flex gap-0.5" aria-hidden="true">
                                            {dayEvents.slice(0, 3).map((ev) => (
                                                <span key={ev.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.color || '#006590' }}></span>
                                            ))}
                                        </span>
                                    )}
                                    {isToday && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-secondary" aria-hidden="true"></span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Selected Day Events */}
                <div className="flex flex-col gap-md">
                    <div className="flex items-center justify-between">
                        <h3 className="font-headline-lg text-headline-lg text-on-background">
                            {selectedDate === today ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                        </h3>
                        <span className="font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">
                            {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
                        </span>
                    </div>

                    {dayEvents.length > 0 ? (
                        dayEvents.map((event) => (
                            <EventCard key={event.id} event={event} onToggle={toggleEvent} onDelete={deleteEvent} />
                        ))
                    ) : (
                        <div className="bg-surface rounded-2xl chunky-border p-lg flex flex-col items-center gap-sm text-center">
                            <span className="material-symbols-outlined text-[40px] text-on-surface-variant" aria-hidden="true">event_busy</span>
                            <p className="font-body-lg text-body-lg text-on-surface">Nothing scheduled</p>
                            <p className="font-body-md text-body-md text-on-surface-variant">Add a study session to keep the streak alive.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Event Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-lg" role="dialog" aria-modal="true" aria-label="Add new event">
                    <button type="button" className="absolute inset-0 bg-inverse-surface/50" onClick={() => setShowForm(false)} aria-label="Close"></button>
                    <div className="relative bg-surface rounded-[24px] chunky-border p-lg w-full max-w-md max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-md">
                            <h2 className="font-headline-lg text-headline-lg text-on-surface">New Event</h2>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high border-2 border-transparent hover:border-outline-variant"
                                aria-label="Close"
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">close</span>
                            </button>
                        </div>
                        <form onSubmit={submitForm} className="flex flex-col gap-sm">
                            <div>
                                <label htmlFor="event-title" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Title</label>
                                <input
                                    id="event-title"
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                    placeholder="Calculus Review"
                                    className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary"
                                />
                                {errors.title && <p className="text-error font-label-bold text-label-bold mt-1">{errors.title}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-sm">
                                <div>
                                    <label htmlFor="event-type" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Type</label>
                                    <select
                                        id="event-type"
                                        value={data.event_type}
                                        onChange={(e) => setData('event_type', e.target.value)}
                                        className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary"
                                    >
                                        {Object.entries(eventTypeMeta).map(([value, meta]) => (
                                            <option key={value} value={value}>{meta.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="event-subject" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Subject</label>
                                    <select
                                        id="event-subject"
                                        value={data.subject_id}
                                        onChange={(e) => setData('subject_id', e.target.value)}
                                        className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary"
                                    >
                                        <option value="">—</option>
                                        {subjects.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-sm">
                                <div>
                                    <label htmlFor="event-date" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Date</label>
                                    <input
                                        id="event-date"
                                        type="date"
                                        value={data.event_date}
                                        onChange={(e) => setData('event_date', e.target.value)}
                                        required
                                        className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="event-start" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Start</label>
                                    <input
                                        id="event-start"
                                        type="time"
                                        value={data.start_time}
                                        onChange={(e) => setData('start_time', e.target.value)}
                                        required
                                        className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="event-end" className="font-label-bold text-label-bold text-on-surface-variant uppercase">End</label>
                                    <input
                                        id="event-end"
                                        type="time"
                                        value={data.end_time}
                                        onChange={(e) => setData('end_time', e.target.value)}
                                        className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="event-location" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Location</label>
                                <input
                                    id="event-location"
                                    type="text"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    placeholder="Room B / Zoom"
                                    className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-sm w-full bg-primary-container text-on-primary-container py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-primary hover:brightness-105 disabled:opacity-60"
                            >
                                {processing ? 'Saving...' : 'Save Event'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
