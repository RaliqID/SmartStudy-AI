import { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import TeacherLayout from '@/Layouts/TeacherLayout';

const typeMeta = {
    text: { icon: 'article', label: 'Reading' },
    video: { icon: 'play_circle', label: 'Video' },
    pdf: { icon: 'picture_as_pdf', label: 'PDF' },
};

function MaterialRow({ material, onEdit, onDelete }) {
    const meta = typeMeta[material.content_type] || { icon: 'school', label: 'Material' };
    const color = material.subject?.color || '#006590';

    return (
        <div className={`flex items-center gap-md p-md rounded-2xl border-2 border-b-4 bg-surface-container-lowest transition-opacity ${!material.is_active ? 'opacity-50 border-outline-variant/30' : 'border-surface-container-highest'}`}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-b-4" style={{ backgroundColor: `${color}1a`, color, borderColor: `${color}33` }}>
                <span className="material-symbols-outlined" aria-hidden="true">{meta.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-body-lg text-body-lg font-bold text-on-surface truncate">{material.title}</p>
                <p className="font-body-md text-body-md text-on-surface-variant truncate">
                    {material.unit?.title || '—'} · {meta.label}{material.duration_minutes ? ` · ${material.duration_minutes} min` : ''}
                </p>
            </div>
            <span className="hidden sm:block font-label-bold text-label-bold text-tertiary shrink-0">{material.completions_count} done</span>
            <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => onEdit(material)} aria-label={`Edit ${material.title}`} className="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-high">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit</span>
                </button>
                <button type="button" onClick={() => onDelete(material)} aria-label={`Delete ${material.title}`} className="w-9 h-9 rounded-xl bg-error-container/10 text-error flex items-center justify-center border-2 border-error/20 border-b-4 hover:bg-error-container/20">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                </button>
            </div>
        </div>
    );
}

export default function MateriList({ auth, materials = [], subjects = [] }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const flash = usePage().props.flash;

    const { data, setData, post, put, processing, reset, errors } = useForm({
        title: '',
        content_type: 'text',
        content_url: '',
        text_content: '',
        unit_id: '',
        duration_minutes: 15,
    });

    const openCreate = () => {
        setEditing(null);
        reset();
        setShowForm(true);
    };

    const openEdit = (material) => {
        setEditing(material);
        setData({
            title: material.title,
            content_type: material.content_type,
            content_url: material.content_type !== 'text' ? material.content_url || '' : '',
            text_content: material.content_type === 'text' ? material.text_content || '' : '',
            unit_id: material.unit?.id || '',
            duration_minutes: material.duration_minutes || 15,
        });
        setShowForm(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('teacher.materials.update', editing.id), { onSuccess: () => { reset(); setShowForm(false); } });
        } else {
            post(route('teacher.materials.store'), { onSuccess: () => { reset(); setShowForm(false); } });
        }
    };

    const handleDelete = (material) => {
        if (confirm(`Delete material "${material.title}"? This cannot be undone.`)) {
            router.delete(route('teacher.materials.destroy', material.id));
        }
    };

    // Group materials by subject
    const grouped = materials.reduce((acc, m) => {
        const key = m.subject?.name || 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(m);
        return acc;
    }, {});

    return (
        <TeacherLayout auth={auth}>
            {/* Header */}
            <header className="mb-lg flex flex-wrap items-end justify-between gap-sm">
                <div>
                    <h1 className="font-display text-display text-on-background mb-xs">Kelola Materi</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant">{materials.length} materials across all subjects.</p>
                </div>
                <button type="button" onClick={openCreate} className="flex items-center gap-1 bg-primary-container text-on-primary-container px-md py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-primary hover:brightness-105">
                    <span className="material-symbols-outlined" aria-hidden="true">add</span>
                    Add Material
                </button>
            </header>

            {flash?.success && (
                <div className="mb-lg bg-primary-container/10 border-2 border-primary/30 rounded-2xl p-md flex items-start gap-sm" role="status">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                    <p className="font-body-md text-body-md text-primary font-bold">{flash.success}</p>
                </div>
            )}

            {/* Materials grouped by subject */}
            {Object.keys(grouped).length > 0 ? (
                <div className="flex flex-col gap-lg pb-xl">
                    {Object.entries(grouped).map(([subjectName, list]) => (
                        <section key={subjectName} className="bg-surface rounded-2xl chunky-border p-lg">
                            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">{subjectName}</h2>
                            <div className="flex flex-col gap-sm">
                                {list.map((m) => (
                                    <MaterialRow key={m.id} material={m} onEdit={openEdit} onDelete={handleDelete} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">menu_book</span>
                    <p className="font-headline-md text-headline-md text-on-surface">No materials yet</p>
                    <p className="font-body-md text-body-md text-on-surface-variant">Create your first material to start teaching.</p>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-lg" role="dialog" aria-modal="true" aria-label={editing ? 'Edit material' : 'Add material'}>
                    <button type="button" className="absolute inset-0 bg-inverse-surface/50" onClick={() => setShowForm(false)} aria-label="Close"></button>
                    <div className="relative bg-surface rounded-[24px] chunky-border p-lg w-full max-w-lg max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-md">
                            <h2 className="font-headline-lg text-headline-lg text-on-surface">{editing ? 'Edit Material' : 'New Material'}</h2>
                            <button type="button" onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high border-2 border-transparent hover:border-outline-variant" aria-label="Close">
                                <span className="material-symbols-outlined" aria-hidden="true">close</span>
                            </button>
                        </div>
                        <form onSubmit={submit} className="flex flex-col gap-sm">
                            <div>
                                <label htmlFor="mat-title" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Title</label>
                                <input id="mat-title" type="text" value={data.title} onChange={(e) => setData('title', e.target.value)} required placeholder="Introduction to Algebra"
                                    className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary" />
                                {errors.title && <p className="font-label-bold text-label-bold text-error mt-1">{errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-sm">
                                <div>
                                    <label htmlFor="mat-type" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Type</label>
                                    <select id="mat-type" value={data.content_type} onChange={(e) => setData('content_type', e.target.value)}
                                        className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary">
                                        <option value="text">Text</option>
                                        <option value="video">Video (URL)</option>
                                        <option value="pdf">PDF (URL)</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="mat-duration" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Duration (min)</label>
                                    <input id="mat-duration" type="number" min="1" max="600" value={data.duration_minutes} onChange={(e) => setData('duration_minutes', e.target.value)}
                                        className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="mat-unit" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Unit</label>
                                <select id="mat-unit" value={data.unit_id} onChange={(e) => setData('unit_id', e.target.value)} required
                                    className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary">
                                    <option value="">Select unit…</option>
                                    {subjects.map((s) => (
                                        <optgroup key={s.id} label={s.name}>
                                            {s.units.map((u) => (
                                                <option key={u.id} value={u.id}>{s.name} — {u.title}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                {errors.unit_id && <p className="font-label-bold text-label-bold text-error mt-1">{errors.unit_id}</p>}
                            </div>

                            {data.content_type !== 'text' && (
                                <div>
                                    <label htmlFor="mat-url" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Content URL</label>
                                    <input id="mat-url" type="url" value={data.content_url} onChange={(e) => setData('content_url', e.target.value)} placeholder="https://youtube.com/embed/…"
                                        className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary" />
                                    {errors.content_url && <p className="font-label-bold text-label-bold text-error mt-1">{errors.content_url}</p>}
                                </div>
                            )}

                            {data.content_type === 'text' && (
                                <div>
                                    <label htmlFor="mat-text" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Text Content</label>
                                    <textarea id="mat-text" rows={6} value={data.text_content} onChange={(e) => setData('text_content', e.target.value)} placeholder="Write the material content…"
                                        className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary resize-y" />
                                    {errors.text_content && <p className="font-label-bold text-label-bold text-error mt-1">{errors.text_content}</p>}
                                </div>
                            )}

                            <button type="submit" disabled={processing}
                                className="mt-sm w-full bg-primary text-on-primary py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-on-primary-fixed-variant hover:brightness-105 disabled:opacity-60">
                                {processing ? 'Saving…' : editing ? 'Update Material' : 'Create Material'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </TeacherLayout>
    );
}
