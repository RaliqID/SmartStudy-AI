import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

/* Static maps — Tailwind JIT cannot see dynamically built class strings */

const subjectMeta = {
    Mathematics: { icon: 'calculate', color: '#00BCD4', bg: '#E0F7FA' },
    Physics: { icon: 'science', color: '#FF9800', bg: '#FFF3E0' },
    Programming: { icon: 'terminal', color: '#3F51B5', bg: '#E8EAF6' },
    Biology: { icon: 'biotech', color: '#4CAF50', bg: '#E8F5E9' },
    Chemistry: { icon: 'experiment', color: '#E91E63', bg: '#FCE4EC' },
    History: { icon: 'history_edu', color: '#FBC02D', bg: '#FFFDE7' },
};
const fallbackMeta = { icon: 'quiz', color: '#006590', bg: '#C8E6FF' };

const difficultyStyles = {
    easy: 'bg-primary-container text-on-primary-container border-primary',
    medium: 'bg-secondary-container text-on-secondary-container border-secondary',
    hard: 'bg-error-container text-on-error-container border-error',
};

const tabs = [
    { key: 'available', label: 'Available', icon: 'play_circle' },
    { key: 'recommended', label: 'Recommended', icon: 'auto_awesome' },
    { key: 'completed', label: 'Completed', icon: 'task_alt' },
];

function StatTile({ icon, circleClasses, value, label }) {
    return (
        <div className="flex flex-col items-center gap-xs bg-surface-container-lowest/60 border-2 border-on-tertiary-fixed/10 rounded-2xl p-sm text-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-b-4 ${circleClasses}`}>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                    {icon}
                </span>
            </div>
            <span className="font-headline-lg text-headline-lg text-on-tertiary-fixed">{value}</span>
            <span className="font-label-bold text-label-bold text-on-tertiary-fixed-variant uppercase text-[10px]">{label}</span>
        </div>
    );
}

function QuizCard({ quiz, starting, onStart }) {
    // Controller sends subject as object: { id, name, slug, icon, color } | null
    const subjectName = quiz.subject?.name || 'General';
    const meta = subjectMeta[subjectName] || fallbackMeta;
    const subjectIcon = quiz.subject?.icon || meta.icon;
    const subjectColor = quiz.subject?.color || meta.color;
    const subjectBg = meta.bg;
    const difficulty = (quiz.difficulty || '').toLowerCase();
    const diffClasses = difficultyStyles[difficulty] || difficultyStyles.medium;
    const isCompleted = quiz.status === 'completed';
    const isRecommended = quiz.status === 'recommended';
    const isStarting = starting === quiz.id;

    return (
        <div
            className="bg-surface-container-lowest border-2 border-surface-container-highest border-b-4 rounded-2xl p-lg flex flex-col hover:translate-y-[-2px] transition-transform relative"
            style={{
                backgroundImage: `radial-gradient(circle at 10% 20%, ${subjectColor}0a 0%, transparent 25%), radial-gradient(circle at 90% 80%, ${subjectColor}0a 0%, transparent 25%)`,
            }}
        >
            {/* Top row: subject icon + difficulty badge */}
            <div className="flex justify-between items-start gap-sm mb-md">
                <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-surface-container-highest shrink-0" style={{ backgroundColor: subjectBg, color: subjectColor }}>
                    <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                        {subjectIcon}
                    </span>
                </div>
                <div className="flex flex-col items-end gap-xs">
                    <span className={`px-sm py-xs rounded-full font-label-bold text-label-bold uppercase border-2 ${diffClasses}`}>
                        {difficulty || 'medium'}
                    </span>
                    {isRecommended && (
                        <span className="flex items-center gap-1 px-sm py-xs rounded-full font-label-bold text-label-bold uppercase bg-primary-container text-on-primary-container border-2 border-primary">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">auto_awesome</span>
                            AI Pick
                        </span>
                    )}
                </div>
            </div>

            {/* Title + subject */}
            <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{quiz.title}</h3>
            <p className="font-label-bold text-label-bold text-on-surface-variant uppercase text-xs mb-md">{subjectName}</p>

            {/* Meta row: questions, duration, XP */}
            <div className="flex flex-wrap gap-sm text-on-surface-variant mb-lg font-body-md text-body-md">
                <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">format_list_bulleted</span>
                    {quiz.questions_count} Qs
                </span>
                <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">timer</span>
                    {quiz.duration_minutes} min
                </span>
                <span className="flex items-center gap-1 text-tertiary">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">bolt</span>
                    +{quiz.xp_reward} XP
                </span>
            </div>

            {/* Footer: Start / Review */}
            {isCompleted ? (
                <div className="mt-auto flex items-center justify-between gap-md flex-wrap">
                    <div>
                        <span className="block font-headline-lg text-headline-lg text-primary">
                            {typeof quiz.last_score === 'number' ? `${quiz.last_score}%` : 'Done'}
                        </span>
                        <span className="block font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">Score</span>
                    </div>
                    {quiz.last_attempt_id ? (
                        <Link
                            href={`/student/quiz/attempt/${quiz.last_attempt_id}/result`}
                            preserveScroll
                            className="bg-surface-container text-on-surface px-md py-sm rounded-xl font-label-bold text-label-bold uppercase tracking-wider border-2 border-surface-container-highest btn-chunky hover:bg-surface-container-high transition-colors whitespace-nowrap"
                        >
                            Review
                        </Link>
                    ) : (
                        <span className="font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">Completed</span>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => onStart(quiz)}
                    disabled={isStarting}
                    className="mt-auto w-full bg-primary-container text-on-primary-container font-label-bold text-label-bold py-sm px-lg rounded-xl uppercase tracking-wider btn-chunky border-2 border-primary hover:brightness-105 disabled:opacity-60"
                >
                    {isStarting ? 'Starting...' : 'Start Quiz'}
                </button>
            )}
        </div>
    );
}

export default function QuizList({ auth, quizzes = [], weeklyStats = {} }) {
    const [activeTab, setActiveTab] = useState('available');
    const [startingId, setStartingId] = useState(null);

    const { quizzes_taken = 0, avg_score = 0, xp_earned = 0 } = weeklyStats;

    const startQuiz = (quiz) => {
        if (startingId) return;
        setStartingId(quiz.id);
        router.post(
            route('student.quiz.start', quiz.id),
            {},
            { onFinish: () => setStartingId(null) },
        );
    };

    const filtered = quizzes.filter((q) => (q.status || 'available').toLowerCase() === activeTab);
    const activeTabLabel = tabs.find((t) => t.key === activeTab)?.label || '';

    return (
        <AppLayout auth={auth}>
            {/* Header */}
            <header className="mb-lg">
                <h1 className="font-display text-display text-on-background mb-xs">Quizzes</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Ready to test your knowledge?</p>
            </header>

            {/* Weekly stats strip */}
            <div className="mb-xl bg-tertiary-fixed border-2 border-tertiary-fixed-dim border-b-4 rounded-3xl p-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-tertiary-container rounded-full opacity-20" aria-hidden="true"></div>
                <h2 className="font-headline-md text-headline-md text-on-tertiary-fixed mb-md relative z-10">This Week</h2>
                <div className="grid grid-cols-3 gap-sm relative z-10">
                    <StatTile
                        icon="local_fire_department"
                        circleClasses="bg-tertiary-container text-on-tertiary-container border-tertiary"
                        value={quizzes_taken}
                        label="Quizzes Taken"
                    />
                    <StatTile
                        icon="star"
                        circleClasses="bg-primary-container text-on-primary-container border-primary"
                        value={`${avg_score}%`}
                        label="Avg Score"
                    />
                    <StatTile
                        icon="bolt"
                        circleClasses="bg-secondary-container text-on-secondary-container border-secondary"
                        value={xp_earned.toLocaleString()}
                        label="XP Earned"
                    />
                </div>
            </div>

            {/* Tabs / Filter */}
            <div
                className="flex gap-xs mb-lg p-xs bg-surface-container border-2 border-surface-container-highest rounded-2xl overflow-x-auto"
                role="tablist"
                aria-label="Quiz filters"
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 min-w-max flex items-center justify-center gap-xs px-sm py-sm rounded-xl font-label-bold text-label-bold uppercase transition-all ${
                                isActive
                                    ? 'bg-secondary-container text-on-secondary-container border-2 border-b-4 border-secondary'
                                    : 'text-on-surface-variant hover:bg-surface-container-high border-2 border-transparent'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base" aria-hidden="true">
                                {tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Quiz grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg pb-xl">
                {filtered.length > 0 ? (
                    filtered.map((quiz) => (
                        <QuizCard key={quiz.id} quiz={quiz} starting={startingId} onStart={startQuiz} />
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center gap-sm border-2 border-dashed border-outline-variant rounded-3xl p-xl text-center bg-surface-container/50">
                        <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">
                            search_off
                        </span>
                        <p className="font-headline-md text-headline-md text-on-surface-variant">No {activeTabLabel.toLowerCase()} quizzes right now</p>
                        <p className="font-body-md text-body-md text-on-surface-variant/70">Check another tab to keep the streak going!</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
