import { Link, usePage } from '@inertiajs/react';

/**
 * GuestLayout — split-screen auth shell.
 * Desktop: left branding panel (w-[420px] fixed), right form panel (flex-1, center).
 * Mobile: compact branding header, full-width form below.
 */
export default function GuestLayout({ children }) {
    const { flash, appName } = usePage().props;
    const name = appName || 'SmartStudy AI';

    return (
        <div style={{ minHeight: '100vh' }} className="bg-background text-on-background font-sans flex flex-col lg:flex-row">
            {/* ── Branding Panel ── */}
            <aside
                className="relative bg-primary text-on-primary overflow-hidden shrink-0 hidden lg:flex lg:flex-col"
                style={{ width: '420px', minHeight: '100vh' }}
            >
                <span
                    className="material-symbols-outlined absolute pointer-events-none select-none text-white/10"
                    style={{ fontVariationSettings: "'FILL' 1", fontSize: '180px', top: '-40px', right: '-40px' }}
                    aria-hidden="true"
                >school</span>
                <span
                    className="material-symbols-outlined absolute pointer-events-none select-none text-white/10"
                    style={{ fontVariationSettings: "'FILL' 1", fontSize: '220px', bottom: '-40px', left: '-30px' }}
                    aria-hidden="true"
                >psychology</span>
                <span
                    className="material-symbols-outlined absolute pointer-events-none select-none text-white/10"
                    style={{ fontSize: '120px', top: '33%', right: '32px', transform: 'rotate(12deg)' }}
                    aria-hidden="true"
                >quiz</span>

                {/* Mobile brand bar */}
                <div className="lg:hidden flex items-center gap-3 p-6">
                    <div className="w-10 h-10 rounded-xl bg-white/15 border-2 border-white/25 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }} aria-hidden="true">school</span>
                    </div>
                    <p className="font-bold text-lg">{name}</p>
                </div>

                {/* Desktop branding */}
                <div className="hidden lg:flex flex-col flex-1 p-12">
                    <Link href="/" className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/15 border-2 border-white/25 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }} aria-hidden="true">school</span>
                        </div>
                        <div>
                            <p className="text-white font-extrabold" style={{ fontSize: '32px', lineHeight: '40px', letterSpacing: '-0.02em' }}>{name}</p>
                            <p className="text-white/60 uppercase" style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.05em' }}>Learn smarter, not harder</p>
                        </div>
                    </Link>

                    <div className="flex-1 flex flex-col justify-end gap-8 pb-12">
                        <p className="text-white/80" style={{ fontSize: '17px', lineHeight: '26px', fontWeight: 600 }}>
                            Your AI-powered study companion: master any subject with bite-sized lessons, gamified quizzes, and a streak worth keeping.
                        </p>
                        <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-6">
                            <span className="material-symbols-outlined text-yellow-300" aria-hidden="true">format_quote</span>
                            <p className="text-white font-bold mt-2" style={{ fontSize: '17px', lineHeight: '24px' }}>&quot;Learning is a treasure that follows its owner everywhere.&quot;</p>
                            <p className="text-white/50 uppercase mt-3" style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em' }}>Keep showing up daily</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile brand strip */}
            <div className="lg:hidden flex items-center gap-3 p-4 bg-primary text-white">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }} aria-hidden="true">school</span>
                    </div>
                    <span className="font-bold text-sm tracking-tight">{name}</span>
                </Link>
            </div>

            {/* ── Form Panel ── */}
            <main className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16" style={{ minHeight: 'calc(100vh - 56px)' }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>
                    {/* Flash messages */}
                    {flash?.success && (
                        <div className="mb-6 rounded-2xl p-4 flex items-start gap-3 border-2" style={{ background: 'rgba(88,204,2,0.1)', borderColor: 'rgba(43,108,0,0.3)' }} role="status">
                            <span className="material-symbols-outlined shrink-0 text-green-700" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                            <p className="font-bold text-green-800" style={{ fontSize: '15px', lineHeight: '22px' }}>{flash.success}</p>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-6 rounded-2xl p-4 flex items-start gap-3 border-2" style={{ background: 'rgba(255,218,214,0.5)', borderColor: 'rgba(186,26,26,0.3)' }} role="alert">
                            <span className="material-symbols-outlined shrink-0 text-red-600" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">error</span>
                            <p className="font-bold text-red-900" style={{ fontSize: '15px', lineHeight: '22px' }}>{flash.error}</p>
                        </div>
                    )}

                    <div
                        className="bg-white rounded-2xl"
                        style={{
                            border: '2px solid #e3e2e1',
                            borderBottomWidth: '4px',
                            padding: '32px',
                            width: '100%',
                        }}
                    >
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
