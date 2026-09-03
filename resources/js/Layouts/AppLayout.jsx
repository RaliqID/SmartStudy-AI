import { Link, useForm } from '@inertiajs/react';

const navItems = [
    { label: 'Dashboard', href: '/student/dashboard', icon: 'dashboard', filled: true },
    { label: 'Subjects', href: '/student/subjects', icon: 'book' },
    { label: 'AI Tutor', href: '/student/ai', icon: 'psychology' },
    { label: 'Quiz', href: '/student/quiz', icon: 'quiz' },
    { label: 'Progress', href: '/student/progress', icon: 'trending_up' },
    { label: 'Schedule', href: '/student/schedule', icon: 'calendar_today' },
];

const secondaryNavItems = [
    { label: 'Settings', href: '/student/settings', icon: 'settings' },
];

const mobileBottomItems = [
    { label: 'Dashboard', href: '/student/dashboard', icon: 'dashboard', filled: true },
    { label: 'Subjects', href: '/student/subjects', icon: 'book' },
    { label: 'AI Tutor', href: '/student/ai', icon: 'psychology' },
    { label: 'More', href: '/student/progress', icon: 'more_horiz' },
];

function SidebarLink({ item, active }) {
    return (
        <Link
            href={item.href}
            className={
                active
                    ? 'flex items-center gap-sm px-4 py-3 bg-secondary-container text-on-secondary-container border-b-4 border-secondary font-bold rounded-2xl active:translate-y-[2px] active:border-b-2 transition-transform'
                    : 'flex items-center gap-sm px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-2xl hover:translate-y-[-2px] transition-transform border-2 border-transparent'
            }
        >
            <span
                className="material-symbols-outlined"
                style={item.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
                {item.icon}
            </span>
            <span className="font-label-bold text-label-bold">{item.label}</span>
        </Link>
    );
}

function BottomNavLink({ item, active }) {
    return (
        <Link
            href={item.href}
            className={
                active
                    ? 'flex flex-col items-center gap-1 p-2 text-primary font-bold'
                    : 'flex flex-col items-center gap-1 p-2 text-on-surface-variant'
            }
        >
            <span
                className="material-symbols-outlined"
                style={item.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
                {item.icon}
</span>
            <span className="text-[10px] font-label-bold">{item.label}</span>
        </Link>
    );
}

export default function AppLayout({ auth, children }) {
    const { post } = useForm();
    const user = auth?.user;

    const logout = (e) => {
        e.preventDefault();
        post(route('logout'));
    };

    const isCurrent = (href) => {
        // Route-name matching doesn't work with plain path hrefs — compare URL pathname
        const path = window.location.pathname;
        return path === href || path.startsWith(`${href}/`);
    };

    return (
        <div className="bg-background text-on-background font-sans font-body-md text-body-md min-h-screen overflow-x-hidden">
            {/* Top Navigation (Mobile) */}
            <header className="md:hidden flex justify-between items-center px-lg h-20 bg-surface w-full z-10 sticky top-0 border-b-2 border-outline-variant">
                <div className="font-headline-lg text-headline-lg text-primary font-black">SmartStudy AI</div>
                <div className="flex gap-sm">
                    <Link href="/student/notifications" aria-label="Notifications">
                        <span className="material-symbols-outlined text-primary cursor-pointer hover:opacity-80 active:translate-y-[2px]">
                            notifications
                        </span>
                    </Link>
                    <Link href="/profile" aria-label="Profile">
                        <span className="material-symbols-outlined text-primary cursor-pointer hover:opacity-80 active:translate-y-[2px]">
                            account_circle
                        </span>
                    </Link>
                </div>
            </header>

            <div className="flex min-h-screen md:h-screen w-full mx-auto max-w-7xl">
                {/* Side Navigation (Desktop) */}
                <nav className="hidden md:flex flex-col h-full w-64 border-r-2 border-outline-variant bg-surface p-lg gap-sm shrink-0 sticky top-0 z-10">
                    <div className="mb-xl">
                        <div className="font-headline-lg text-headline-lg text-primary font-black mb-1">SmartStudy AI</div>
                        <div className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
                            {/* Avatar placeholder — replace with auth.user.avatar when available */}
                            <img
                                src={user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'S') + '&background=87fe45&color=082100&bold=true&size=64'}
                                alt={user?.name || 'Student avatar'}
                                className="w-8 h-8 rounded-full border-2 border-outline-variant object-cover"
                            />
                            <span>Level {user?.current_level ?? 1} Scholar</span>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-sm">
                        {navItems.map((item) => (
                            <SidebarLink key={item.label} item={item} active={isCurrent(item.href)} />
                        ))}
                    </div>
                    <div className="mt-auto flex flex-col gap-sm">
                        {secondaryNavItems.map((item) => (
                            <SidebarLink key={item.label} item={item} active={isCurrent(item.href)} />
                        ))}
                        <form onSubmit={logout} className="flex flex-col gap-sm">
                            <button
                                type="submit"
                                className="flex items-center gap-sm px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-2xl hover:translate-y-[-2px] transition-transform border-2 border-transparent text-left"
                            >
                                <span className="material-symbols-outlined">logout</span>
                                <span className="font-label-bold text-label-bold">Logout</span>
                            </button>
                        </form>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-1 p-lg md:p-xl overflow-y-auto pb-28 md:pb-xl">
                    {children}
                </main>
            </div>

            {/* Bottom Navigation (Mobile) */}
            <nav className="md:hidden fixed bottom-0 w-full bg-surface border-t-2 border-outline-variant flex justify-around items-center h-20 pb-2 z-10 px-2">
                {mobileBottomItems.map((item) => (
                    <BottomNavLink key={item.label} item={item} active={isCurrent(item.href)} />
                ))}
            </nav>
        </div>
    );
}
