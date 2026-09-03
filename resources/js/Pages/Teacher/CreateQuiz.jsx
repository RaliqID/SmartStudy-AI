import { useForm } from '@inertiajs/react';
import TeacherLayout from '@/Layouts/TeacherLayout';

export default function CreateQuiz({ auth, subjects = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        subject_id: subjects[0]?.id || '',
        difficulty: 'medium',
        duration_minutes: 20,
        xp_reward: 50,
        passing_score: 70,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('teacher.quizzes.store'));
    };

    const field = 'w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary';
    const label = 'font-label-bold text-label-bold text-on-surface-variant uppercase';

    return (
        <TeacherLayout auth={auth}>
            <header className="mb-lg">
                <h1 className="font-display text-display text-on-background mb-xs">Create Quiz</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Set up the basics first — you'll add questions next.</p>
            </header>

            <div className="bg-surface-container-lowest rounded-2xl chunky-border p-lg md:p-xl max-w-2xl">
                <form onSubmit={submit} className="flex flex-col gap-sm">
                    <div>
                        <label htmlFor="quiz-title" className={label}>Title</label>
                        <input id="quiz-title" type="text" value={data.title} onChange={(e) => setData('title', e.target.value)} required placeholder="Linear Equations Test"
                            className={field} autoFocus />
                        {errors.title && <p className="font-label-bold text-label-bold text-error mt-1">{errors.title}</p>}
                    </div>

                    <div>
                        <label htmlFor="quiz-desc" className={label}>Description (optional)</label>
                        <textarea id="quiz-desc" rows={2} value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Covers slope, intercepts, and graphing"
                            className={`${field} resize-y`} />
                    </div>

                    <div className="grid grid-cols-2 gap-sm">
                        <div>
                            <label htmlFor="quiz-subject" className={label}>Subject</label>
                            <select id="quiz-subject" value={data.subject_id} onChange={(e) => setData('subject_id', e.target.value)} required className={field}>
                                <option value="">Select subject…</option>
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {errors.subject_id && <p className="font-label-bold text-label-bold text-error mt-1">{errors.subject_id}</p>}
                        </div>
                        <div>
                            <label htmlFor="quiz-difficulty" className={label}>Difficulty</label>
                            <select id="quiz-difficulty" value={data.difficulty} onChange={(e) => setData('difficulty', e.target.value)} required className={field}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-sm">
                        <div>
                            <label htmlFor="quiz-duration" className={label}>Duration (min)</label>
                            <input id="quiz-duration" type="number" min="1" max="180" value={data.duration_minutes} onChange={(e) => setData('duration_minutes', e.target.value)} required className={field} />
                            {errors.duration_minutes && <p className="font-label-bold text-label-bold text-error mt-1">{errors.duration_minutes}</p>}
                        </div>
                        <div>
                            <label htmlFor="quiz-xp" className={label}>XP Reward</label>
                            <input id="quiz-xp" type="number" min="0" max="1000" value={data.xp_reward} onChange={(e) => setData('xp_reward', e.target.value)} required className={field} />
                            {errors.xp_reward && <p className="font-label-bold text-label-bold text-error mt-1">{errors.xp_reward}</p>}
                        </div>
                        <div>
                            <label htmlFor="quiz-passing" className={label}>Passing Score</label>
                            <input id="quiz-passing" type="number" min="0" max="100" value={data.passing_score} onChange={(e) => setData('passing_score', e.target.value)} required className={field} />
                            {errors.passing_score && <p className="font-label-bold text-label-bold text-error mt-1">{errors.passing_score}</p>}
                        </div>
                    </div>

                    <button type="submit" disabled={processing}
                        className="mt-sm w-full bg-primary text-on-primary py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-on-primary-fixed-variant hover:brightness-105 disabled:opacity-60">
                        {processing ? 'Creating…' : 'Create Quiz & Add Questions'}
                    </button>
                </form>
            </div>
        </TeacherLayout>
    );
}
