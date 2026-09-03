import { Link, router } from '@inertiajs/react';
import TeacherLayout from '@/Layouts/TeacherLayout';

const difficultyStyles = {
    easy:   'bg-primary-container text-on-primary-container border-primary',
    medium: 'bg-secondary-container text-on-secondary-container border-secondary',
    hard:   'bg-error-container text-on-error-container border-error',
};

function QuizRow({ quiz }) {
    const diff = (quiz.difficulty || 'medium').toLowerCase();
    const diffClasses = difficultyStyles[diff] || difficultyStyles.medium;
    const color = quiz.subject?.color || '#006590';

    return (
        <div className={`flex items-center gap-md p-md rounded-2xl border-2 border-b-4 bg-surface-container-lowest transition-opacity ${quiz.is_published ? '' : 'opacity-70'}`}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-b-4" style={{ backgroundColor: `${color}1a`, color, borderColor: `${color}33` }}>
                <span className="material-symbols-outlined" aria-hidden="true">quiz</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-body-lg text-body-lg font-bold text-on-surface truncate">{quiz.title}</p>
                <p className="font-body-md text-body-md text-on-surface-variant truncate">
                    {quiz.subject?.name || '—'} · {quiz.questions_count} questions · {quiz.attempts_count} attempts
                </p>
            </div>
            <div className="hidden sm:flex items-center gap-sm shrink-0">
                <span className={`px-sm py-xs rounded-full font-label-bold text-label-bold uppercase border-2 text-xs ${diffClasses}`}>{diff}</span>
                <button
                    type="button"
                    onClick={() => router.patch(route('teacher.quizzes.publish', quiz.id))}
                    className={`px-sm py-xs rounded-full font-label-bold text-label-bold uppercase border-2 text-xs transition-colors ${
                        quiz.is_published ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container-high text-on-surface-variant border-surface-container-highest'
                    }`}
                    title={quiz.is_published ? 'Published — click to unpublish' : 'Draft — click to publish'}
                    aria-label={quiz.is_published ? `Unpublish ${quiz.title}` : `Publish ${quiz.title}`}
                >
                    {quiz.is_published ? 'Published' : 'Draft'}
                </button>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Link href={route('teacher.quizzes.edit', quiz.id)} className="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-high" aria-label={`Edit ${quiz.title}`}>
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit</span>
                </Link>
                <button
                    type="button"
                    onClick={() => { if (confirm(`Delete "${quiz.title}"?`)) router.delete(route('teacher.quizzes.destroy', quiz.id)); }}
                    className="w-9 h-9 rounded-xl bg-error-container/10 text-error flex items-center justify-center border-2 border-error/20 border-b-4 hover:bg-error-container/20"
                    aria-label={`Delete ${quiz.title}`}
                >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                </button>
            </div>
        </div>
    );
}

export default function QuizList({ auth, quizzes = [] }) {
    return (
        <TeacherLayout auth={auth}>
            <header className="mb-lg flex flex-wrap items-end justify-between gap-sm">
                <div>
                    <h1 className="font-display text-display text-on-background mb-xs">Kelola Quiz</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant">{quizzes.length} quizzes created.</p>
                </div>
                <Link href={route('teacher.quizzes.create')} className="flex items-center gap-1 bg-primary-container text-on-primary-container px-md py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-primary hover:brightness-105">
                    <span className="material-symbols-outlined" aria-hidden="true">add</span>
                    Create Quiz
                </Link>
            </header>

            {quizzes.length > 0 ? (
                <div className="flex flex-col gap-sm pb-xl">
                    {quizzes.map((q) => <QuizRow key={q.id} quiz={q} />)}
                </div>
            ) : (
                <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">quiz</span>
                    <p className="font-headline-md text-headline-md text-on-surface">No quizzes yet</p>
                    <p className="font-body-md text-body-md text-on-surface-variant">Create your first quiz to start testing students.</p>
                </div>
            )}
        </TeacherLayout>
    );
}
