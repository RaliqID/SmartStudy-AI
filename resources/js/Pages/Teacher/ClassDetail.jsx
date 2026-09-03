import { Link, router, useForm, usePage } from '@inertiajs/react';
import TeacherLayout from '@/Layouts/TeacherLayout';

function StudentRow({ student, onRemove }) {
    const avatar = student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=87fe45&color=082100&bold=true&size=64`;

    return (
        <div className="flex items-center gap-md p-md rounded-2xl border-2 border-surface-container-highest border-b-4 bg-surface-container-lowest">
            <img src={avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover border-2 border-outline-variant shrink-0" loading="lazy" />
            <div className="flex-1 min-w-0">
                <p className="font-body-lg text-body-lg font-bold text-on-surface truncate">{student.name}</p>
                <p className="font-body-md text-body-md text-on-surface-variant truncate">{student.email}</p>
            </div>
            <div className="hidden md:flex flex-col items-end shrink-0">
                <span className="font-label-bold text-label-bold text-primary">{student.avg_mastery}% mastery</span>
                <span className="text-xs text-on-surface-variant">{student.quizzes_taken} quizzes · avg {student.avg_score}%</span>
            </div>
            {/* Mastery bar (desktop) */}
            <div className="hidden lg:block w-24 shrink-0">
                <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container rounded-full" style={{ width: `${student.avg_mastery}%` }}></div>
                </div>
            </div>
            <button
                type="button"
                onClick={() => { if (confirm(`Remove ${student.name} from this class?`)) onRemove(student); }}
                aria-label={`Remove ${student.name}`}
                className="w-9 h-9 rounded-xl bg-error-container/10 text-error flex items-center justify-center border-2 border-error/20 border-b-4 hover:bg-error-container/20 shrink-0"
            >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">person_remove</span>
            </button>
        </div>
    );
}

export default function ClassDetail({ auth, klass, students = [] }) {
    const flash = usePage().props.flash;
    const { data, setData, post, processing, reset, errors } = useForm({ email: '' });

    const addStudent = (e) => {
        e.preventDefault();
        post(route('teacher.classes.addStudent', klass.id), {
            onSuccess: () => reset(),
        });
    };

    const removeStudent = (student) => {
        router.delete(route('teacher.classes.removeStudent', [klass.id, student.id]), { preserveScroll: true });
    };

    const color = klass.subject?.color || '#006590';

    return (
        <TeacherLayout auth={auth}>
            {/* Header */}
            <header className="mb-lg flex flex-wrap items-start justify-between gap-sm">
                <div className="min-w-0">
                    <nav className="flex items-center gap-2 text-on-surface-variant font-label-bold text-label-bold uppercase mb-1" aria-label="Breadcrumb">
                        <Link href={route('teacher.classes.index')} className="hover:text-primary transition-colors">Classes</Link>
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
                        <span className="text-on-surface truncate">{klass.name}</span>
                    </nav>
                    <div className="flex items-center gap-md">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 border-b-4" style={{ backgroundColor: `${color}1a`, color, borderColor: `${color}33` }}>
                            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">{klass.subject?.icon || 'groups'}</span>
                        </div>
                        <div>
                            <h1 className="font-display text-display text-on-background">{klass.name}</h1>
                            <p className="font-body-md text-body-md text-on-surface-variant">{klass.subject?.name || '—'} · {students.length} students</p>
                        </div>
                    </div>
                </div>
                <div className="bg-primary-container/10 border-2 border-primary/20 rounded-2xl px-lg py-sm text-center">
                    <p className="font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">Join Code</p>
                    <p className="font-display text-display text-primary font-black">{klass.join_code}</p>
                </div>
            </header>

            {flash?.success && (
                <div className="mb-lg bg-primary-container/10 border-2 border-primary/30 rounded-2xl p-md flex items-start gap-sm" role="status">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                    <p className="font-body-md text-body-md text-primary font-bold">{flash.success}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start pb-xl">
                {/* Add student */}
                <div className="bg-surface rounded-2xl chunky-border p-lg">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">Add Student</h2>
                    <form onSubmit={addStudent} className="flex flex-col gap-sm">
                        <div>
                            <label htmlFor="student-email" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Student Email</label>
                            <input
                                id="student-email"
                                type="email"
                                required
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="student@school.com"
                                className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary"
                            />
                            {errors.email && <p className="font-label-bold text-label-bold text-error mt-1">{errors.email}</p>}
                        </div>
                        <button type="submit" disabled={processing}
                            className="w-full bg-primary text-on-primary py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-on-primary-fixed-variant hover:brightness-105 disabled:opacity-60">
                            {processing ? 'Adding…' : 'Add to Class'}
                        </button>
                        <p className="font-body-md text-body-md text-on-surface-variant/70 text-xs mt-1">Student must already have an account with a student role.</p>
                    </form>
                </div>

                {/* Student list */}
                <div className="lg:col-span-2 flex flex-col gap-sm">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface px-1">Students ({students.length})</h2>
                    {students.length > 0 ? (
                        students.map((s) => <StudentRow key={s.id} student={s} onRemove={removeStudent} />)
                    ) : (
                        <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">person_off</span>
                            <p className="font-headline-md text-headline-md text-on-surface">No students yet</p>
                            <p className="font-body-md text-body-md text-on-surface-variant">Add students by email or share the join code.</p>
                        </div>
                    )}
                </div>
            </div>
        </TeacherLayout>
    );
}
