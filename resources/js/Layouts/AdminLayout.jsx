import { Link, useForm } from '@inertiajs/react';

const navItems = [
    { label: 'Dashboard',       href: '/admin/dashboard',    icon: 'dashboard' },
    { label: 'Kelola User',     href: '/admin/users',        icon: 'manage_accounts' },
    { label: 'Kelola Subject',  href: '/admin/subjects',     icon: 'science' },
    { label: 'Kelola Kelas',    href: '/admin/classes',      icon: 'school' },
    { label: 'Laporan Sistem',  href: '/admin/reports',      icon: 'bar_chart' },
];

const bottomNavItems = [
    { label: 'Profile', href: '/profile', icon: 'account_circle' },
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
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-bold text-label-bold">{item.label}</span>
        </Link>
    );
}

function BottomNavLink({ item, active }) {
    return (
        <Link href={item.href} className={active ? 'flex flex-col items-center gap-1 p-2 text-primary font-bold' : 'flex flex-col items-center gap-1 p-2 text-on-surface-variant'}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-[10px] font-label-bold">{item.label}</span>
        </Link>
    );
}

export default function AdminLayout({ auth, children }) {
    const { post } = useForm();
    const user = auth?.user;

    const logout = (e) => {
        e.preventDefault();
        post(route('logout'));
    };

    const isCurrent = (href) => {
        const path = window.location.pathname;
        return path === href || path.startsWith(`${href}/`);
    };

    return (
        <div className="bg-background text-on-background font-sans font-body-md text-body-md min-h-screen overflow-x-hidden">
            {/* Top Navigation (Mobile) */}
            <header className="md:hidden flex justify-between items-center px-lg h-20 bg-surface w-full z-10 sticky top-0 border-b-2 border-outline-variant">
                <div className="flex items-center gap-sm">
                    <div className="w-9 h-9 rounded-xl bg-error flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white text-lg" aria-hidden="true">shield_person</span>
                    </div>
                    <span className="font-headline-lg text-headline-lg text-error font-black">Admin</span>
                </div>
                <div className="flex gap-sm">
                    <Link href="/admin/dashboard" aria-label="Dashboard">
                        <span className="material-symbols-outlined text-primary cursor-pointer hover:opacity-80 active:translate-y-[2px]">dashboard</span>
                    </Link>
                    <Link href="/profile" aria-label="Profile">
                        <span className="material-symbols-outlined text-primary cursor-pointer hover:opacity-80 active:translate-y-[2px]">account_circle</span>
                    </Link>
                </div>
            </header>

            <div className="flex min-h-screen md:h-screen w-full mx-auto max-w-7xl">
                {/* Side Navigation (Desktop) */}
                <nav className="hidden md:flex flex-col h-full w-64 border-r-2 border-outline-variant bg-surface p-lg gap-sm shrink-0 sticky top-0 z-10">
                    <div className="mb-xl">
                        <div className="flex items-center gap-sm">
                            <div className="w-10 h-10 rounded-xl bg-error flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-white" aria-hidden="true">shield_person</span>
                            </div>
                            <div>
                                <div className="font-headline-lg text-headline-lg text-error font-black leading-tight">Admin</div>
                                <div className="font-body-md text-body-md text-on-surface-variant text-sm">SmartStudy AI</div>
                            </div>
                        </div>
                        <div className="mt-sm font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'A')}&background=ffdad6&color=93000a&bold=true&size=64`}
                                alt={user?.name || 'Admin'}
                                className="w-8 h-8 rounded-full border-2 border-outline-variant object-cover"
                            />
                            <span className="truncate">{user?.name}</span>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-sm">
                        {navItems.map((item) => (
                            <SidebarLink key={item.label} item={item} active={isCurrent(item.href)} />
                        ))}
                    </div>
                    <div className="mt-auto flex flex-col gap-sm">
                        {bottomNavItems.map((item) => (
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
                {navItems.slice(0, 4).map((item) => (
                    <BottomNavLink key={item.label} item={item} active={isCurrent(item.href)} />
                ))}
            </nav>
        </div>
    );
}
