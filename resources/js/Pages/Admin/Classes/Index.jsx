import { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function ClassRow({ cls, onDelete }) {
    const color = cls.subject?.color || '#006590';

    return (
        <div className="flex items-center gap-md p-md rounded-2xl border-2 border-b-4 bg-surface-container-lowest border-surface-container-highest flex-wrap sm:flex-nowrap">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-b-4" style={{ backgroundColor: `${color}1a`, color, borderColor: `${color}33` }}>
                <span className="material-symbols-outlined" aria-hidden="true">{cls.subject?.icon || 'school'}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-body-lg text-body-lg font-bold text-on-surface truncate">{cls.name}</p>
                <p className="font-body-md text-body-md text-on-surface-variant truncate">
                    {cls.subject?.name || 'No subject'} · {cls.teacher?.name || 'No teacher'}
                </p>
            </div>
            <span className="font-label-bold text-label-bold text-primary bg-primary-container/20 px-2 py-1 rounded-lg shrink-0">{cls.students_count} student</span>
            <span className="font-label-bold text-label-bold text-secondary bg-secondary-container/20 px-2 py-1 rounded-lg shrink-0">{cls.join_code}</span>
            <button type="button" onClick={() => onDelete(cls)} aria-label={`Delete ${cls.name}`} className="w-9 h-9 rounded-xl bg-error-container/40 text-error flex items-center justify-center border-2 border-error/20 border-b-4 hover:bg-error-container shrink-0">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
            </button>
        </div>
    );
}

function DeleteModal({ cls, onClose }) {
    const { delete: destroy, processing } = useForm();

    const submit = (e) => {
        e.preventDefault();
        destroy(route('admin.classes.destroy', cls.id), {
            onSuccess: onClose,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-lg" role="dialog" aria-modal="true" aria-label={`Delete ${cls.name}`}>
            <button type="button" className="absolute inset-0 bg-inverse-surface/50" onClick={onClose} aria-label="Close"></button>
            <div className="relative bg-surface rounded-[24px] chunky-border p-lg w-full max-w-md">
                <div className="flex items-center gap-sm mb-md">
                    <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center border-2 border-b-4 border-error">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">warning</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Hapus Kelas?</h2>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                    Kelas <strong>{cls.name}</strong> ({cls.students_count} student) akan dihapus permanen. Quiz yang terkait kelas ini juga akan dihapus. Tindakan ini tidak bisa dibatalkan.
                </p>
                <div className="flex gap-sm">
                    <button type="button" onClick={onClose} className="flex-1 bg-surface-container-high text-on-surface py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-outline-variant hover:brightness-105">
                        Batal
                    </button>
                    <button type="button" onClick={submit} disabled={processing} className="flex-1 bg-error text-on-error py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-on-error-container hover:brightness-110 disabled:opacity-60">
                        {processing ? 'Deleting…' : 'Hapus Permanen'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Index({ auth, classes = [] }) {
    const [deleting, setDeleting] = useState(null);
    const flash = usePage().props.flash;

    const totalStudents = classes.reduce((sum, c) => sum + c.students_count, 0);

    return (
        <AdminLayout auth={auth}>
            <header className="mb-lg">
                <h1 className="font-display text-display text-on-background mb-xs">Kelola Kelas</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">{classes.length} kelas · {totalStudents} total student enrollment.</p>
            </header>

            {flash?.success && (
                <div className="mb-lg bg-primary-container/10 border-2 border-primary/30 rounded-2xl p-md flex items-start gap-sm" role="status">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                    <p className="font-body-md text-body-md text-primary font-bold">{flash.success}</p>
                </div>
            )}

            {classes.length > 0 ? (
                <div className="flex flex-col gap-sm pb-xl">
                    {classes.map((c) => (
                        <ClassRow key={c.id} cls={c} onDelete={setDeleting} />
                    ))}
                </div>
            ) : (
                <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center mb-xl">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">school</span>
                    <p className="font-headline-md text-headline-md text-on-surface">Belum ada kelas</p>
                    <p className="font-body-md text-body-md text-on-surface-variant">Kelas dibuat oleh teacher dari dashboard mereka.</p>
                </div>
            )}

            {deleting && <DeleteModal cls={deleting} onClose={() => setDeleting(null)} />}
        </AdminLayout>
    );
}
