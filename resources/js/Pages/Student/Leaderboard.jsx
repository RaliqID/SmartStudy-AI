import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

/**
 * Leaderboard — period tabs, podium top 3, ranked list, my rank.
 *
 * Props:
 *   leaderboard: [{ rank, name, avatar, xp, is_you }]
 *   period: 'weekly' | 'monthly' | 'all'
 *   myRank: number
 */

const periods = [
    { key: 'weekly', label: 'Weekly', icon: 'date_range' },
    { key: 'monthly', label: 'Monthly', icon: 'calendar_month' },
    { key: 'all', label: 'All-Time', icon: 'emoji_events' },
];

// Static podium palettes — rank 1 = gold/tertiary, 2 = silver, 3 = bronze
const podiumStyles = {
    1: { frame: 'bg-tertiary-fixed border-tertiary-container', rank: 'bg-tertiary-container text-on-tertiary-container', size: 'w-20 h-20 md:w-24 md:h-24', order: 'md:order-2' },
    2: { frame: 'bg-secondary-fixed border-secondary', rank: 'bg-surface-container-high text-on-surface-variant', size: 'w-16 h-16 md:w-20 md:h-20', order: 'md:order-1' },
    3: { frame: 'bg-primary-fixed border-primary-container', rank: 'bg-surface-container-high text-on-surface-variant', size: 'w-14 h-14 md:w-16 md:h-16', order: 'md:order-3' },
};

function PodiumSlot({ entry, rank }) {
    const styles = podiumStyles[rank];
    return (
        <div className={`flex flex-col items-center gap-xs ${styles.order}`}>
            <div className={`rounded-full border-2 border-b-4 ${styles.frame} ${styles.size} flex items-center justify-center overflow-hidden`}>
                {entry.avatar ? (
                    <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        person
                    </span>
                )}
            </div>
            <span className={`font-label-bold text-label-bold text-[12px] uppercase px-2 py-0.5 rounded-full border-2 ${styles.rank}`}>
                #{rank} {rank === 1 ? '👑' : ''}
            </span>
            <p className={`font-body-md text-body-md md:font-body-lg md:text-body-lg font-bold text-on-surface ${entry.is_you ? 'text-primary' : ''} text-center leading-tight max-w-[130px] break-words line-clamp-2`}>
                {entry.name}
            </p>
            <p className="font-label-bold text-label-bold text-tertiary">{entry.xp.toLocaleString()} XP</p>
        </div>
    );
}

export default function Leaderboard({ auth, leaderboard = [], period = 'weekly', myRank = null }) {
    const top3 = leaderboard.filter((e) => e.rank <= 3);
    const rest = leaderboard.filter((e) => e.rank > 3);
    const youOutsideTop = myRank && myRank > 10;

    const goPeriod = (key) => {
        router.get(route('student.leaderboard'), { period: key }, { preserveState: true });
    };

    return (
        <AppLayout auth={auth}>
            {/* Header */}
            <header className="mb-lg">
                <h1 className="font-display text-display text-on-background mb-xs">Leaderboard</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Climb higher, earn more XP!</p>
            </header>

            {/* Period tabs */}
            <div className="flex gap-xs mb-xl p-xs bg-surface-container border-2 border-surface-container-highest rounded-2xl overflow-x-auto" role="tablist" aria-label="Leaderboard period">
                {periods.map((p) => {
                    const isActive = period === p.key;
                    return (
                        <button
                            key={p.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => goPeriod(p.key)}
                            className={`flex-1 flex items-center justify-center gap-xs px-sm py-sm rounded-xl font-label-bold text-label-bold uppercase whitespace-nowrap transition-all ${
                                isActive
                                    ? 'bg-secondary-container text-on-secondary-container border-2 border-b-4 border-secondary'
                                    : 'text-on-surface-variant hover:bg-surface-container-high border-2 border-transparent'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base" aria-hidden="true">{p.icon}</span>
                            {p.label}
                        </button>
                    );
                })}
            </div>

            {/* Podium top 3 */}
            {top3.length > 0 && (
                <div className="bg-surface-container-lowest rounded-3xl chunky-border p-lg mb-lg">
                    <div className="flex justify-center items-end gap-md md:gap-xl">
                        {[2, 1, 3].map((rank) => {
                            const entry = top3.find((e) => e.rank === rank);
                            return entry ? <PodiumSlot key={rank} entry={entry} rank={rank} /> : null;
                        })}
                    </div>
                </div>
            )}

            {/* Ranked list 4+ */}
            <div className="flex flex-col gap-sm">
                {rest.length > 0 ? (
                    rest.map((entry) => (
                        <div
                            key={entry.rank}
                            className={`rounded-2xl p-md flex items-center gap-md border-2 border-b-4 ${
                                entry.is_you ? 'bg-primary-container/10 border-primary/30' : 'bg-surface-container-lowest border-surface-container-highest'
                            }`}
                        >
                            <span className={`font-headline-lg text-headline-lg font-black w-10 text-center shrink-0 ${entry.is_you ? 'text-primary' : 'text-on-surface-variant'}`}>
                                {entry.rank}
                            </span>
                            <div className="w-10 h-10 rounded-full bg-secondary-container/20 border-2 border-outline-variant overflow-hidden shrink-0 flex items-center justify-center">
                                {entry.avatar ? (
                                    <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-secondary" aria-hidden="true">person</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-body-lg text-body-lg truncate ${entry.is_you ? 'text-primary font-bold' : 'text-on-surface'}`}>
                                    {entry.name} {entry.is_you && <span className="font-label-bold text-label-bold uppercase text-[10px] ml-1">(You)</span>}
                                </p>
                            </div>
                            <span className={`font-label-bold text-label-bold shrink-0 ${entry.is_you ? 'text-primary' : 'text-tertiary'}`}>
                                {entry.xp.toLocaleString()} XP
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center">
                        <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">leaderboard</span>
                        <p className="font-headline-md text-headline-md text-on-surface">No rankings yet</p>
                        <p className="font-body-md text-body-md text-on-surface-variant">Complete quizzes to enter the leaderboard!</p>
                    </div>
                )}
            </div>

            {/* My rank card — shown when outside top 10 */}
            {youOutsideTop && (
                <div className="mt-lg bg-secondary-fixed rounded-2xl chunky-border border-secondary p-lg flex items-center justify-between gap-md flex-wrap">
                    <div className="flex items-center gap-md">
                        <div className="w-12 h-12 rounded-full bg-surface-container-lowest text-secondary flex items-center justify-center border-2 border-secondary border-b-4 shrink-0">
                            <span className="font-headline-md text-headline-md font-black">{myRank}</span>
                        </div>
                        <div>
                            <p className="font-label-bold text-label-bold text-on-secondary-fixed uppercase text-xs">Your Rank</p>
                            <p className="font-headline-md text-headline-md text-on-secondary-fixed">
                                #{myRank} — {10 - (myRank - 10) > 0 ? 'just a few XP from the top 10!' : 'keep pushing!'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => goPeriod('weekly')}
                        className="bg-surface-container-lowest text-secondary px-lg py-sm rounded-xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-secondary hover:bg-surface"
                    >
                        Take a Quiz
                    </button>
                </div>
            )}
        </AppLayout>
    );
}
