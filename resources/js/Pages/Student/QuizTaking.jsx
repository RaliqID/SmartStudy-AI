import { useState, useEffect, useReducer } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

/**
 * QuizTaking — Active quiz session with timer, navigation, answer selection.
 * Props:
 *   quiz: { id, title, duration_minutes }
 *   attempt: { id }
 *   questions: [{ id, question_text, type, options: [{ id, option_text }] }]
 */
const initialState = {
    answers: {}, // questionId -> optionId
    currentIndex: 0,
};

function reducer(state, action) {
    switch (action.type) {
        case 'SELECT_ANSWER':
            return {
                ...state,
                answers: { ...state.answers, [action.questionId]: action.optionId },
            };
        case 'GO_TO_QUESTION':
            return { ...state, currentIndex: action.index };
        case 'NEXT':
            return { ...state, currentIndex: Math.min(state.currentIndex + 1, action.total - 1) };
        case 'PREV':
            return { ...state, currentIndex: Math.max(state.currentIndex - 1, 0) };
        default:
            return state;
    }
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function QuizTaking({ auth, quiz, attempt, questions }) {
    const [state, dispatch] = useReducer(reducer, {
        answers: {},
        currentIndex: 0,
    });
    const { answers, currentIndex } = state;
    const total = questions.length;
    const current = questions[currentIndex];

    // Timer state (seconds remaining)
    const [timeLeft, setTimeLeft] = useState(quiz.duration_minutes * 60);
    const [submitted, setSubmitted] = useState(false);

    // Countdown
    useEffect(() => {
        if (timeLeft <= 0 || submitted) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, submitted]);

    // Auto-submit when timer hits zero — separate effect, stable dep
    useEffect(() => {
        if (timeLeft === 0 && !submitted) {
            handleSubmit();
        }
    }, [timeLeft, submitted]);

    const handleSelect = (questionId, optionId) => {
        dispatch({ type: 'SELECT_ANSWER', questionId, optionId });
    };

    const goTo = (index) => {
        if (index >= 0 && index < total) {
            dispatch({ type: 'GO_TO_QUESTION', index });
        }
    };

    const next = () => {
        if (currentIndex < total - 1) {
            dispatch({ type: 'NEXT', total });
        }
    };

    const prev = () => {
        if (currentIndex > 0) {
            dispatch({ type: 'PREV' });
        }
    };

    const handleSubmit = () => {
        if (submitted) return;
        setSubmitted(true);
        // Convert answers to format: { question_id: option_id }
        const payload = { answers };
        router.post(
            route('student.quiz.submit', quiz.id),
            payload,
            {
                onFinish: () => setSubmitted(false),
            }
        );
    };

    // Answer progress: how many answered
    const answeredCount = Object.keys(answers).length;
    const progressPercent = Math.round((answeredCount / total) * 100);

    const isAnswered = (questionId) => answers[questionId] !== undefined;

    return (
        <AppLayout auth={auth}>
            <div className="max-w-3xl mx-auto">
                {/* Header: Title + Timer */}
                <div className="mb-lg flex flex-wrap items-start justify-between gap-sm">
                    <div>
                        <h1 className="font-display text-display text-on-background mb-xs">{quiz.title}</h1>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                            Question {currentIndex + 1} of {total}
                        </p>
                    </div>
                    <div className="flex items-center gap-sm bg-surface-container border-2 border-surface-container-highest rounded-2xl px-md py-sm border-b-4">
                        <span className="material-symbols-outlined text-secondary" aria-hidden="true">timer</span>
                        <span className="font-headline-md text-headline-md text-on-surface font-bold tabular-nums">
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div
                    className="w-full h-4 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/20 mb-lg"
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Quiz progress"
                >
                    <div
                        className="h-full bg-primary-container rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>

                {/* Question card */}
                <div className="bg-surface-container-lowest rounded-3xl border-2 border-surface-container-highest border-b-4 p-lg md:p-xl">
                    <p className="font-headline-md text-headline-md text-on-surface mb-md">{current.question_text}</p>

                    {/* Options */}
                    <div className="flex flex-col gap-sm mt-md">
                        {current.options.map((option) => {
                            const selected = answers[current.id] === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleSelect(current.id, option.id)}
                                    className={`text-left px-md py-sm rounded-2xl font-body-lg text-body-lg transition-all border-2 ${
                                        selected
                                            ? 'border-4 border-secondary bg-secondary-fixed text-on-secondary-container'
                                            : 'border-2 border-outline-variant bg-surface-container-lowest hover:bg-surface-container'
                                    }`}
                                >
                                    <span className="flex items-center gap-sm">
                                        <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0">
                                            {selected ? '✓' : ''}
                                        </span>
                                        {option.option_text}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Navigation buttons */}
                    <div className="mt-lg flex flex-wrap items-center justify-between gap-sm">
                        <button
                            type="button"
                            onClick={prev}
                            disabled={currentIndex === 0}
                            className="flex items-center gap-1 px-md py-sm rounded-xl font-label-bold text-label-bold uppercase border-2 border-outline-variant bg-surface-container hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
                            Previous
                        </button>

                        <span className="font-body-md text-body-md text-on-surface-variant">
                            {currentIndex + 1} / {total}
                        </span>

                        {currentIndex === total - 1 ? (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitted}
                                className="flex items-center gap-1 px-lg py-sm rounded-xl font-label-bold text-label-bold uppercase bg-primary-container text-on-primary-container border-2 border-primary btn-chunky hover:brightness-105 disabled:opacity-60"
                            >
                                {submitted ? 'Submitting...' : 'Submit Quiz'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={next}
                                className="flex items-center gap-1 px-md py-sm rounded-xl font-label-bold text-label-bold uppercase border-2 border-outline-variant bg-surface-container hover:bg-surface-container-high"
                            >
                                Next
                                <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Question number dots (mobile-friendly) */}
                <div className="mt-lg flex flex-wrap gap-2 justify-center">
                    {questions.map((q, idx) => {
                        const answered = isAnswered(q.id);
                        const isActive = idx === currentIndex;
                        return (
                            <button
                                key={q.id}
                                type="button"
                                onClick={() => goTo(idx)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    isActive
                                        ? 'border-secondary bg-secondary text-on-secondary'
                                        : answered
                                        ? 'border-primary-container bg-primary-container text-on-primary-container'
                                        : 'border-outline-variant bg-surface-container'
                                }`}
                                aria-label={`Go to question ${idx + 1}`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}