import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ _header, children }) {
    const user = usePage().props.auth.user;

    return (
        <div className="min-h-screen bg-background text-on-background">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-surface border-b-2 border-outline-variant h-20 px-lg flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <ApplicationLogo />
                </Link>

                <div className="flex items-center">
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="flex items-center gap-3 rounded-2xl px-3 py-2 border-2 border-transparent hover:border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                                <img
                                    src={user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'U') + '&background=87fe45&color=082100&bold=true&size=64'}
                                    alt={user?.name}
                                    className="w-9 h-9 rounded-full border-2 border-outline-variant object-cover"
                                />
                                <span className="hidden sm:inline font-label-bold text-label-bold text-on-surface">
                                    {user.name}
                                </span>
                                <span className="material-symbols-outlined text-on-surface-variant text-sm">expand_more</span>
                            </button>
                        </Dropdown.Trigger>

                        <Dropdown.Content align="end" width="48">
                            <div className="px-4 py-2 border-b-2 border-surface-container mb-1">
                                <p className="font-label-bold text-label-bold text-on-surface">{user.name}</p>
                                <p className="text-sm text-on-surface-variant">{user.email}</p>
                            </div>
                            <Dropdown.Link href={route('profile.edit')}>
                                Profile
                            </Dropdown.Link>
                            <Dropdown.Link href={route('logout')} method="post" as="button">
                                Log Out
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-5xl mx-auto p-lg md:p-xl bg-background min-h-[calc(100vh-5rem)]">
                {children}
            </main>
        </div>
    );
}
