import { Link, usePage } from '@inertiajs/react';
import TeacherLayout from '@/Layouts/TeacherLayout';

function StudentRow({ student }) {
    const avatar = student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=87fe45&color=082100&bold=true&size=64`;

    return (
        <div className="flex items-center gap-md p-md rounded-2xl border-2 border-surface-container-highest border-b-4 bg-surface-container-lowest flex-wrap">
            <img src={avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover border-2 border-outline-variant shrink-0" loading="lazy" />
            <div className="flex-1 min-w-0">
                <p className="font-body-lg text-body-lg font-bold text-on-surface truncate">{student.name}</p>
                <p className="font-body-md text-body-md text-on-surface-variant truncate">{student.email}</p>
            </div>
            {/* Stats */}
            <div className="flex items-center gap-sm flex-wrap shrink-0">
                <span className="font-label-bold text-label-bold text-primary bg-primary-container/20 px-2 py-1 rounded-lg">{student.avg_mastery}% mastery</span>
                <span className="font-label-bold text-label-bold text-secondary bg-secondary-container/20 px-2 py-1 rounded-lg">{student.avg_score}% avg</span>
                <span className="font-label-bold text-label-bold text-tertiary bg-tertiary-fixed/40 px-2 py-1 rounded-lg">{student.quizzes_completed} quizzes</span>
                <span className="font-label-bold text-label-bold text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-lg">{student.time_spent_minutes}m</span>
            </div>
        </div>
    );
}

function SubjectBreakdown({ breakdown }) {
    if (!breakdown?.length) return null;
    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {breakdown.map((sb) => {
                // A subject with no graded quizzes reads 0%, which looks like a
                // broken score. Show "No attempts" instead so teachers can tell
                // "not started" apart from "scored zero".
                const attempted = Number(sb.avg_score) > 0;
                return (
                    <div key={sb.subject_name} className="flex items-center gap-2 px-sm py-xs bg-surface-container-low rounded-xl border border-outline-variant/40">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sb.color }} aria-hidden="true"></span>
                        <span className="font-body-md text-body-md text-on-surface truncate">{sb.subject_name}</span>
                        <span className="font-label-bold text-label-bold text-on-surface-variant text-xs">
                            {sb.mastery}% · {attempted ? `${sb.avg_score}%` : 'No attempts'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default function Reports({ auth, classes = [], currentClass = null, students = [] }) {
    const flash = usePage().props.flash;

    return (
        <TeacherLayout auth={auth}>
            {/* Header */}
            <header className="mb-lg">
                <h1 className="font-display text-display text-on-background mb-xs">Laporan</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                    {currentClass ? `Students in ${currentClass.name}` : 'Select a class to view student progress.'}
                </p>
            </header>

            {flash?.success && (
                <div className="mb-lg bg-primary-container/10 border-2 border-primary/30 rounded-2xl p-md flex items-start gap-sm" role="status">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                    <p className="font-body-md text-body-md text-primary font-bold">{flash.success}</p>
                </div>
            )}

            {/* Class selector */}
            <div className="flex gap-sm overflow-x-auto mb-xl pb-2">
                {classes.map((c) => {
                    const isActive = currentClass?.id === c.id;
                    return (
                        <Link
                            key={c.id}
                            href={route('teacher.reports.show', c.id)}
                            className={`shrink-0 flex items-center gap-sm px-md py-sm rounded-2xl border-2 border-b-4 transition-all ${
                                isActive
                                    ? 'bg-secondary-container text-on-secondary-container border-secondary'
                                    : 'bg-surface-container-lowest border-surface-container-highest hover:bg-surface-container-low text-on-surface'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{c.subject?.icon || 'groups'}</span>
                            <span className="font-body-md text-body-md font-bold truncate">{c.name}</span>
                            <span className="font-label-bold text-label-bold text-xs shrink-0">{c.students_count}</span>
                        </Link>
                    );
                })}
                {classes.length === 0 && (
                    <p className="font-body-md text-body-md text-on-surface-variant">No classes available.</p>
                )}
            </div>

            {/* Student table */}
            {currentClass ? (
                <>
                    {/* Summary stats */}
                    {students.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
                            <div className="bg-surface-container-lowest rounded-2xl chunky-border p-md flex flex-col items-center text-center">
                                <span className="font-headline-lg text-headline-lg text-on-surface font-black">{students.length}</span>
                                <span className="font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">Students</span>
                            </div>
                            <div className="bg-surface-container-lowest rounded-2xl chunky-border p-md flex flex-col items-center text-center">
                                <span className="font-headline-lg text-headline-lg text-primary font-black">{Math.round(students.reduce((s, st) => s + st.avg_mastery, 0) / students.length)}%</span>
                                <span className="font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">Avg Mastery</span>
                            </div>
                            <div className="bg-surface-container-lowest rounded-2xl chunky-border p-md flex flex-col items-center text-center">
                                <span className="font-headline-lg text-headline-lg text-secondary font-black">{Math.round(students.reduce((s, st) => s + st.avg_score, 0) / students.length)}%</span>
                                <span className="font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">Avg Score</span>
                            </div>
                            <div className="bg-surface-container-lowest rounded-2xl chunky-border p-md flex flex-col items-center text-center">
                                <span className="font-headline-lg text-headline-lg text-tertiary font-black">{students.reduce((s, st) => s + st.quizzes_completed, 0)}</span>
                                <span className="font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">Quizzes Taken</span>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-md pb-xl">
                        {students.map((s) => (
                            <div key={s.id} className="flex flex-col">
                                <StudentRow student={s} />
                                <SubjectBreakdown breakdown={s.subjectBreakdown} />
                            </div>
                        ))}
                        {students.length === 0 && (
                            <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center">
                                <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">person_off</span>
                                <p className="font-headline-md text-headline-md text-on-surface">No students in this class</p>
                                <p className="font-body-md text-body-md text-on-surface-variant">Add students via the class page.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">analytics</span>
                    <p className="font-headline-md text-headline-md text-on-surface">Select a class above</p>
                    <p className="font-body-md text-body-md text-on-surface-variant">Student progress and subject breakdown will appear here.</p>
                </div>
            )}
        </TeacherLayout>
    );
}
