import { Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

/**
 * Dashboard — rendered from real backend props (DashboardController).
 * Defensive field access: supports both task spec shape and controller shape.
 */

const eventTypes = {
    live_session: 'Live Session',
    study_group: 'Study Group',
    assignment: 'Assignment',
    exam: 'Exam',
    reminder: 'Reminder',
};

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

function formatTimeHM(value) {
    if (!value) return '';
    return String(value).slice(0, 5);
}

function eventLabel(type) {
    return eventTypes[type] || String(type || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Event';
}

function avatarUrl(entry) {
    return entry.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.name || 'S')}&background=87fe45&color=082100&bold=true&size=64`;
}

function ProgressRing({ pct, label }) {
    const clamped = Math.min(100, Math.max(0, Math.round(pct)));
    return (
        <div className="relative w-16 h-16 md:w-20 md:h-20" role="img" aria-label={`${label}: ${clamped}%`}>
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                <path
                    className="text-secondary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${clamped}, 100`}
                    strokeLinecap="round"
                    strokeWidth="4"
                ></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-label-bold text-label-bold text-on-background">{clamped}%</div>
        </div>
    );
}

function UpcomingRow({ event }) {
    const color = event.subject?.color || '#006590';
    const isToday = event.event_date === new Date().toISOString().slice(0, 10);
    const dateLabel = isToday ? eventLabel(event.event_type) : `${eventLabel(event.event_type)} · ${event.event_date}`;
    return (
        <Link
            href={route('student.schedule')}
            className="flex items-center gap-sm p-2 rounded-xl hover:bg-surface-container-low transition-colors border-2 border-transparent hover:border-outline-variant/30"
        >
            <div
                className="px-2 py-1 rounded-lg font-label-bold text-label-bold text-xs border w-14 text-center shrink-0"
                style={{ backgroundColor: `${color}1a`, color, borderColor: `${color}33` }}
            >
                {formatTimeHM(event.start_time)}
            </div>
            <div className="min-w-0">
                <h4 className="font-body-md text-body-md font-bold text-on-background truncate">{event.title}</h4>
                <p className="text-xs text-on-surface-variant truncate">{dateLabel}</p>
            </div>
        </Link>
    );
}

export default function Dashboard({ auth, ...pageProps }) {
    const sharedUser = usePage().props.auth?.user || {};
    const user = pageProps.user || sharedUser;

    const {
        continueLearning = null,
        aiRecommendation = '',
        dailyGoal = { completed: 0, target: 5 },
        overallProgress = 0,
        recentQuiz = null,
        upcoming = [],
        leaderboardTop = [],
    } = pageProps;

    const firstName = (user.name || 'Student').split(' ')[0];
    const goalPct = dailyGoal.target > 0 ? Math.min(100, Math.round((dailyGoal.completed / dailyGoal.target) * 100)) : 0;

    // Continue Learning: controller shape (mastery/unit_title/material_id) with spec-shape fallbacks
    const cl = continueLearning;
    const clSubject = cl?.subject;
    const clColor = clSubject?.color || '#006590';
    const clIcon = clSubject?.icon || 'menu_book';
    const clProgress = Math.min(100, Math.round(cl?.mastery ?? cl?.progress ?? 0));
    const clUnitTitle = cl?.unit_title ?? cl?.unit?.title;
    const clMaterialId = cl?.material_id ?? cl?.material?.id;
    const clMaterialTitle = cl?.material_title ?? cl?.material?.title;

    return (
        <AppLayout auth={auth}>
            {/* Header */}
            <header className="mb-xl">
                <h1 className="font-display text-display text-on-background">
                    {getGreeting()}, {firstName}!
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Ready to crush some learning goals today?</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                {/* Left column (2/3) */}
                <div className="lg:col-span-2 flex flex-col gap-lg">
                    {/* Continue Learning */}
                    {cl && clSubject ? (
                        <div className="bg-surface rounded-2xl chunky-border p-lg flex flex-col sm:flex-row items-center gap-lg relative">
                            <div className="absolute top-2 right-4 flex gap-1" aria-hidden="true">
                                <span className="material-symbols-outlined text-primary/30 text-sm">auto_awesome</span>
                                <span className="material-symbols-outlined text-primary/20 text-xs">auto_awesome</span>
                            </div>
                            <div
                                className="w-32 h-32 rounded-2xl flex items-center justify-center border-2 shrink-0"
                                style={{ backgroundColor: `${clColor}1a`, borderColor: `${clColor}33` }}
                            >
                                <span className="material-symbols-outlined text-[56px]" style={{ color: clColor, fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                                    {clIcon}
                                </span>
                            </div>
                            <div className="flex-1 w-full flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
                                <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-label-bold text-label-bold uppercase text-[10px] tracking-wider mb-2">
                                    Up Next
                                </span>
                                <h2 className="font-headline-lg text-headline-lg text-on-background">{clSubject.name}</h2>
                                <p className="font-body-md text-body-md text-on-surface-variant mt-1 truncate w-full">
                                    {clUnitTitle ? `${clUnitTitle}` : 'Continue your journey'}
                                    {clMaterialTitle ? ` — ${clMaterialTitle}` : ''}
                                </p>
                                <div
                                    className="w-full bg-surface-container-high h-4 rounded-full overflow-hidden my-4 border-2 border-outline-variant/20"
                                    role="progressbar"
                                    aria-valuenow={clProgress}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={`${clSubject.name} mastery`}
                                >
                                    <div className="bg-primary h-full rounded-full relative" style={{ width: `${clProgress}%` }}>
                                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full"></div>
                                    </div>
                                </div>
                                {clMaterialId && (
                                    <Link
                                        href={route('student.materials.show', clMaterialId)}
                                        className="w-full sm:w-auto bg-primary text-on-primary px-xl py-3 rounded-2xl font-label-bold text-label-bold uppercase tracking-wider text-center btn-chunky border-2 border-on-primary-fixed-variant hover:brightness-105"
                                    >
                                        Continue Learning
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-surface rounded-2xl chunky-border p-lg flex flex-col sm:flex-row items-center gap-lg text-center sm:text-left">
                            <div className="w-32 h-32 rounded-2xl bg-primary-container/20 border-2 border-primary/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[56px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                                    celebration
                                </span>
                            </div>
                            <div className="flex-1 flex flex-col items-center sm:items-start gap-sm">
                                <h2 className="font-headline-lg text-headline-lg text-on-background">All caught up! 🎉</h2>
                                <p className="font-body-md text-body-md text-on-surface-variant">No material lined up right now — sharpen your skills with a quiz.</p>
                                <Link
                                    href={route('student.quiz')}
                                    className="w-full sm:w-auto bg-primary text-on-primary px-xl py-3 rounded-2xl font-label-bold text-label-bold uppercase tracking-wider text-center btn-chunky border-2 border-on-primary-fixed-variant hover:brightness-105"
                                >
                                    Take a Quiz
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* AI Recommendation */}
                    <div className="bg-[#f0e6ff] rounded-2xl chunky-border border-[#e0cbf8] p-lg flex items-center gap-md">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border-2 border-[#e0cbf8] shrink-0">
                            <span className="material-symbols-outlined text-[#8a2be2]" aria-hidden="true">auto_awesome</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-headline-md text-headline-md text-[#4b0082]">AI Recommendation</h3>
                            <p className="font-body-md text-body-md text-[#4b0082]/80 mt-1">{aiRecommendation}</p>
                        </div>
                    </div>

                    {/* Daily Goal */}
                    <div className="bg-surface rounded-2xl chunky-border p-lg flex flex-col gap-md bg-gradient-to-br from-surface to-surface-container-low relative overflow-hidden">
                        <div className="absolute top-2 right-2" aria-hidden="true">
                            <span className="material-symbols-outlined text-primary/20">stars</span>
                        </div>
                        <div className="flex items-center gap-sm">
                            <span className="material-symbols-outlined text-primary" aria-hidden="true">task_alt</span>
                            <h3 className="font-headline-md text-headline-md text-on-background">Daily Goal</h3>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-body-md text-on-surface-variant">
                                {dailyGoal.completed}/{dailyGoal.target} Lessons Completed
                            </span>
                            <span className="font-label-bold text-primary">{goalPct}%</span>
                        </div>
                        <div
                            className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden border border-outline-variant/10"
                            role="progressbar"
                            aria-valuenow={goalPct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Daily goal progress"
                        >
                            <div className="bg-primary h-full rounded-full" style={{ width: `${goalPct}%` }}></div>
                        </div>
                        <p className="text-xs text-on-surface-variant italic">
                            {goalPct >= 100 ? `Daily goal complete — ${user.current_streak ?? 0}-day streak safe!` : `Keep going to maintain your ${user.current_streak ?? 0}-day streak!`}
                        </p>
                    </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-lg">
                    {/* Overall Progress + Recent Quiz */}
                    <div className="grid grid-cols-2 gap-md">
                        <div className="bg-surface rounded-2xl chunky-border p-md flex flex-col items-center text-center justify-center">
                            <ProgressRing pct={overallProgress} label="Overall progress" />
                            <span className="font-label-bold text-label-bold text-on-surface-variant mt-3">Overall Progress</span>
                        </div>
                        <div className="bg-surface rounded-2xl chunky-border p-md flex flex-col items-center text-center justify-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-tertiary-fixed flex items-center justify-center border-2 border-tertiary-container">
                                <span className="font-headline-md text-headline-md text-on-tertiary-fixed font-black">
                                    {recentQuiz ? `${Math.round(recentQuiz.score)}` : '—'}
                                </span>
                            </div>
                            <span className="font-label-bold text-label-bold text-on-surface-variant mt-3">Recent Quiz</span>
                            {recentQuiz?.title && <span className="text-xs text-on-surface-variant truncate max-w-full px-1">{recentQuiz.title}</span>}
                        </div>
                    </div>

                    {/* Upcoming */}
                    <div className="bg-surface rounded-2xl chunky-border p-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-headline-md text-headline-md text-on-background">Upcoming</h3>
                            <Link href={route('student.schedule')} className="text-secondary font-label-bold text-label-bold hover:underline">
                                See All
                            </Link>
                        </div>
                        {upcoming.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {upcoming.map((event) => (
                                    <UpcomingRow key={event.id} event={event} />
                                ))}
                            </div>
                        ) : (
                            <p className="font-body-md text-body-md text-on-surface-variant py-md text-center">Nothing scheduled — enjoy the break!</p>
                        )}
                    </div>

                    {/* Leaderboard Top 5 */}
                    <div className="bg-surface rounded-2xl chunky-border p-md flex flex-col gap-md relative overflow-hidden">
                        <div className="absolute -top-2 -right-2 opacity-20" aria-hidden="true">
                            <span className="material-symbols-outlined text-primary text-display">auto_awesome</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <h3 className="font-headline-md text-headline-md text-on-background">Leaderboard</h3>
                            <Link href={route('student.leaderboard')} className="text-primary font-label-bold text-xs bg-primary-container/20 px-2 py-1 rounded-full hover:underline">
                                Top 5
                            </Link>
                        </div>
                        {leaderboardTop.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {leaderboardTop.map((entry) => (
                                    <div
                                        key={entry.rank}
                                        className={`flex items-center gap-sm p-2 rounded-xl border-2 ${
                                            entry.is_you ? 'bg-secondary-container/10 border-secondary-container/30' : 'border-transparent'
                                        }`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                                entry.rank === 1 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                                            }`}
                                        >
                                            {entry.rank}
                                        </div>
                                        <img
                                            src={avatarUrl(entry)}
                                            alt={`${entry.name} avatar`}
                                            className="w-8 h-8 rounded-full object-cover border border-outline-variant"
                                            loading="lazy"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-label-bold text-sm truncate ${entry.is_you ? 'text-secondary' : ''}`}>
                                                {entry.name} {entry.is_you && <span className="text-[10px] text-on-surface-variant">(You)</span>}
                                            </p>
                                            <p className="text-[10px] text-on-surface-variant">{entry.xp.toLocaleString()} XP</p>
                                        </div>
                                        {entry.rank === 1 && <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm" aria-hidden="true">military_tech</span>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="font-body-md text-body-md text-on-surface-variant py-md text-center">No rankings yet this week.</p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
