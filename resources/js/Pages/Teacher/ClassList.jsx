import { Link, useForm, usePage } from '@inertiajs/react';
import TeacherLayout from '@/Layouts/TeacherLayout';

function ClassCard({ klass }) {
    const color = klass.subject?.color || '#006590';

    return (
        <div className="bg-surface-container-lowest rounded-2xl chunky-border p-lg flex flex-col gap-sm">
            <div className="flex items-start justify-between gap-sm">
                <div className="flex items-center gap-md min-w-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-b-4" style={{ backgroundColor: `${color}1a`, color, borderColor: `${color}33` }}>
                        <span className="material-symbols-outlined" aria-hidden="true">{klass.subject?.icon || 'groups'}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="font-body-lg text-body-lg font-bold text-on-surface truncate">{klass.name}</p>
                        <p className="font-body-md text-body-md text-on-surface-variant truncate">{klass.subject?.name || '—'} · {klass.students_count} students</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between mt-sm">
                <div className="bg-primary-container/10 border-2 border-primary/20 rounded-xl px-sm py-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-sm" aria-hidden="true">vpn_key</span>
                    <span className="font-label-bold text-label-bold text-primary">{klass.join_code}</span>
                </div>
                <Link href={route('teacher.classes.show', klass.id)} className="bg-surface-container text-on-surface px-md py-sm rounded-xl font-label-bold text-label-bold btn-chunky border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-high">
                    View
                </Link>
            </div>
        </div>
    );
}

export default function ClassList({ auth, classes = [], subjects = [] }) {
    const flash = usePage().props.flash;
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        description: '',
        subject_id: subjects[0]?.id || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('teacher.classes.store'), {
            onSuccess: () => reset(),
        });
    };

    const field = 'w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary';
    const label = 'font-label-bold text-label-bold text-on-surface-variant uppercase';

    return (
        <TeacherLayout auth={auth}>
            <header className="mb-lg">
                <h1 className="font-display text-display text-on-background mb-xs">Kelas Saya</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">{classes.length} class{classes.length !== 1 ? 'es' : ''} active.</p>
            </header>

            {flash?.success && (
                <div className="mb-lg bg-primary-container/10 border-2 border-primary/30 rounded-2xl p-md flex items-start gap-sm" role="status">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                    <p className="font-body-md text-body-md text-primary font-bold">{flash.success}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start pb-xl">
                {/* Add Class Form */}
                <div className="bg-surface rounded-2xl chunky-border p-lg">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">New Class</h2>
                    <form onSubmit={submit} className="flex flex-col gap-sm">
                        <div>
                            <label htmlFor="cls-name" className={label}>Class Name</label>
                            <input id="cls-name" type="text" required value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Mathematics — Grade 10"
                                className={field} />
                            {errors.name && <p className="font-label-bold text-label-bold text-error mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="cls-desc" className={label}>Description (optional)</label>
                            <textarea id="cls-desc" rows={2} value={data.description} onChange={(e) => setData('description', e.target.value)} className={`${field} resize-y`} />
                        </div>
                        <div>
                            <label htmlFor="cls-subject" className={label}>Subject</label>
                            <select id="cls-subject" value={data.subject_id} onChange={(e) => setData('subject_id', e.target.value)} required className={field}>
                                <option value="">Select subject…</option>
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {errors.subject_id && <p className="font-label-bold text-label-bold text-error mt-1">{errors.subject_id}</p>}
                        </div>
                        <button type="submit" disabled={processing}
                            className="mt-sm w-full bg-primary text-on-primary py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-on-primary-fixed-variant hover:brightness-105 disabled:opacity-60">
                            {processing ? 'Creating…' : 'Create Class'}
                        </button>
                    </form>
                </div>

                {/* Class cards */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-md">
                    {classes.length > 0 ? (
                        classes.map((c) => <ClassCard key={c.id} klass={c} />)
                    ) : (
                        <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">groups</span>
                            <p className="font-headline-md text-headline-md text-on-surface">No classes yet</p>
                            <p className="font-body-md text-body-md text-on-surface-variant">Create a class to start adding students.</p>
                        </div>
                    )}
                </div>
            </div>
        </TeacherLayout>
    );
}
