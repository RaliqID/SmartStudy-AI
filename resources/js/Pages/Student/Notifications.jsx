import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

/**
 * Notifications — list with type icons, unread styling, mark read, pagination.
 *
 * Props:
 *   notifications: { data: [{ id, type, title, body, icon, action_url, read_at, created_at }], current_page, last_page }
 */

const typeStyles = {
    quiz: { icon: 'quiz', classes: 'bg-secondary-container text-on-secondary-container' },
    achievement: { icon: 'military_tech', classes: 'bg-tertiary-fixed text-on-tertiary-fixed' },
    streak: { icon: 'local_fire_department', classes: 'bg-error-container text-on-error-container' },
    ai: { icon: 'psychology', classes: 'bg-secondary-fixed text-on-secondary-fixed' },
    schedule: { icon: 'calendar_today', classes: 'bg-primary-fixed text-on-primary-fixed' },
    system: { icon: 'info', classes: 'bg-surface-container-high text-on-surface-variant' },
};
const fallbackType = { icon: 'notifications', classes: 'bg-surface-container-high text-on-surface-variant' };

function timeAgo(value) {
    if (!value) return '';
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return '';
    const s = Math.floor((Date.now() - then) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function NotificationRow({ notification, onMarkRead }) {
    const unread = !notification.read_at;
    const meta = typeStyles[notification.type] || fallbackType;
    const icon = notification.icon || meta.icon;

    const content = (
        <>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-b-4 shrink-0 ${meta.classes}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: unread ? "'FILL' 1" : undefined }} aria-hidden="true">
                    {icon}
                </span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-sm">
                    <p className={`font-body-lg text-body-lg truncate ${unread ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>
                        {notification.title}
                    </p>
                    {unread && <span className="w-2 h-2 rounded-full bg-secondary shrink-0" aria-label="Unread"></span>}
                </div>
                <p className={`font-body-md text-body-md truncate ${unread ? 'text-on-surface' : 'text-on-surface-variant/70'}`}>{notification.body}</p>
                <p className="font-label-bold text-label-bold text-on-surface-variant/60 uppercase text-[10px] mt-0.5">{timeAgo(notification.created_at)}</p>
            </div>
        </>
    );

    return (
        <div
            className={`rounded-2xl p-md flex items-center gap-md border-2 border-b-4 transition-colors ${
                unread ? 'bg-secondary-container/10 border-secondary/30' : 'bg-surface-container-lowest border-surface-container-highest'
            }`}
        >
            {notification.action_url ? (
                <Link href={notification.action_url} className="flex items-center gap-md flex-1 min-w-0 hover:opacity-80">
                    {content}
                </Link>
            ) : (
                <div className="flex items-center gap-md flex-1 min-w-0">{content}</div>
            )}
            {unread && (
                <button
                    type="button"
                    onClick={() => onMarkRead(notification)}
                    aria-label={`Mark "${notification.title}" as read`}
                    className="w-10 h-10 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center border-2 border-surface-container-highest border-b-4 hover:bg-surface-container-high shrink-0"
                >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">done_all</span>
                </button>
            )}
        </div>
    );
}

export default function Notifications({ auth, notifications = {} }) {
    const { data = [], current_page = 1, last_page = 1 } = notifications;
    const unreadCount = data.filter((n) => !n.read_at).length;

    const goPage = (page) => {
        router.get(route('student.notifications'), { page }, { preserveState: true, preserveScroll: true });
    };

    const markRead = (notification) => {
        router.patch(route('student.notifications.read', notification.id), {}, { preserveScroll: true });
    };

    const markAllRead = () => {
        router.post(route('student.notifications.readAll'), {}, { preserveScroll: true });
    };

    return (
        <AppLayout auth={auth}>
            {/* Header */}
            <header className="mb-lg flex flex-wrap items-end justify-between gap-sm">
                <div>
                    <h1 className="font-display text-display text-on-background mb-xs">Notifications</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : "You're all caught up!"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={markAllRead}
                        disabled={false}
                        className="flex items-center gap-1 bg-secondary-container text-on-secondary-container px-md py-sm rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-secondary hover:opacity-90"
                    >
                        <span className="material-symbols-outlined" aria-hidden="true">done_all</span>
                        Mark All Read
                    </button>
                )}
            </header>

            {/* List */}
            <div className="flex flex-col gap-sm">
                {data.length > 0 ? (
                    data.map((notification) => <NotificationRow key={notification.id} notification={notification} onMarkRead={markRead} />)
                ) : (
                    <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center">
                        <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">notifications_off</span>
                        <p className="font-headline-md text-headline-md text-on-surface">No notifications yet</p>
                        <p className="font-body-md text-body-md text-on-surface-variant">Quiz results, streaks, and updates will show up here.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {last_page > 1 && (
                <nav className="mt-xl flex items-center justify-between gap-sm" aria-label="Notifications pagination">
                    <button
                        type="button"
                        onClick={() => goPage(current_page - 1)}
                        disabled={current_page <= 1}
                        aria-label="Previous page"
                        className="flex items-center gap-1 px-md py-sm rounded-xl font-label-bold text-label-bold uppercase bg-surface-container border-2 border-surface-container-highest border-b-4 btn-chunky hover:bg-surface-container-high disabled:opacity-40"
                    >
                        <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                        Prev
                    </button>
                    <span className="font-label-bold text-label-bold text-on-surface-variant">
                        Page {current_page} of {last_page}
                    </span>
                    <button
                        type="button"
                        onClick={() => goPage(current_page + 1)}
                        disabled={current_page >= last_page}
                        aria-label="Next page"
                        className="flex items-center gap-1 px-md py-sm rounded-xl font-label-bold text-label-bold uppercase bg-surface-container border-2 border-surface-container-highest border-b-4 btn-chunky hover:bg-surface-container-high disabled:opacity-40"
                    >
                        Next
                        <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                    </button>
                </nav>
            )}
        </AppLayout>
    );
}
