import { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const roleBadgeStyles = {
    admin:   'bg-error-container text-on-error-container',
    teacher: 'bg-secondary-container text-on-secondary-container',
    student: 'bg-primary-container/40 text-on-primary-container',
};

const roleIcons = { admin: 'shield_person', teacher: 'school', student: 'person' };

function RoleBadge({ role }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-label-bold text-label-bold text-xs uppercase ${roleBadgeStyles[role] || 'bg-surface-container-high text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{roleIcons[role] || 'person'}</span>
            {role || 'none'}
        </span>
    );
}

function StatusBadge({ active }) {
    return active
        ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-label-bold text-label-bold text-xs uppercase bg-primary-container/40 text-on-primary-container"><span className="material-symbols-outlined text-[14px]" aria-hidden="true">check_circle</span>Aktif</span>
        : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-label-bold text-label-bold text-xs uppercase bg-surface-container-high text-on-surface-variant"><span className="material-symbols-outlined text-[14px]" aria-hidden="true">block</span>Nonaktif</span>;
}

function UserRow({ user, isSelf, onEdit, onToggle, onDelete }) {
    return (
        <div className={`flex items-center gap-md p-md rounded-2xl border-2 border-b-4 bg-surface-container-lowest flex-wrap sm:flex-nowrap ${!user.is_active ? 'opacity-60' : ''}`}>
            <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=87fe45&color=082100&bold=true&size=64`}
                alt={user.name}
                className="w-11 h-11 rounded-full border-2 border-outline-variant object-cover shrink-0"
                loading="lazy"
            />
            <div className="flex-1 min-w-0 sm:min-w-40">
                <p className="font-body-md text-body-md font-bold text-on-surface truncate">
                    {user.name}{isSelf && <span className="ml-2 text-xs font-label-bold text-primary">(Anda)</span>}
                </p>
                <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <RoleBadge role={user.role} />
                <StatusBadge active={user.is_active} />
            </div>
            <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => onEdit(user)} aria-label={`Edit ${user.name}`} className="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-high">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit</span>
                </button>
                <button type="button" onClick={() => onToggle(user)} disabled={isSelf} aria-label={`Toggle active ${user.name}`} className="w-9 h-9 rounded-xl bg-tertiary-fixed/60 text-tertiary flex items-center justify-center border-2 border-tertiary/20 border-b-4 hover:bg-tertiary-fixed disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{user.is_active ? 'person_off' : 'how_to_reg'}</span>
                </button>
                <button type="button" onClick={() => onDelete(user)} disabled={isSelf} aria-label={`Delete ${user.name}`} className="w-9 h-9 rounded-xl bg-error-container/40 text-error flex items-center justify-center border-2 border-error/20 border-b-4 hover:bg-error-container disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                </button>
            </div>
        </div>
    );
}

function InviteModal({ onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({ email: '', role: 'teacher' });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.users.invite'), {
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-lg" role="dialog" aria-modal="true" aria-label="Invite user">
            <button type="button" className="absolute inset-0 bg-inverse-surface/50" onClick={onClose} aria-label="Close"></button>
            <div className="relative bg-surface rounded-[24px] chunky-border p-lg w-full max-w-md">
                <div className="flex items-center justify-between mb-md">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Invite User</h2>
                    <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high border-2 border-transparent hover:border-outline-variant" aria-label="Close">
                        <span className="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-md">Akun dibuat dengan password sementara. User akan diminta mengatur password baru lewat email reset.</p>
                <form onSubmit={submit} className="flex flex-col gap-sm">
                    <div>
                        <label htmlFor="invite-email" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Email</label>
                        <input id="invite-email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required placeholder="teacher@school.id"
                            className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary" />
                        {errors.email && <p className="font-label-bold text-label-bold text-error mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label htmlFor="invite-role" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Role</label>
                        <select id="invite-role" value={data.role} onChange={(e) => setData('role', e.target.value)}
                            className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary">
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                        </select>
                        {errors.role && <p className="font-label-bold text-label-bold text-error mt-1">{errors.role}</p>}
                    </div>
                    <button type="submit" disabled={processing} className="mt-sm w-full bg-primary text-on-primary py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-on-primary-fixed-variant hover:brightness-105 disabled:opacity-60">
                        {processing ? 'Sending…' : 'Send Invitation'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function EditModal({ user, onClose }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: user.name,
        email: user.email,
        role: user.role || 'student',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.users.update', user.id), {
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-lg" role="dialog" aria-modal="true" aria-label={`Edit ${user.name}`}>
            <button type="button" className="absolute inset-0 bg-inverse-surface/50" onClick={onClose} aria-label="Close"></button>
            <div className="relative bg-surface rounded-[24px] chunky-border p-lg w-full max-w-md max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-md">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Edit User</h2>
                    <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high border-2 border-transparent hover:border-outline-variant" aria-label="Close">
                        <span className="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-sm">
                    <div>
                        <label htmlFor="edit-name" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Nama</label>
                        <input id="edit-name" type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} required
                            className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary" />
                        {errors.name && <p className="font-label-bold text-label-bold text-error mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="edit-email" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Email</label>
                        <input id="edit-email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required
                            className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary" />
                        {errors.email && <p className="font-label-bold text-label-bold text-error mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label htmlFor="edit-role" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Role</label>
                        <select id="edit-role" value={data.role} onChange={(e) => setData('role', e.target.value)}
                            className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary">
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                        </select>
                        {errors.role && <p className="font-label-bold text-label-bold text-error mt-1">{errors.role}</p>}
                    </div>
                    <div>
                        <label htmlFor="edit-password" className="font-label-bold text-label-bold text-on-surface-variant uppercase">Password Baru (opsional)</label>
                        <input id="edit-password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="Biarkan kosong untuk tetap"
                            className="w-full mt-1 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary" />
                        {errors.password && <p className="font-label-bold text-label-bold text-error mt-1">{errors.password}</p>}
                    </div>
                    <button type="submit" disabled={processing} className="mt-sm w-full bg-primary text-on-primary py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-on-primary-fixed-variant hover:brightness-105 disabled:opacity-60">
                        {processing ? 'Saving…' : 'Update User'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function DeleteModal({ user, onClose }) {
    const { delete: destroy, processing } = useForm();

    const submit = (e) => {
        e.preventDefault();
        destroy(route('admin.users.destroy', user.id), {
            onSuccess: onClose,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-lg" role="dialog" aria-modal="true" aria-label={`Delete ${user.name}`}>
            <button type="button" className="absolute inset-0 bg-inverse-surface/50" onClick={onClose} aria-label="Close"></button>
            <div className="relative bg-surface rounded-[24px] chunky-border p-lg w-full max-w-md">
                <div className="flex items-center gap-sm mb-md">
                    <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center border-2 border-b-4 border-error">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">warning</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Hapus User?</h2>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                    <strong>{user.name}</strong> ({user.email}) akan dihapus permanen beserta semua data terkait: quiz attempts, progress, XP, dan materi yang dibuat. Tindakan ini tidak bisa dibatalkan.
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

export default function Index({ auth, users = {}, roles = [], filters = {} }) {
    const [showInvite, setShowInvite] = useState(() => new URLSearchParams(window.location.search).get('show') === 'invite');
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const flash = usePage().props.flash;

    const currentUserId = auth?.user?.id;

    const handleToggle = (user) => {
        router.patch(route('admin.users.toggleActive', user.id), {}, {
            preserveScroll: true,
        });
    };

    const applyFilter = (params) => {
        router.get(route('admin.users.index'), params, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout auth={auth}>
            <header className="mb-lg flex flex-wrap items-end justify-between gap-sm">
                <div>
                    <h1 className="font-display text-display text-on-background mb-xs">Kelola User</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant">{users.total || 0} user terdaftar.</p>
                </div>
                <button type="button" onClick={() => setShowInvite(true)} className="flex items-center gap-1 bg-primary-container text-on-primary-container px-md py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-primary hover:brightness-105">
                    <span className="material-symbols-outlined" aria-hidden="true">group_add</span>
                    Invite User
                </button>
            </header>

            {flash?.success && (
                <div className="mb-lg bg-primary-container/10 border-2 border-primary/30 rounded-2xl p-md flex items-start gap-sm" role="status">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                    <p className="font-body-md text-body-md text-primary font-bold">{flash.success}</p>
                </div>
            )}
            {flash?.error && (
                <div className="mb-lg bg-error-container border-2 border-error/30 rounded-2xl p-md flex items-start gap-sm" role="alert">
                    <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">error</span>
                    <p className="font-body-md text-body-md text-on-error-container font-bold">{flash.error}</p>
                </div>
            )}

            {/* Search + Role Filter */}
            <div className="flex flex-col sm:flex-row gap-sm mb-lg">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden="true">search</span>
                    <input
                        type="search"
                        defaultValue={filters.search || ''}
                        placeholder="Cari nama atau email…"
                        aria-label="Cari user"
                        onKeyDown={(e) => { if (e.key === 'Enter') applyFilter({ search: e.target.value, role: filters.role || '' }); }}
                        className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-2xl pl-xl pr-md py-sm font-body-md text-on-surface focus:outline-none focus:border-primary"
                    />
                </div>
                <div className="flex gap-1 bg-surface-container rounded-2xl p-1 border-2 border-surface-container-highest">
                    {['', ...roles].map((r) => (
                        <button
                            key={r || 'all'}
                            type="button"
                            onClick={() => applyFilter({ search: filters.search || '', role: r })}
                            className={`px-md py-sm rounded-xl font-label-bold text-label-bold uppercase text-xs transition-colors ${
                                (filters.role || '') === r
                                    ? 'bg-secondary-container text-on-secondary-container border-b-4 border-secondary'
                                    : 'text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                        >
                            {r === '' ? 'Semua' : r}
                        </button>
                    ))}
                </div>
            </div>

            {/* User List */}
            {users.data?.length > 0 ? (
                <>
                    <div className="flex flex-col gap-sm pb-md">
                        {users.data.map((u) => (
                            <UserRow
                                key={u.id}
                                user={u}
                                isSelf={u.id === currentUserId}
                                onEdit={setEditing}
                                onToggle={handleToggle}
                                onDelete={setDeleting}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {users.last_page > 1 && (
                        <div className="flex items-center justify-between gap-sm pb-xl">
                            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                                Page {users.current_page} of {users.last_page}
                            </p>
                            <div className="flex gap-sm">
                                {users.prev_page_url && (
                                    <button type="button" onClick={() => router.visit(users.prev_page_url, { preserveScroll: true })} className="flex items-center gap-1 px-md py-sm rounded-2xl bg-surface-container-lowest border-2 border-b-4 border-surface-container-highest font-label-bold text-label-bold text-xs uppercase hover:bg-surface-container-low">
                                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span> Prev
                                    </button>
                                )}
                                {users.next_page_url && (
                                    <button type="button" onClick={() => router.visit(users.next_page_url, { preserveScroll: true })} className="flex items-center gap-1 px-md py-sm rounded-2xl bg-surface-container-lowest border-2 border-b-4 border-surface-container-highest font-label-bold text-label-bold text-xs uppercase hover:bg-surface-container-low">
                                        Next <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center mb-xl">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">person_search</span>
                    <p className="font-headline-md text-headline-md text-on-surface">Tidak ada user ditemukan</p>
                    <p className="font-body-md text-body-md text-on-surface-variant">Coba kata kunci lain atau reset filter.</p>
                </div>
            )}

            {/* Modals */}
            {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
            {editing && <EditModal user={editing} onClose={() => setEditing(null)} />}
            {deleting && <DeleteModal user={deleting} onClose={() => setDeleting(null)} />}
        </AdminLayout>
    );
}
