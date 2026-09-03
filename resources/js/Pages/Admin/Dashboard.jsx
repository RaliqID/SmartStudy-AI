import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function StatCard({ icon, iconBg, value, label }) {
    return (
        <div className="bg-surface-container-lowest rounded-2xl chunky-border p-md flex items-center gap-md">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-b-4 ${iconBg}`}>
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">{icon}</span>
            </div>
            <div className="min-w-0">
                <span className="block font-headline-lg text-headline-lg text-on-surface font-black">{value}</span>
                <span className="block font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">{label}</span>
            </div>
        </div>
    );
}

function WeeklyChart({ data = [] }) {
    const max = Math.max(...data.map((d) => d.count), 1);

    return (
        <div className="bg-surface-container-lowest rounded-2xl chunky-border p-lg">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">Quiz Activity — 7 Hari Terakhir</h2>
            <div className="flex items-end gap-sm h-40">
                {data.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-xs justify-end h-full">
                        <span className="font-label-bold text-label-bold text-on-surface-variant text-[10px]">{d.count}</span>
                        <div
                            className="w-full bg-primary-container rounded-t-xl border-2 border-b-0 border-primary/30 min-h-[8px] transition-all"
                            style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
                            title={`${d.count} attempts on ${d.date}`}
                        ></div>
                        <span className="font-label-bold text-label-bold text-on-surface-variant text-[10px]">
                            {new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RoleBadge({ role }) {
    const styles = {
        admin:   'bg-error-container text-on-error-container',
        teacher: 'bg-secondary-container text-on-secondary-container',
        student: 'bg-primary-container/40 text-on-primary-container',
    };
    const icons = { admin: 'shield_person', teacher: 'school', student: 'person' };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-label-bold text-label-bold text-xs uppercase ${styles[role] || 'bg-surface-container-high text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{icons[role] || 'person'}</span>
            {role || 'none'}
        </span>
    );
}

export default function Dashboard({ auth, stats = {}, recentUsers = [], weeklyActivity = [] }) {
    const user = auth?.user;
    const firstName = (user?.name || 'Admin').split(' ')[0];

    return (
        <AdminLayout auth={auth}>
            {/* Header */}
            <header className="mb-xl">
                <h1 className="font-display text-display text-on-background">Halo, {firstName}!</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Ikhtisar sistem SmartStudy AI.</p>
            </header>

            {/* Stats — Users */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-md">
                <StatCard icon="group" iconBg="bg-primary-fixed text-on-primary-fixed border-primary" value={stats.totalUsers || 0} label="Total User" />
                <StatCard icon="person" iconBg="bg-primary-container/40 text-on-primary-container border-primary" value={stats.totalStudents || 0} label="Student" />
                <StatCard icon="school" iconBg="bg-secondary-container text-on-secondary-container border-secondary" value={stats.totalTeachers || 0} label="Teacher" />
                <StatCard icon="shield_person" iconBg="bg-error-container text-on-error-container border-error" value={stats.totalAdmins || 0} label="Admin" />
            </div>

            {/* Stats — Content */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
                <StatCard icon="science" iconBg="bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-container" value={stats.totalSubjects || 0} label="Subject" />
                <StatCard icon="menu_book" iconBg="bg-primary-fixed text-on-primary-fixed border-primary" value={stats.totalMaterials || 0} label="Material" />
                <StatCard icon="quiz" iconBg="bg-secondary-fixed text-on-secondary-fixed border-secondary" value={stats.totalQuizzes || 0} label="Quiz" />
                <StatCard icon="fact_check" iconBg="bg-tertiary-container text-on-tertiary-container border-tertiary" value={stats.totalQuizAttempts || 0} label="Attempt" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="lg:col-span-2 flex flex-col gap-lg">
                    {/* Weekly Activity Chart */}
                    <WeeklyChart data={weeklyActivity} />

                    {/* Recent Users */}
                    <div className="bg-surface-container-lowest rounded-2xl chunky-border p-lg">
                        <div className="flex items-center justify-between mb-md">
                            <h2 className="font-headline-lg text-headline-lg text-on-surface">User Terbaru</h2>
                            <Link href={route('admin.users.index')} className="text-secondary font-label-bold text-label-bold hover:underline">View All</Link>
                        </div>
                        {recentUsers.length > 0 ? (
                            <div className="flex flex-col gap-sm">
                                {recentUsers.map((u) => (
                                    <div key={u.id} className="flex items-center gap-md p-sm rounded-2xl border-2 border-surface-container-highest border-b-4">
                                        <img
                                            src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=87fe45&color=082100&bold=true&size=64`}
                                            alt={u.name}
                                            className="w-10 h-10 rounded-full border-2 border-outline-variant object-cover shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-body-md text-body-md font-bold text-on-surface truncate">{u.name}</p>
                                            <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                                        </div>
                                        <RoleBadge role={u.role} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="font-body-md text-body-md text-on-surface-variant text-center py-lg">Belum ada user.</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-lg">
                    <div className="bg-surface rounded-2xl chunky-border p-lg flex flex-col gap-sm">
                        <h3 className="font-headline-md text-headline-md text-on-background mb-sm">Quick Actions</h3>
                        <Link href={route('admin.users.index')} className="flex items-center gap-sm p-sm rounded-xl border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-primary" aria-hidden="true">manage_accounts</span>
                            <span className="font-body-lg text-body-lg font-bold text-on-surface">Kelola User</span>
                        </Link>
                        <Link href={route('admin.users.index') + '?show=invite'} className="flex items-center gap-sm p-sm rounded-xl border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-secondary" aria-hidden="true">group_add</span>
                            <span className="font-body-lg text-body-lg font-bold text-on-surface">Invite User</span>
                        </Link>
                        <Link href={route('admin.subjects.index')} className="flex items-center gap-sm p-sm rounded-xl border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-tertiary" aria-hidden="true">science</span>
                            <span className="font-body-lg text-body-lg font-bold text-on-surface">Kelola Subject</span>
                        </Link>
                        <Link href={route('admin.reports')} className="flex items-center gap-sm p-sm rounded-xl border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-secondary" aria-hidden="true">bar_chart</span>
                            <span className="font-body-lg text-body-lg font-bold text-on-surface">Lihat Laporan</span>
                        </Link>
                    </div>

                    {/* Tip */}
                    <div className="bg-error-container border-2 border-error rounded-2xl chunky-border p-lg">
                        <div className="flex items-center gap-sm mb-sm">
                            <span className="material-symbols-outlined text-error" aria-hidden="true">admin_panel_settings</span>
                            <h3 className="font-headline-md text-headline-md text-on-error-container">Kontrol Akses</h3>
                        </div>
                        <p className="font-body-md text-body-md text-on-error-container/80">Teacher dan Admin hanya bisa dibuat lewat panel ini — tidak ada registrasi publik untuk role tersebut.</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
