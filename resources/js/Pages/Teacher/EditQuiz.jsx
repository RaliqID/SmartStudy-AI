import { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import TeacherLayout from '@/Layouts/TeacherLayout';

function QuestionCard({ question, quizId, onDelete }) {
    return (
        <div className="bg-surface-container-lowest rounded-2xl border-2 border-surface-container-highest border-b-4 p-md">
            <div className="flex items-start justify-between gap-sm">
                <p className="font-body-lg text-body-lg font-bold text-on-surface flex-1">{question.question_text}</p>
                <button
                    type="button"
                    onClick={() => { if (confirm('Remove this question?')) onDelete(question); }}
                    aria-label="Remove question"
                    className="w-9 h-9 rounded-xl bg-error-container/10 text-error flex items-center justify-center border-2 border-error/20 border-b-4 hover:bg-error-container/20 shrink-0"
                >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs mt-sm">
                {question.options.map((opt) => (
                    <div key={opt.id} className={`flex items-center gap-2 p-sm rounded-xl border-2 ${opt.is_correct ? 'bg-primary-container/10 border-primary/30' : 'border-outline-variant/40'}`}>
                        <span className={`material-symbols-outlined text-[18px] shrink-0 ${opt.is_correct ? 'text-primary' : 'text-on-surface-variant/40'}`} style={{ fontVariationSettings: opt.is_correct ? "'FILL' 1" : undefined }} aria-hidden="true">
                            {opt.is_correct ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className={`font-body-md text-body-md ${opt.is_correct ? 'text-primary font-bold' : 'text-on-surface-variant'} truncate`}>{opt.option_text}</span>
                    </div>
                ))}
            </div>
            {question.explanation && (
                <div className="mt-sm p-sm bg-secondary-fixed/30 border-2 border-secondary/20 rounded-xl flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-[18px] shrink-0" aria-hidden="true">lightbulb</span>
                    <p className="text-xs font-body-md text-on-secondary-fixed-variant">{question.explanation}</p>
                </div>
            )}
        </div>
    );
}

export default function EditQuiz({ auth, quiz, subjects = [] }) {
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const flash = usePage().props.flash;

    // Quiz detail form
    const detailForm = useForm({
        title: quiz.title,
        description: quiz.description || '',
        subject_id: quiz.subject_id,
        difficulty: quiz.difficulty,
        duration_minutes: quiz.duration_minutes,
        xp_reward: quiz.xp_reward,
        passing_score: quiz.passing_score,
    });

    // Add question form — 4 options, one correct (radio)
    const questionForm = useForm({
        question_text: '',
        type: 'multiple_choice',
        explanation: '',
        points: 1,
        correct_index: 0,
        options: [
            { option_text: '', is_correct: true },
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
        ],
    });

    const saveDetails = (e) => {
        e.preventDefault();
        detailForm.put(route('teacher.quizzes.update', quiz.id));
    };

    const addQuestion = (e) => {
        e.preventDefault();
        const payload = {
            question_text: questionForm.data.question_text,
            type: questionForm.data.type,
            explanation: questionForm.data.explanation || null,
            points: questionForm.data.points,
            options: questionForm.data.options.map((opt, i) => ({
                option_text: opt.option_text,
                is_correct: i === questionForm.data.correct_index,
            })),
        };
        questionForm.post(route('teacher.quizzes.storeQuestion', quiz.id), {
            data: payload,
            onSuccess: () => {
                questionForm.reset();
                setShowQuestionForm(false);
            },
        });
    };

    const deleteQuestion = (question) => {
        router.delete(route('teacher.quizzes.destroyQuestion', [quiz.id, question.id]));
    };

    const togglePublish = () => {
        router.patch(route('teacher.quizzes.publish', quiz.id), {}, { preserveScroll: true });
    };

    const field = 'w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary';
    const label = 'font-label-bold text-label-bold text-on-surface-variant uppercase';

    return (
        <TeacherLayout auth={auth}>
            {/* Header */}
            <header className="mb-lg flex flex-wrap items-center justify-between gap-sm">
                <div className="min-w-0">
                    <nav className="flex items-center gap-2 text-on-surface-variant font-label-bold text-label-bold uppercase mb-1" aria-label="Breadcrumb">
                        <Link href={route('teacher.quizzes.index')} className="hover:text-primary transition-colors">Quizzes</Link>
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
                        <span className="text-on-surface truncate">{quiz.title}</span>
                    </nav>
                    <div className="flex items-center gap-sm flex-wrap">
                        <h1 className="font-display text-display text-on-background truncate">{quiz.title}</h1>
                        <span className={`px-sm py-xs rounded-full font-label-bold text-label-bold uppercase border-2 text-xs shrink-0 ${quiz.is_published ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container-high text-on-surface-variant border-surface-container-highest'}`}>
                            {quiz.is_published ? 'Published' : 'Draft'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-sm">
                    <button type="button" onClick={togglePublish}
                        className={`px-md py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 ${quiz.is_published ? 'bg-surface-container text-on-surface border-surface-container-highest hover:bg-surface-container-high' : 'bg-primary text-on-primary border-on-primary-fixed-variant hover:brightness-105'}`}>
                        {quiz.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <Link href={route('teacher.quizzes.index')} className="px-md py-sm rounded-2xl font-label-bold text-label-bold uppercase bg-surface-container text-on-surface btn-chunky border-2 border-surface-container-highest hover:bg-surface-container-high">
                        Back
                    </Link>
                </div>
            </header>

            {flash?.success && (
                <div className="mb-lg bg-primary-container/10 border-2 border-primary/30 rounded-2xl p-md flex items-start gap-sm" role="status">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                    <p className="font-body-md text-body-md text-primary font-bold">{flash.success}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start pb-xl">
                {/* Questions list */}
                <div className="lg:col-span-2 flex flex-col gap-md">
                    <div className="flex items-center justify-between">
                        <h2 className="font-headline-lg text-headline-lg text-on-surface">Questions ({quiz.questions.length})</h2>
                        <button type="button" onClick={() => setShowQuestionForm(!showQuestionForm)} className="flex items-center gap-1 bg-primary-container text-on-primary-container px-md py-xs rounded-xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-primary">
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                            {showQuestionForm ? 'Close Form' : 'Add Question'}
                        </button>
                    </div>

                    {/* Add question form */}
                    {showQuestionForm && (
                        <form onSubmit={addQuestion} className="bg-surface rounded-2xl chunky-border p-lg flex flex-col gap-sm">
                            <h3 className="font-headline-md text-headline-md text-on-surface">New Question</h3>
                            <div>
                                <label htmlFor="q-text" className={label}>Question Text</label>
                                <textarea id="q-text" rows={2} required value={questionForm.data.question_text}
                                    onChange={(e) => questionForm.setData('question_text', e.target.value)}
                                    placeholder="What is the slope of y = 2x + 3?"
                                    className={`${field} resize-y`} />
                                {questionForm.errors.question_text && <p className="font-label-bold text-label-bold text-error mt-1">{questionForm.errors.question_text}</p>}
                            </div>

                            <div>
                                <span className={label}>Options — select the correct one</span>
                                <div className="flex flex-col gap-xs mt-1">
                                    {questionForm.data.options.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-sm">
                                            <label className="flex items-center gap-1 cursor-pointer shrink-0" title={`Mark option ${i + 1} as correct`}>
                                                <input
                                                    type="radio"
                                                    name="correct-option"
                                                    checked={questionForm.data.correct_index === i}
                                                    onChange={() => questionForm.setData('correct_index', i)}
                                                    className="w-5 h-5 text-primary focus:ring-primary"
                                                    aria-label={`Option ${i + 1} is correct`}
                                                />
                                            </label>
                                            <input
                                                type="text"
                                                value={opt.option_text}
                                                onChange={(e) => questionForm.setData(`options.${i}.option_text`, e.target.value)}
                                                placeholder={`Option ${i + 1}`}
                                                required
                                                className="flex-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {questionForm.errors['options.0.option_text'] && <p className="font-label-bold text-label-bold text-error mt-1">{questionForm.errors['options.0.option_text']}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-sm">
                                <div>
                                    <label htmlFor="q-explanation" className={label}>Explanation (optional)</label>
                                    <input id="q-explanation" type="text" value={questionForm.data.explanation}
                                        onChange={(e) => questionForm.setData('explanation', e.target.value)}
                                        placeholder="Slope is the coefficient of x"
                                        className={field} />
                                </div>
                                <div>
                                    <label htmlFor="q-points" className={label}>Points</label>
                                    <input id="q-points" type="number" min="1" max="100" value={questionForm.data.points}
                                        onChange={(e) => questionForm.setData('points', e.target.value)} className={field} />
                                </div>
                            </div>

                            <button type="submit" disabled={questionForm.processing}
                                className="mt-sm w-full bg-primary text-on-primary py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-on-primary-fixed-variant hover:brightness-105 disabled:opacity-60">
                                {questionForm.processing ? 'Adding…' : 'Add Question'}
                            </button>
                        </form>
                    )}

                    {/* Existing questions */}
                    {quiz.questions.length > 0 ? (
                        <div className="flex flex-col gap-md">
                            {quiz.questions.map((q) => (
                                <QuestionCard key={q.id} question={q} quizId={quiz.id} onDelete={deleteQuestion} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">help</span>
                            <p className="font-headline-md text-headline-md text-on-surface">No questions yet</p>
                            <p className="font-body-md text-body-md text-on-surface-variant">Add at least one question before publishing.</p>
                        </div>
                    )}
                </div>

                {/* Quiz details form (right column) */}
                <div className="bg-surface rounded-2xl chunky-border p-lg">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">Quiz Details</h2>
                    <form onSubmit={saveDetails} className="flex flex-col gap-sm">
                        <div>
                            <label htmlFor="eq-title" className={label}>Title</label>
                            <input id="eq-title" type="text" required value={detailForm.data.title} onChange={(e) => detailForm.setData('title', e.target.value)} className={field} />
                            {detailForm.errors.title && <p className="font-label-bold text-label-bold text-error mt-1">{detailForm.errors.title}</p>}
                        </div>
                        <div>
                            <label htmlFor="eq-desc" className={label}>Description</label>
                            <textarea id="eq-desc" rows={2} value={detailForm.data.description} onChange={(e) => detailForm.setData('description', e.target.value)} className={`${field} resize-y`} />
                        </div>
                        <div>
                            <label htmlFor="eq-subject" className={label}>Subject</label>
                            <select id="eq-subject" value={detailForm.data.subject_id} onChange={(e) => detailForm.setData('subject_id', e.target.value)} required className={field}>
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="eq-diff" className={label}>Difficulty</label>
                            <select id="eq-diff" value={detailForm.data.difficulty} onChange={(e) => detailForm.setData('difficulty', e.target.value)} className={field}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-3 gap-sm">
                            <div>
                                <label htmlFor="eq-dur" className={label}>Min</label>
                                <input id="eq-dur" type="number" min="1" max="180" value={detailForm.data.duration_minutes} onChange={(e) => detailForm.setData('duration_minutes', e.target.value)} className={field} />
                            </div>
                            <div>
                                <label htmlFor="eq-xp" className={label}>XP</label>
                                <input id="eq-xp" type="number" min="0" max="1000" value={detailForm.data.xp_reward} onChange={(e) => detailForm.setData('xp_reward', e.target.value)} className={field} />
                            </div>
                            <div>
                                <label htmlFor="eq-pass" className={label}>Pass</label>
                                <input id="eq-pass" type="number" min="0" max="100" value={detailForm.data.passing_score} onChange={(e) => detailForm.setData('passing_score', e.target.value)} className={field} />
                            </div>
                        </div>
                        <button type="submit" disabled={detailForm.processing}
                            className="mt-sm w-full bg-primary-container text-on-primary-container py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-primary hover:brightness-105 disabled:opacity-60">
                            {detailForm.processing ? 'Saving…' : 'Save Details'}
                        </button>
                    </form>
                </div>
            </div>
        </TeacherLayout>
    );
}
