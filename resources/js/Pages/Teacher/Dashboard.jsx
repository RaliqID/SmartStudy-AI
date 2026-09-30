import { Link } from '@inertiajs/react';
import TeacherLayout from '@/Layouts/TeacherLayout';

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

function ActivityRow({ item }) {
    if (item.type === 'quiz_attempt') {
        return (
            <div className="flex items-center gap-sm p-2 rounded-xl border-2 border-transparent">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0 border-2 border-secondary/20">
                    <span className="material-symbols-outlined text-secondary text-sm" aria-hidden="true">quiz</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-body-md text-body-md font-bold text-on-surface truncate">{item.user_name}</p>
                    <p className="text-xs text-on-surface-variant truncate">Scored {item.score}% on {item.quiz_title}</p>
                </div>
                <span className="font-label-bold text-label-bold text-secondary shrink-0">{item.date}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-sm p-2 rounded-xl border-2 border-transparent">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 border-2 border-primary/20">
                <span className="material-symbols-outlined text-primary text-sm" aria-hidden="true">trending_up</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-body-md text-body-md font-bold text-on-surface truncate">{item.user_name}</p>
                <p className="text-xs text-on-surface-variant truncate">{item.mastery}% mastery in {item.subject_name}</p>
            </div>
            <span className="font-label-bold text-label-bold text-on-surface-variant shrink-0">{item.date}</span>
        </div>
    );
}

export default function Dashboard({ auth, classes = [], recentActivity = [], stats = {} }) {
    const user = auth?.user;
    const firstName = (user?.name || 'Teacher').split(' ')[0];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <TeacherLayout auth={auth}>
            {/* Header */}
            <header className="mb-xl">
                <h1 className="font-display text-display text-on-background">{greeting}, {firstName}!</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Here&apos;s how your classes are doing.</p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
                <StatCard icon="groups" iconBg="bg-secondary-container text-on-secondary-container border-secondary" value={stats.totalStudents || 0} label="Students" />
                <StatCard icon="quiz" iconBg="bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-container" value={stats.totalQuizzes || 0} label="Quizzes" />
                <StatCard icon="menu_book" iconBg="bg-primary-fixed text-on-primary-fixed border-primary-container" value={stats.totalMaterials || 0} label="Materials" />
                <StatCard icon="class" iconBg="bg-error-container text-on-error-container border-error" value={stats.totalClasses || 0} label="Classes" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                {/* Classes + Activity */}
                <div className="lg:col-span-2 flex flex-col gap-lg">
                    {/* Classes */}
                    <div className="bg-surface-container-lowest rounded-2xl chunky-border p-lg">
                        <div className="flex items-center justify-between mb-md">
                            <h2 className="font-headline-lg text-headline-lg text-on-surface">My Classes</h2>
                            <Link href={route('teacher.classes.index')} className="text-secondary font-label-bold text-label-bold hover:underline">View All</Link>
                        </div>
                        {classes.length > 0 ? (
                            <div className="flex flex-col gap-sm">
                                {classes.map((cls) => (
                                    <Link key={cls.id} href={route('teacher.classes.show', cls.id)} className="flex items-center gap-md p-sm rounded-2xl border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-low transition-colors">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-b-4" style={{ backgroundColor: `${cls.subject?.color || '#006590'}1a`, color: cls.subject?.color || '#006590', borderColor: `${cls.subject?.color || '#006590'}33` }}>
                                            <span className="material-symbols-outlined" aria-hidden="true">{cls.subject?.icon || 'groups'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-body-lg text-body-lg font-bold text-on-surface truncate">{cls.name}</p>
                                            <p className="font-body-md text-body-md text-on-surface-variant truncate">{cls.students_count} students · {cls.subject?.name || '—'}</p>
                                        </div>
                                        <span className="font-label-bold text-label-bold text-primary bg-primary-container/20 px-2 py-1 rounded-lg shrink-0">{cls.join_code}</span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="font-body-md text-body-md text-on-surface-variant text-center py-lg">No classes yet. Create one to get started.</p>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-surface-container-lowest rounded-2xl chunky-border p-lg">
                        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">Recent Activity</h2>
                        {recentActivity.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                {recentActivity.map((item, idx) => <ActivityRow key={idx} item={item} />)}
                            </div>
                        ) : (
                            <p className="font-body-md text-body-md text-on-surface-variant text-center py-lg">No activity yet.</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-lg">
                    <div className="bg-surface rounded-2xl chunky-border p-lg flex flex-col gap-sm">
                        <h3 className="font-headline-md text-headline-md text-on-background mb-sm">Quick Actions</h3>
                        <Link href={route('teacher.materials.index')} className="flex items-center gap-sm p-sm rounded-xl border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-primary" aria-hidden="true">menu_book</span>
                            <span className="font-body-lg text-body-lg font-bold text-on-surface">Add Material</span>
                        </Link>
                        <Link href={route('teacher.quizzes.create')} className="flex items-center gap-sm p-sm rounded-xl border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-secondary" aria-hidden="true">quiz</span>
                            <span className="font-body-lg text-body-lg font-bold text-on-surface">Create Quiz</span>
                        </Link>
                        <Link href={route('teacher.reports.index')} className="flex items-center gap-sm p-sm rounded-xl border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-tertiary" aria-hidden="true">analytics</span>
                            <span className="font-body-lg text-body-lg font-bold text-on-surface">View Reports</span>
                        </Link>
                    </div>

                    {/* Join Code Tip */}
                    <div className="bg-secondary-fixed border-2 border-secondary rounded-2xl chunky-border p-lg">
                        <div className="flex items-center gap-sm mb-sm">
                            <span className="material-symbols-outlined text-secondary" aria-hidden="true">vpn_key</span>
                            <h3 className="font-headline-md text-headline-md text-on-secondary-fixed">Share Join Code</h3>
                        </div>
                        <p className="font-body-md text-body-md text-on-secondary-fixed/80">Students can join your classes using the unique join code. Find it on each class card.</p>
                    </div>
                </div>
            </div>
        </TeacherLayout>
    );
}
