import { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const iconOptions = [
    'science', 'calculate', 'history_edu', 'public', 'palette', 'music_note',
    'code', 'computer', 'translate', 'biotech', 'psychology', 'menu_book',
    'edit_note', 'school', 'engineering', 'architecture', 'eco', 'emoji_events',
];

const colorPresets = [
    '#2b6c00', '#006590', '#755b00', '#ba1a1a', '#6750a4',
    '#006e1c', '#005662', '#00696e', '#8b5000', '#8b0000',
];

function SubjectCard({ subject, onEdit, onDelete, onToggle }) {
    const color = subject.color || '#006590';

    return (
        <div className={`bg-surface-container-lowest rounded-2xl chunky-border p-lg flex flex-col gap-sm transition-opacity ${!subject.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-sm">
                <div className="flex items-center gap-md min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-b-4" style={{ backgroundColor: `${color}1a`, color, borderColor: `${color}33` }}>
                        <span className="material-symbols-outlined" aria-hidden="true">{subject.icon || 'science'}</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-body-lg text-body-lg font-bold text-on-surface truncate">{subject.name}</h3>
                        <p className="text-xs text-on-surface-variant truncate">{subject.description || 'No description'}</p>
                    </div>
                </div>
                <button type="button" onClick={() => onToggle(subject)} aria-label={`Toggle active ${subject.name}`} className="w-9 h-9 rounded-xl bg-tertiary-fixed/60 text-tertiary flex items-center justify-center border-2 border-tertiary/20 border-b-4 hover:bg-tertiary-fixed shrink-0">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{subject.is_active ? 'toggle_on' : 'toggle_off'}</span>
                </button>
            </div>

            <div className="flex gap-2 flex-wrap">
                <span className="font-label-bold text-label-bold text-primary bg-primary-container/20 px-2 py-1 rounded-lg text-xs">{subject.units_count} unit</span>
                <span className="font-label-bold text-label-bold text-secondary bg-secondary-container/20 px-2 py-1 rounded-lg text-xs">{subject.materials_count} material</span>
                <span className="font-label-bold text-label-bold text-tertiary bg-tertiary-fixed/40 px-2 py-1 rounded-lg text-xs">{subject.quizzes_count} quiz</span>
            </div>

            <div className="flex gap-1 mt-auto pt-sm">
                <button type="button" onClick={() => onEdit(subject)} className="flex-1 flex items-center justify-center gap-1 py-sm rounded-xl bg-surface-container-high text-on-surface-variant border-2 border-surface-container-highest font-label-bold text-label-bold text-xs uppercase hover:bg-surface-container-highest">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span> Edit
                </button>
                <button type="button" onClick={() => onDelete(subject)} className="flex-1 flex items-center justify-center gap-1 py-sm rounded-xl bg-error-container/40 text-error border-2 border-error/20 font-label-bold text-label-bold text-xs uppercase hover:bg-error-container">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span> Hapus
                </button>
            </div>
        </div>
    );
}

function SubjectModal({ subject, onClose }) {
    const isEdit = !!subject;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:        subject?.name || '',
        description: subject?.description || '',
        icon:        subject?.icon || 'science',
        color:       subject?.color || '#006590',
        is_active:   subject?.is_active ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.subjects.update', subject.slug), {
                onSuccess: () => { reset(); onClose(); },
            });
        } else {
            post(route('admin.subjects.store'), {
                onSuccess: () => { reset(); onClose(); },
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-lg" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit subject' : 'New subject'}>
            <button type="button" className="absolute inset-0 bg-inverse-surface/50" onClick={onClose} aria-label="Close"></button>
            <div className="relative bg-surface rounded-[24px] chunky-border p-lg w-full max-w-md max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-md">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">{isEdit ? 'Edit Subject' : 'New Subject'}</h2>
                    <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high border-2 border-transparent hover:border-outline-variant" aria-label="Close">
                        <span className="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-sm">
                    <div>
                        <label htmlFor="sub-name" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Nama</label>
                        <input id="sub-name" type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} required placeholder="Matematika Dasar"
                            className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary" />
                        {errors.name && <p className="font-label-bold text-label-bold text-error mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="sub-desc" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Deskripsi</label>
                        <textarea id="sub-desc" rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Opsional"
                            className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary resize-y" />
                    </div>

                    {/* Icon Picker */}
                    <div>
                        <label className="font-label-bold text-label-bold text-on-surface-variant uppercase mb-1 block">Icon</label>
                        <div className="flex flex-wrap gap-1 p-sm bg-surface-container-lowest border-2 border-outline-variant rounded-2xl">
                            {iconOptions.map((ic) => (
                                <button key={ic} type="button" onClick={() => setData('icon', ic)} aria-label={ic}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all ${data.icon === ic ? 'border-b-4 border-primary bg-primary-container/40 text-primary' : 'border-transparent text-on-surface-variant hover:bg-surface-container-high'}`}>
                                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{ic}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="font-label-bold text-label-bold text-on-surface-variant uppercase mb-1 block">Warna</label>
                        <div className="flex gap-2 flex-wrap p-sm bg-surface-container-lowest border-2 border-outline-variant rounded-2xl">
                            {colorPresets.map((c) => (
                                <button key={c} type="button" onClick={() => setData('color', c)} aria-label={c}
                                    className={`w-9 h-9 rounded-xl border-2 transition-all ${data.color === c ? 'border-b-4 border-on-surface scale-110' : 'border-outline-variant/50 hover:scale-105'}`}
                                    style={{ backgroundColor: c }}>
                                </button>
                            ))}
                        </div>
                        <div className="mt-2 flex items-center gap-sm">
                            <input type="color" value={data.color} onChange={(e) => setData('color', e.target.value)} className="w-9 h-9 rounded-xl cursor-pointer border-2 border-outline-variant" />
                            <span className="font-body-md text-body-md text-on-surface-variant">{data.color}</span>
                        </div>
                    </div>

                    <button type="submit" disabled={processing}
                        className="mt-sm w-full bg-primary text-on-primary py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-on-primary-fixed-variant hover:brightness-105 disabled:opacity-60">
                        {processing ? 'Saving…' : isEdit ? 'Update Subject' : 'Create Subject'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function DeleteModal({ subject, onClose }) {
    const { delete: destroy, processing } = useForm();

    const submit = (e) => {
        e.preventDefault();
        destroy(route('admin.subjects.destroy', subject.slug), {
            onSuccess: onClose,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-lg" role="dialog" aria-modal="true" aria-label={`Delete ${subject.name}`}>
            <button type="button" className="absolute inset-0 bg-inverse-surface/50" onClick={onClose} aria-label="Close"></button>
            <div className="relative bg-surface rounded-[24px] chunky-border p-lg w-full max-w-md">
                <div className="flex items-center gap-sm mb-md">
                    <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center border-2 border-b-4 border-error">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">warning</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Hapus Subject?</h2>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                    Subject <strong>{subject.name}</strong> akan dihapus beserta semua unit terkait. Material dan quiz yang ada di dalam unit juga akan terhapus.
                </p>
                <div className="flex gap-sm">
                    <button type="button" onClick={onClose} className="flex-1 bg-surface-container-high text-on-surface py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-outline-variant hover:brightness-105">
                        Batal
                    </button>
                    <button type="button" onClick={submit} disabled={processing} className="flex-1 bg-error text-on-error py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-on-error-container hover:brightness-110 disabled:opacity-60">
                        {processing ? 'Deleting…' : 'Hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Index({ auth, subjects = [] }) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const flash = usePage().props.flash;

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit = (s) => { setEditing(s); setShowModal(true); };

    const handleToggle = (s) => {
        router.put(route('admin.subjects.update', s.slug), { is_active: !s.is_active }, { preserveScroll: true });
    };

    return (
        <AdminLayout auth={auth}>
            <header className="mb-lg flex flex-wrap items-end justify-between gap-sm">
                <div>
                    <h1 className="font-display text-display text-on-background mb-xs">Kelola Subject</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant">{subjects.length} subject aktif & nonaktif.</p>
                </div>
                <button type="button" onClick={openCreate} className="flex items-center gap-1 bg-primary-container text-on-primary-container px-md py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-primary hover:brightness-105">
                    <span className="material-symbols-outlined" aria-hidden="true">add</span>
                    New Subject
                </button>
            </header>

            {flash?.success && (
                <div className="mb-lg bg-primary-container/10 border-2 border-primary/30 rounded-2xl p-md flex items-start gap-sm" role="status">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                    <p className="font-body-md text-body-md text-primary font-bold">{flash.success}</p>
                </div>
            )}

            {subjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md pb-xl">
                    {subjects.map((s) => (
                        <SubjectCard key={s.id} subject={s} onEdit={openEdit} onDelete={setDeleting} onToggle={handleToggle} />
                    ))}
                </div>
            ) : (
                <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center mb-xl">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">science</span>
                    <p className="font-headline-md text-headline-md text-on-surface">Belum ada subject</p>
                    <p className="font-body-md text-body-md text-on-surface-variant">Buat subject pertama untuk mulai menambah materi.</p>
                </div>
            )}

            {showModal && <SubjectModal subject={editing} onClose={() => { setShowModal(false); setEditing(null); }} />}
            {deleting && <DeleteModal subject={deleting} onClose={() => setDeleting(null)} />}
        </AdminLayout>
    );
}
