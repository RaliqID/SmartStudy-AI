import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

/**
 * QuizResult — After quiz submission.
 * Props:
 *   attempt: { id, score, earned_points, total_points, status, time_spent_seconds }
 *   review: [ { question_text, selected_option_text, correct_option_text, is_correct, explanation } ]
 */
function ScoreRing({ score, size = 120 }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    className="text-surface-container-high"
                />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="text-primary"
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-black text-on-surface">{score}%</span>
            </div>
        </div>
    );
}

function ReviewItem({ item }) {
    const { question_text, selected_option_text, correct_option_text, is_correct, explanation } = item;
    const borderColor = is_correct ? 'border-primary' : 'border-error';
    const bg = is_correct ? 'bg-primary-container/10' : 'bg-error-container/10';
    const icon = is_correct ? 'check_circle' : 'cancel';
    const iconColor = is_correct ? 'text-primary' : 'text-error';

    return (
        <div className={`border-2 ${borderColor} rounded-2xl p-lg ${bg}`}>
            <div className="flex items-start gap-sm">
                <span className={`material-symbols-outlined ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="font-headline-md text-headline-md text-on-surface mb-sm">{question_text}</p>
                    <div className="flex flex-wrap gap-md text-sm">
                        <div>
                            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase">Your answer:</span>
                            <span className={`font-body-md ${is_correct ? 'text-primary' : 'text-error'}`}>
                                {selected_option_text || 'Not answered'}
                            </span>
                        </div>
                        {!is_correct && (
                            <div>
                                <span className="font-label-bold text-label-bold text-on-surface-variant uppercase">Correct:</span>
                                <span className="font-body-md text-primary">{correct_option_text}</span>
                            </div>
                        )}
                    </div>
                    {explanation && (
                        <div className="mt-sm p-sm bg-surface-container border-2 border-surface-container-highest rounded-xl">
                            <p className="font-body-md text-body-md text-on-surface-variant">{explanation}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function QuizResult({ auth, attempt, review = [] }) {
    const { score, earned_points, total_points, status, time_spent_seconds } = attempt;
    const passed = status === 'passed' || score >= 70;
    const minutes = Math.floor(time_spent_seconds / 60);
    const seconds = time_spent_seconds % 60;
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    return (
        <AppLayout auth={auth}>
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-xl text-center">
                    <h1 className="font-display text-display text-on-background mb-xs">Quiz Complete!</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant">
                        {passed ? 'Great job! You passed.' : 'Keep practicing, you\'ll get it next time.'}
                    </p>
                </div>

                {/* Score card */}
                <div className="bg-surface-container-lowest rounded-3xl border-2 border-surface-container-highest border-b-4 p-lg md:p-xl text-center mb-xl">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-lg">
                        <ScoreRing score={score} />
                        <div className="flex flex-col items-center md:items-start gap-sm">
                            <div className="flex items-center gap-sm">
                                <span className={`font-label-bold text-label-bold uppercase px-sm py-xs rounded-full border-2 ${passed ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-error-container text-on-error-container border-error'}`}>
                                    {passed ? 'Passed' : 'Failed'}
                                </span>
                                <span className="font-body-md text-body-md text-on-surface-variant">{score}%</span>
                            </div>
                            <div className="flex gap-sm text-on-surface-variant">
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm" aria-hidden="true">bolt</span>
                                    +{earned_points} XP
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm" aria-hidden="true">timer</span>
                                    {timeStr}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review list */}
                {review.length > 0 && (
                    <div id="review" className="mt-lg scroll-mt-24">
                        <h2 className="font-headline-md text-headline-md text-on-surface mb-md">Review Answers</h2>
                        <div className="flex flex-col gap-md">
                            {review.map((item, idx) => (
                                <ReviewItem key={idx} item={item} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-xl flex flex-col sm:flex-row gap-sm justify-center">
                    <Link
                        href={route('student.quiz')}
                        preserveScroll
                        className="flex items-center justify-center gap-2 px-lg py-sm rounded-2xl font-label-bold text-label-bold uppercase bg-surface-container text-on-surface border-2 border-surface-container-highest btn-chunky hover:bg-surface-container-high transition-colors"
                    >
                        <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
                        Back to Quiz List
                    </Link>
                    <a
                        href="#review"
                        className={`flex items-center justify-center gap-2 px-lg py-sm rounded-2xl font-label-bold text-label-bold uppercase bg-primary-container text-on-primary-container border-2 border-primary btn-chunky hover:brightness-105 transition-colors ${review.length === 0 ? 'pointer-events-none opacity-40' : ''}`}
                        aria-disabled={review.length === 0}
                    >
                        <span className="material-symbols-outlined" aria-hidden="true">fact_check</span>
                        Review Answers
                    </a>
                </div>
            </div>
        </AppLayout>
    );
}