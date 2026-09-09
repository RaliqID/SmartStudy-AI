import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

/**
 * Progress — overall stats, streak calendar, subject mastery, achievements, daily quests.
 *
 * Props:
 *   overall: number (0-100)
 *   avgScore: number
 *   streak: { current, longest }
 *   subjectMastery: [{ name, icon, color, mastery_percentage, materials_completed, quizzes_completed, average_score }]
 *   streakCalendar: [{ date: 'YYYY-MM-DD', active: boolean }]
 *   achievements: [{ name, description, icon, unlocked_at, xp_reward }]
 *   quests: [{ name, description, icon, progress, target_value, is_completed, xp_reward }]
 */

const achievementPalettes = [
    { circle: 'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-container' },
    { circle: 'bg-primary-fixed text-on-primary-fixed border-primary-container' },
    { circle: 'bg-secondary-fixed text-on-secondary-fixed border-secondary' },
];

function ChunkyBar({ pct, color, className = 'h-4' }) {
    return (
        <div
            className={`w-full ${className} bg-surface-container-high rounded-full overflow-hidden relative`}
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div className="h-full rounded-full relative" style={{ width: `${pct}%`, backgroundColor: color }}>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 rounded-t-full" aria-hidden="true"></div>
            </div>
        </div>
    );
}

function ScoreRing({ pct }) {
    return (
        <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${pct}, 100`} strokeLinecap="round" strokeWidth="4"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-label-bold text-label-bold font-black text-on-surface tabular-nums">{pct}%</div>
        </div>
    );
}

function MetricCard({ icon, iconClasses, label, value, sublabel }) {
    return (
        <div className="h-full bg-surface-container-lowest rounded-2xl chunky-border p-lg flex flex-col">
            <div className="flex items-center gap-sm mb-md">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconClasses}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        {icon}
                    </span>
                </div>
                <h3 className="font-body-lg text-body-lg text-on-surface-variant">{label}</h3>
            </div>
            <div className="mt-auto flex flex-col">
                <span className={`font-display text-display font-black ${value.classes || 'text-on-surface'}`}>{value.text}</span>
                {sublabel && <span className="font-label-bold text-label-bold text-on-surface-variant/70 uppercase text-xs mt-1">{sublabel}</span>}
            </div>
        </div>
    );
}

export default function Progress({ auth, overall = 0, avgScore = 0, streak = {}, subjectMastery = [], streakCalendar = [], achievements = [], quests = [] }) {
    const freezesLeft = auth?.user?.streak_freezes_left ?? 0;
    const today = new Date().toISOString().slice(0, 10);
    const totalMaterials = subjectMastery.reduce((sum, s) => sum + (s.materials_completed || 0), 0);
    const unlockedAchievements = achievements.filter((a) => a.unlocked_at);
    const activeQuests = quests.filter((q) => !q.is_completed).length;

    return (
        <AppLayout auth={auth}>
            {/* Header */}
            <header className="mb-lg">
                <h1 className="font-display text-display text-on-background mb-xs">Your Progress</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Every study session counts. Keep rolling!</p>
            </header>

            {/* Top Metrics Grid — 2 cols mobile, 6-col on desktop (Overall spans 2) */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-sm sm:gap-lg mb-xl">
                <div className="col-span-2 bg-surface-container-lowest rounded-2xl chunky-border p-lg flex flex-col">
                    <div className="flex items-center gap-sm mb-md">
                        <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">star</span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface">Overall</h3>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-md">
                        <span className="font-display text-display text-secondary tabular-nums">{overall}%</span>
                        <ScoreRing pct={Math.round(overall)} />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <MetricCard
                        icon="emoji_events"
                        iconClasses="bg-tertiary-fixed text-on-tertiary-fixed"
                        label="Avg Score"
                        value={{ text: `${avgScore}%`, classes: 'text-tertiary-container' }}
                    />
                </div>
                <div className="lg:col-span-1">
                    <MetricCard
                        icon="menu_book"
                        iconClasses="bg-primary-fixed text-on-primary-fixed"
                        label="Materials"
                        value={{ text: totalMaterials, classes: 'text-primary' }}
                        sublabel="Completed"
                    />
                </div>
                <div className="lg:col-span-1">
                    <MetricCard
                        icon="local_fire_department"
                        iconClasses="bg-error-container text-on-error-container"
                        label="Streak"
                        value={{ text: `${streak.current || 0} Days`, classes: 'text-error' }}
                        sublabel={`Longest: ${streak.longest || 0} days`}
                    />
                </div>
                <div className="lg:col-span-1">
                <MetricCard
                    icon="ac_unit"
                    iconClasses="bg-secondary-container text-on-secondary-container"
                    label="Streak Freezes"
                    value={{ text: `${freezesLeft}/2`, classes: 'text-secondary' }}
                    sublabel={freezesLeft > 0 ? 'Auto-protects your streak' : 'Refills next month'}
                />
            </div>

            </div>

            {/* Activity & Mastery */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl items-start">
                {/* Streak Calendar */}
                <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl chunky-border p-lg">
                    <div className="flex flex-wrap justify-between items-center gap-sm mb-lg">
                        <h3 className="font-headline-lg text-headline-lg text-on-surface">Streak Calendar</h3>
                        <div className="flex items-center gap-xs" aria-hidden="true">
                            <span className="w-3 h-3 rounded-sm bg-surface-container-high"></span>
                            <span className="w-3 h-3 rounded-sm bg-primary-container"></span>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-xs">
                        {streakCalendar.map((day) => (
                            <div
                                key={day.date}
                                title={day.date}
                                className={`aspect-square rounded-sm sm:rounded-md transition-colors ${
                                    day.active ? 'bg-primary-container' : 'bg-surface-container-high'
                                } ${day.date === today ? 'ring-2 ring-secondary ring-offset-1' : ''}`}
                            ></div>
                        ))}
                    </div>
                    <div className="mt-lg flex items-center gap-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                            local_fire_department
                        </span>
                        <span className="font-label-bold text-label-bold">
                            {streak.current > 0 ? `You're on a ${streak.current}-day roll! Keep it up!` : 'Study today to start a new streak!'}
                        </span>
                    </div>
                </div>

                {/* Right column: Mastery + Daily Quests */}
                <div className="flex flex-col gap-lg">
                    {/* Subject Mastery */}
                    <div className="bg-surface-container-lowest rounded-2xl chunky-border p-lg flex flex-col gap-md">
                        <h3 className="font-headline-lg text-headline-lg text-on-surface">Subject Mastery</h3>
                        {subjectMastery.length > 0 ? (
                            subjectMastery.map((subject) => (
                                <div key={subject.name} className="flex flex-col gap-xs">
                                    <div className="flex items-center justify-between gap-sm">
                                        <span className="flex items-center gap-1 min-w-0">
                                            <span className="material-symbols-outlined text-[18px] shrink-0" style={{ color: subject.color }} aria-hidden="true">
                                                {subject.icon || 'school'}
                                            </span>
                                            <span className="font-body-lg text-body-lg font-bold text-on-surface truncate">{subject.name}</span>
                                        </span>
                                        <span className="font-label-bold text-label-bold shrink-0" style={{ color: subject.color }}>
                                            {subject.mastery_percentage}%
                                        </span>
                                    </div>
                                    <ChunkyBar pct={subject.mastery_percentage || 0} color={subject.color} />
                                    <div className="flex justify-between font-body-md text-body-md text-on-surface-variant/70 text-xs">
                                        <span>{subject.materials_completed} materials</span>
                                        <span>{subject.quizzes_completed} quizzes · avg {subject.average_score}%</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="font-body-md text-body-md text-on-surface-variant">Start learning to build mastery.</p>
                        )}
                        <Link
                            href="/student/subjects"
                            className="mt-auto w-full py-sm bg-surface-container-high hover:bg-surface-container-highest rounded-xl font-label-bold text-label-bold text-on-surface btn-chunky border-2 border-surface-container-highest text-center"
                        >
                            View Subjects
                        </Link>
                    </div>

                    {/* Daily Quests */}
                    <div className="bg-surface-container-lowest rounded-2xl chunky-border p-lg flex flex-col gap-sm">
                        <div className="flex items-center justify-between gap-sm">
                            <h3 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-xs">
                                <span className="material-symbols-outlined text-secondary" aria-hidden="true">bolt</span>
                                Daily Quests
                            </h3>
                            <span className="font-label-bold text-label-bold text-on-surface-variant text-xs uppercase">{activeQuests} left</span>
                        </div>
                        {quests.length > 0 ? (
                            quests.map((quest) => (
                                <div
                                    key={quest.name}
                                    className={`rounded-xl p-sm border-2 flex items-center gap-sm ${
                                        quest.is_completed
                                            ? 'bg-primary-container/10 border-primary/30'
                                            : 'bg-surface-container-low border-surface-container-highest border-b-4'
                                    }`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-b-4 ${
                                            quest.is_completed
                                                ? 'bg-primary-container text-on-primary-container border-primary'
                                                : 'bg-surface-container-high text-on-surface-variant border-surface-container-highest'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                                            {quest.is_completed ? 'check_circle' : quest.icon || 'flag'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-body-md text-body-md font-bold truncate ${quest.is_completed ? 'text-primary' : 'text-on-surface'}`}>
                                            {quest.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-container rounded-full"
                                                    style={{ width: `${Math.min(100, Math.round(((quest.progress || 0) / (quest.target_value || 1)) * 100))}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-label-bold text-label-bold text-xs text-on-surface-variant shrink-0">
                                                {quest.progress}/{quest.target_value}
                                            </span>
                                            <span className="font-label-bold text-label-bold text-xs text-tertiary shrink-0">+{quest.xp_reward} XP</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="font-body-md text-body-md text-on-surface-variant">No quests today. Rest up!</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Achievements Gallery */}
            <div className="mt-xl bg-surface-container-lowest rounded-2xl chunky-border p-lg">
                <div className="flex items-center justify-between gap-sm mb-lg">
                    <h3 className="font-headline-lg text-headline-lg text-on-surface">Achievements Gallery</h3>
                    <span className="font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">
                        {unlockedAchievements.length}/{achievements.length} unlocked
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-md">
                    {achievements.map((achievement, idx) => {
                        const unlocked = Boolean(achievement.unlocked_at);
                        const palette = achievementPalettes[idx % achievementPalettes.length];
                        return (
                            <div
                                key={achievement.name}
                                title={achievement.description}
                                className={`flex flex-col items-center gap-xs ${unlocked ? '' : 'opacity-40 grayscale'}`}
                            >
                                <div
                                    className={`w-16 h-16 rounded-full flex items-center justify-center border-b-4 ${
                                        unlocked ? palette.circle : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: unlocked ? "'FILL' 1" : undefined }} aria-hidden="true">
                                        {unlocked ? achievement.icon : 'lock'}
                                    </span>
                                </div>
                                <span className="font-label-bold text-label-bold text-center">{achievement.name}</span>
                                {unlocked ? (
                                    <span className="font-label-bold text-label-bold text-tertiary text-[10px] uppercase">+{achievement.xp_reward} XP</span>
                                ) : (
                                    <span className="font-label-bold text-label-bold text-outline text-[10px] uppercase">Locked</span>
                                )}
                            </div>
                        );
                    })}
                    {achievements.length === 0 && (
                        <p className="col-span-full font-body-md text-body-md text-on-surface-variant text-center py-lg">
                            Complete quizzes and lessons to earn your first badges!
                        </p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
