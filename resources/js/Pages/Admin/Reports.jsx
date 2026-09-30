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

function DailyActiveChart({ data = [] }) {
    const max = Math.max(...data.map((d) => d.count), 1);

    return (
        <div className="bg-surface-container-lowest rounded-2xl chunky-border p-lg">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">Daily Active Users — 14 Hari</h2>
            <div className="flex items-end gap-[3px] h-36">
                {data.map((d, _i) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 justify-end h-full">
                        {d.count > 0 && <span className="font-label-bold text-[9px] text-on-surface-variant">{d.count}</span>}
                        <div
                            className="w-full bg-secondary-container rounded-t-lg border-2 border-b-0 border-secondary/25 min-h-[4px] transition-all"
                            style={{ height: `${Math.max((d.count / max) * 100, 3)}%` }}
                            title={`${d.count} active on ${d.date}`}
                        ></div>
                    </div>
                ))}
            </div>
            <div className="flex gap-[3px] mt-1">
                {data.map((d, i) => (
                    <div key={d.date} className="flex-1 flex justify-center">
                        {i % 3 === 0 && <span className="font-label-bold text-[9px] text-on-surface-variant">{new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

function TopStudentsTable({ students = [] }) {
    const medals = ['bg-tertiary-container text-on-tertiary-container', 'bg-secondary-container/60 text-on-secondary-container', 'bg-primary-container/30 text-on-primary-container'];

    return (
        <div className="bg-surface-container-lowest rounded-2xl chunky-border p-lg">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">Top Students — by XP</h2>
            {students.length > 0 ? (
                <div className="flex flex-col gap-sm">
                    {students.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-md p-sm rounded-2xl border-2 border-surface-container-highest border-b-4">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-headline-md text-headline-md font-black ${i < 3 ? medals[i] : 'bg-surface-container-high text-on-surface-variant'}`}>
                                {i + 1}
                            </span>
                            <img
                                src={s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=87fe45&color=082100&bold=true&size=64`}
                                alt={s.name}
                                className="w-9 h-9 rounded-full border-2 border-outline-variant object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-body-md text-body-md font-bold text-on-surface truncate">{s.name}</p>
                                <p className="text-xs text-on-surface-variant">Level {s.current_level} · {s.current_streak} day streak</p>
                            </div>
                            <span className="font-headline-md text-headline-md text-primary font-black shrink-0">{s.xp.toLocaleString()}</span>
                            <span className="font-label-bold text-label-bold text-on-surface-variant text-xs shrink-0 uppercase">XP</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="font-body-md text-body-md text-on-surface-variant text-center py-lg">Belum ada data.</p>
            )}
        </div>
    );
}

function SubjectPopularity({ data = [] }) {
    const max = Math.max(...data.map((s) => s.completions), 1);

    return (
        <div className="bg-surface-container-lowest rounded-2xl chunky-border p-lg">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">Subject Popularity — Materials Completed</h2>
            {data.length > 0 ? (
                <div className="flex flex-col gap-sm">
                    {data.map((s) => (
                        <div key={s.subject_name} className="flex items-center gap-md">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2 border-b-4" style={{ backgroundColor: `${s.color || '#006590'}1a`, color: s.color || '#006590', borderColor: `${s.color || '#006590'}33` }}>
                                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{s.icon || 'science'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-body-md text-body-md font-bold text-on-surface truncate">{s.subject_name}</p>
                                <div className="flex items-center gap-sm mt-1">
                                    <div className="h-3 rounded-full overflow-hidden bg-surface-container-high flex-1">
                                        <div className="h-full rounded-full" style={{ width: `${(s.completions / max) * 100}%`, backgroundColor: s.color || '#006590' }}></div>
                                    </div>
                                    <span className="font-label-bold text-label-bold text-on-surface-variant text-xs shrink-0">{s.completions}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="font-body-md text-body-md text-on-surface-variant text-center py-lg">Belum ada data.</p>
            )}
        </div>
    );
}

export default function Reports({ auth, engagement = {}, topStudents = [], subjectPopularity = [], dailyActive = [] }) {
    return (
        <AdminLayout auth={auth}>
            <header className="mb-xl">
                <h1 className="font-display text-display text-on-background">Laporan Sistem</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Statistik engagement, konten, dan performa pengguna.</p>
            </header>

            {/* Engagement Stats — 7 Hari */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
                <StatCard icon="group" iconBg="bg-primary-fixed text-on-primary-fixed border-primary" value={engagement.activeUsers7d || 0} label="Active Users (7d)" />
                <StatCard icon="check_circle" iconBg="bg-primary-container/40 text-on-primary-container border-primary" value={engagement.materialsCompleted7d || 0} label="Material Done (7d)" />
                <StatCard icon="quiz" iconBg="bg-secondary-container text-on-secondary-container border-secondary" value={engagement.quizzesCompleted7d || 0} label="Quiz Done (7d)" />
                <StatCard icon="emoji_events" iconBg="bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-container" value={(engagement.xpAwarded7d || 0).toLocaleString()} label="XP Awarded (7d)" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-lg">
                <DailyActiveChart data={dailyActive} />
                <SubjectPopularity data={subjectPopularity} />
            </div>

            <TopStudentsTable students={topStudents} />
        </AdminLayout>
    );
}
