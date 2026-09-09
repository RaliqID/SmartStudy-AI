import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';

const HeroCap = lazy(() => import('@/Components/HeroCap'));

/* ---------- Text animation primitives ---------- */

function useInView(threshold = 0.2) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setInView(true);
            return;
        }
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    obs.disconnect();
                }
            },
            { threshold: 0.05, rootMargin: '0px 0px -5% 0px' },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, inView];
}

function WordsReveal({ text, as: Tag = 'h1', className = '', delay = 0 }) {
    const [ref, inView] = useInView();
    const words = text.split(' ');
    return (
        <Tag ref={ref} className={className} aria-label={text}>
            {words.map((word, i) => (
                <span
                    key={i}
                    aria-hidden="true"
                    className="inline-block will-change-transform"
                    style={{
                        opacity: inView ? 1 : 0,
                        transform: inView ? 'translateY(0)' : 'translateY(0.6em)',
                        transition: `opacity 0.5s ease-out ${delay + i * 0.07}s, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay + i * 0.07}s`,
                    }}
                >
                    {word}
                    {i < words.length - 1 ? ' ' : ''}
                </span>
            ))}
        </Tag>
    );
}

function FadeUp({ children, className = '', delay = 0 }) {
    const [ref, inView] = useInView();
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity 0.55s ease-out ${delay}s, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
            }}
        >
            {children}
        </div>
    );
}

function CountUp({ value, suffix = '' }) {
    const [ref, inView] = useInView();
    const [display, setDisplay] = useState(0);
    const target = Number(value) || 0;

    useEffect(() => {
        if (!inView) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setDisplay(target);
            return;
        }
        let raf;
        const start = performance.now();
        const duration = 900;
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(target * eased));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [inView, target]);

    return (
        <span ref={ref} className="tabular-nums">
            {display}
            {suffix}
        </span>
    );
}

/* ---------- Small pieces ---------- */

function Chip({ subject }) {
    const color = subject.color || '#006590';
    return (
        <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-bold text-xs border"
            style={{ backgroundColor: `${color}14`, color, borderColor: `${color}30` }}
        >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
                {subject.icon || 'book'}
            </span>
            {subject.name}
        </span>
    );
}

function QuestRow({ icon, iconBg, iconColor, title, subtitle, action, actionColor }) {
    return (
        <div className="flex items-center justify-between gap-3 bg-surface-container-lowest rounded-xl p-3 border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-transform duration-200 hover:translate-x-1">
            <div className="flex items-center gap-3 min-w-0">
                <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{ backgroundColor: iconBg, color: iconColor, borderColor: `${iconColor}30` }}
                >
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        {icon}
                    </span>
                </span>
                <div className="min-w-0">
                    <p className="font-body-md text-body-md font-bold text-on-background truncate">{title}</p>
                    <p className="text-xs text-on-surface-variant truncate">{subtitle}</p>
                </div>
            </div>
            <span className="font-label-bold text-label-bold shrink-0" style={{ color: actionColor }}>
                {action}
            </span>
        </div>
    );
}

/* ---------- Page ---------- */

export default function Welcome({ canLogin, canRegister, stats = {}, subjects = [], achievements = [] }) {
    const [reducedMotion, setReducedMotion] = useState(false);
    useEffect(() => {
        setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }, []);

    const chips = subjects.slice(0, 6);

    return (
        <>
            <Head title="Learn smarter with AI" />

            <div className="min-h-screen bg-background text-on-background font-sans">
                {/* ===== NAV ===== */}
                <header className="landing-nav sticky top-0 z-50">
                    <div className="max-w-6xl mx-auto px-lg h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-sm group">
                            <span className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                                    school
                                </span>
                            </span>
                            <span className="font-display text-headline-md text-on-background">
                                SmartStudy <span className="text-primary">AI</span>
                            </span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-lg text-sm font-semibold text-on-surface-variant">
                            <a href="#subjects" className="hover:text-primary transition-colors">Subjects</a>
                            <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
                            <a href="#ai-tutor" className="hover:text-primary transition-colors">AI Tutor</a>
                            <a href="#achievements" className="hover:text-primary transition-colors">Achievements</a>
                        </nav>
                        <div className="flex items-center gap-sm">
                            {canLogin && (
                                <Link href={route('login')} className="hidden sm:inline-flex px-md py-2 rounded-full text-xs font-label-bold text-label-bold uppercase text-on-secondary-container bg-secondary-container border border-secondary hover:brightness-95 transition-[filter]">
                                    Log in
                                </Link>
                            )}
                            {canRegister && (
                                <Link href={route('register')} className="landing-btn-primary px-md py-2 text-xs">
                                    Register
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                <main>
                    {/* ===== HERO ===== */}
                    <section className="px-lg hero-pad relative overflow-hidden">
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background:
                                    'radial-gradient(600px 300px at 85% 10%, rgba(88, 204, 2, 0.07), transparent), radial-gradient(500px 300px at 5% 90%, rgba(47, 184, 255, 0.06), transparent)',
                            }}
                            aria-hidden="true"
                        />
                        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-xl items-center relative">
                            {/* Left: value prop */}
                            <div className="flex flex-col items-start gap-lg">
                                <div className="flex items-center gap-md">
                                    <span className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(43,108,0,0.25)]">
                                        <span className="material-symbols-outlined text-3xl md:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                                            school
                                        </span>
                                    </span>
                                    <WordsReveal
                                        text="SmartStudy AI"
                                        as="h1"
                                        className="font-display text-[30px] sm:text-display-mobile md:text-5xl text-on-background tracking-tight leading-none"
                                    />
                                </div>

                                <WordsReveal
                                    as="p"
                                    delay={0.15}
                                    text="Learn smarter with AI tutor, gamified quizzes, and progress tracking."
                                    className="font-body-lg text-body-lg md:text-xl text-on-surface-variant leading-relaxed max-w-xl"
                                />

                                <FadeUp delay={0.35} className="flex flex-wrap gap-xs max-w-xl">
                                    {chips.map((s) => (
                                        <Chip key={s.name} subject={s} />
                                    ))}
                                </FadeUp>

                                <FadeUp delay={0.45} className="flex flex-wrap gap-md">
                                    {canRegister && (
                                        <Link
                                            href={route('register')}
                                            className="landing-btn-primary px-xl py-3 text-sm"
                                        >
                                            Register
                                        </Link>
                                    )}
                                    {canLogin && (
                                        <Link
                                            href={route('login')}
                                            className="landing-btn-secondary px-xl py-3 text-sm"
                                        >
                                            Log in
                                        </Link>
                                    )}
                                </FadeUp>

                                <FadeUp delay={0.55} className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                                    Free for students. Teachers can assign classes and quizzes.
                                </FadeUp>
                            </div>

                            {/* Right: 3D cap + quest card */}
                            <div className="flex flex-col gap-md">
                                <FadeUp delay={0.2}>
                                    <div className="relative landing-card shadow-[var(--shadow-float)] p-2 overflow-hidden">
                                        <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
                                            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                                            <span className="text-[10px] font-label-bold uppercase tracking-widest text-on-surface-variant">
                                                Interactive 3D - move your cursor
                                            </span>
                                        </div>
                                        <div className="h-[260px] sm:h-[300px]">
                                            <Suspense fallback={<div className="h-full flex items-center justify-center text-xs font-label-bold uppercase tracking-widest text-on-surface-variant">Loading 3D...</div>}>
                                                <HeroCap reducedMotion={reducedMotion} />
                                            </Suspense>
                                        </div>
                                    </div>
                                </FadeUp>

                                <FadeUp delay={0.3}>
                                    <div className="landing-card p-md" style={{ backgroundColor: 'var(--color-surface-container)' }}>
                                        <div className="flex items-center justify-between mb-sm px-1">
                                            <span className="text-xs font-label-bold uppercase tracking-widest text-on-surface-variant">
                                                Today's quest
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs font-label-bold text-on-tertiary-container bg-tertiary-fixed/60 px-2.5 py-1 rounded-full border border-tertiary">
                                                <span className="material-symbols-outlined text-sm" aria-hidden="true">bolt</span>
                                                +25 XP
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-sm">
                                            <QuestRow
                                                icon="calculate" iconBg="#e8f5e9" iconColor="#1e7e34"
                                                title="Mathematics quiz" subtitle="Complete 10 questions"
                                                action="Start" actionColor="#1e7e34"
                                            />
                                            <QuestRow
                                                icon="psychology" iconBg="#e1f5fe" iconColor="#00838f"
                                                title="Ask AI Tutor" subtitle="Explain photosynthesis simply"
                                                action="Chat" actionColor="#006590"
                                            />
                                            <QuestRow
                                                icon="emoji_events" iconBg="#fff8e1" iconColor="#9a7d0a"
                                                title="Streak kept" subtitle="5 days in a row. Keep it up."
                                                action="Day 5" actionColor="#9a7d0a"
                                            />
                                        </div>
                                    </div>
                                </FadeUp>
                            </div>
                        </div>
                    </section>

                    {/* ===== METRICS (real counts) ===== */}
                    <section className="border-y border-slate-200/60 py-lg px-lg bg-surface-container-low">
                        <dl className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-md text-center">
                            <div>
                                <dd className="font-display text-headline-lg text-primary">
                                    <CountUp value={stats.subjects ?? 0} suffix="+" />
                                </dd>
                                <dt className="font-body-md text-body-md text-on-surface-variant">Subjects</dt>
                            </div>
                            <div>
                                <dd className="font-display text-headline-lg text-primary">
                                    <CountUp value={stats.materials ?? 0} />
                                </dd>
                                <dt className="font-body-md text-body-md text-on-surface-variant">Materials</dt>
                            </div>
                            <div>
                                <dd className="font-display text-headline-lg text-primary">
                                    <CountUp value={stats.quizzes ?? 0} />
                                </dd>
                                <dt className="font-body-md text-body-md text-on-surface-variant">Quizzes</dt>
                            </div>
                            <div>
                                <dd className="font-display text-headline-lg text-primary">
                                    <CountUp value={stats.achievements ?? 0} />
                                </dd>
                                <dt className="font-body-md text-body-md text-on-surface-variant">Achievements</dt>
                            </div>
                        </dl>
                    </section>

                    {/* ===== SUBJECTS ===== */}
                    <section id="subjects" className="section-pad px-lg scroll-mt-20">
                        <div className="max-w-6xl mx-auto">
                            <FadeUp className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                                <div>
                                    <span className="text-xs font-label-bold uppercase tracking-widest text-primary">Curriculum</span>
                                    <h2 className="font-display text-headline-lg text-on-background mt-1">Explore the subjects</h2>
                                    <p className="text-on-surface-variant mt-1 max-w-xl">
                                        Structured by units your teacher assigns, with progressive problem sets.
                                    </p>
                                </div>
                            </FadeUp>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
                                {subjects.slice(0, 6).map((s, i) => {
                                    const color = s.color || '#2b6c00';
                                    return (
                                        <FadeUp key={s.name} delay={i * 0.06}>
                                            <article className="h-full landing-card landing-card-hover p-md flex flex-col gap-sm">
                                                <span
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center border"
                                                    style={{ backgroundColor: `${color}14`, color, borderColor: `${color}30` }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                                                        {s.icon || 'book'}
                                                    </span>
                                                </span>
                                                <h3 className="font-headline-md text-headline-md text-on-background">{s.name}</h3>
                                                <p className="text-sm text-on-surface-variant flex-1">{s.description}</p>
                                                <Link href={route('register')} className="text-xs font-label-bold uppercase tracking-wider text-primary hover:underline self-start">
                                                    Practice now
                                                </Link>
                                            </article>
                                        </FadeUp>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* ===== HOW IT WORKS ===== */}
                    <section id="how-it-works" className="section-pad px-lg bg-surface-container-low scroll-mt-20 border-y border-slate-200/60">
                        <div className="max-w-6xl mx-auto">
                            <FadeUp className="text-center max-w-2xl mx-auto mb-lg">
                                <h2 className="font-display text-headline-lg text-on-background">How it works</h2>
                                <p className="text-on-surface-variant mt-2">A 3-step loop designed for retention and mastery.</p>
                            </FadeUp>
                            <ol className="grid md:grid-cols-3 gap-md">
                                {[
                                    { n: '01', title: 'Pick a subject', desc: 'Browse subjects and units your teacher assigned.', tag: 'Curriculum aligned' },
                                    { n: '02', title: 'Learn and practice', desc: 'Read materials, ask the AI tutor, take quizzes.', tag: '24/7 AI tutor guidance' },
                                    { n: '03', title: 'Earn and track', desc: 'Collect XP, unlock achievements, watch your streak grow.', tag: 'Real-time score and rank' },
                                ].map((step, i) => (
                                    <li key={step.n}>
                                        <FadeUp delay={i * 0.1} className="h-full">
                                            <div className="h-full landing-card p-lg flex flex-col justify-between">
                                                <div>
                                                    <span className="block font-display text-headline-lg text-primary-fixed-dim tabular-nums">{step.n}</span>
                                                    <h3 className="font-headline-md text-headline-md text-on-background mt-sm">{step.title}</h3>
                                                    <p className="text-on-surface-variant text-sm mt-xs">{step.desc}</p>
                                                </div>
                                                    <div className="mt-lg pt-md border-t border-slate-200/70 flex items-center gap-1.5 text-xs font-semibold text-primary">
                                                    {step.tag}
                                                    <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                                                </div>
                                            </div>
                                        </FadeUp>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </section>

                    {/* ===== AI TUTOR ===== */}
                    <section id="ai-tutor" className="section-pad px-lg scroll-mt-20">
                        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-xl items-center">
                            <FadeUp className="lg:col-span-5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/40 text-secondary text-xs font-label-bold uppercase tracking-wider border border-secondary/30 mb-4">
                                    <span className="material-symbols-outlined text-sm" aria-hidden="true">support_agent</span>
                                    Socratic AI companion
                                </span>
                                <h2 className="font-display text-headline-lg text-on-background leading-tight">
                                    Never stay confused with your 24/7 AI tutor.
                                </h2>
                                <p className="text-on-surface-variant mt-4 leading-relaxed">
                                    Real streaming answers with markdown, formulas, and step-by-step explanations that check your understanding as you go.
                                </p>
                                <ul className="mt-6 space-y-3 text-sm text-on-surface">
                                    {[
                                        'Breaks complex equations into digestible steps',
                                        'Supports formula rendering, tables and code blocks',
                                        'Chat history saved to your account',
                                    ].map((point) => (
                                        <li key={point} className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-primary-container/30 text-on-primary-container flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-sm" aria-hidden="true">check</span>
                                            </span>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </FadeUp>

                            <FadeUp delay={0.15} className="lg:col-span-7">
                                <div className="landing-card p-4" style={{ backgroundColor: 'var(--color-surface-container)' }}>
                                    <div className="bg-surface-container-lowest rounded-xl p-4 border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-10 h-10 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">psychology</span>
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm text-on-background">SmartStudy AI Tutor</h4>
                                                    <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                                                </div>
                                                <p className="text-xs text-on-surface-variant">Context: Biology - Photosynthesis</p>
                                            </div>
                                        </div>
                                        <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full bg-primary-container/20 text-on-primary-container border border-primary/20">
                                            Mode: Simple analogy
                                        </span>
                                    </div>
                                    <div className="space-y-4 text-sm mb-4">
                                        <div className="flex items-start justify-end gap-3">
                                            <div className="bg-secondary text-on-secondary p-3.5 rounded-2xl rounded-tr-none max-w-md">
                                                <p className="font-medium">Explain photosynthesis simply. I always get confused between the light reactions and Calvin cycle!</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 font-bold text-xs">AI</span>
                                            <div className="bg-surface-container-lowest p-4 rounded-2xl rounded-tl-none border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] max-w-lg space-y-2">
                                                <p className="text-on-background">Think of the plant cell as a <strong>solar-powered kitchen bakery</strong>:</p>
                                                <div className="p-3 bg-primary-container/10 border border-primary/15 rounded-lg space-y-1.5">
                                                    <p className="text-xs font-semibold text-on-primary-container">1. The solar panels (light reactions)</p>
                                                    <p className="text-xs text-on-surface-variant">Take sunlight and water, charge battery packs (ATP and NADPH), and release oxygen.</p>
                                                    <p className="text-xs font-semibold text-on-primary-container pt-1">2. The oven chef (Calvin cycle)</p>
                                                    <p className="text-xs text-on-surface-variant">Uses that charged energy plus carbon dioxide to bake sugar the plant eats.</p>
                                                </div>
                                                <div className="flex items-center gap-2 pt-1 text-xs flex-wrap">
                                                    <span className="font-bold text-primary">Formula:</span>
                                                    <code className="bg-surface-container px-2 py-0.5 rounded text-[11px] font-mono">6CO2 + 6H2O + light, C6H12O6 + 6O2</code>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            className="w-full bg-surface-container-lowest border border-slate-200/80 rounded-xl py-2.5 pl-4 pr-20 text-sm text-on-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-shadow"
                                            placeholder="Ask anything about your subjects..."
                                            type="text"
                                            aria-label="AI tutor demo input"
                                            readOnly
                                            tabIndex={-1}
                                        />
                                        <span className="absolute right-2 top-1.5 px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-bold text-xs uppercase tracking-wider">
                                            Send
                                        </span>
                                    </div>
                                </div>
                            </FadeUp>
                        </div>
                    </section>

                    {/* ===== ACHIEVEMENTS (real) ===== */}
                    <section id="achievements" className="section-pad px-lg bg-surface-container-low border-y border-slate-200/60 scroll-mt-20">
                        <div className="max-w-6xl mx-auto">
                            <FadeUp className="text-center max-w-2xl mx-auto mb-lg">
                                <span className="text-xs font-label-bold uppercase tracking-widest text-tertiary">Gamified motivation</span>
                                <h2 className="font-display text-headline-lg text-on-background mt-1">Earn achievements as you study</h2>
                                <p className="text-on-surface-variant mt-2">Turn hard study sessions into milestones you can showcase.</p>
                            </FadeUp>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
                                {achievements.map((a, i) => (
                                    <FadeUp key={a.name} delay={i * 0.06}>
                                        <div className="h-full landing-card p-md flex flex-col items-center text-center" style={{ borderColor: 'rgba(226, 145, 0, 0.25)' }}>
                                            <span className="w-14 h-14 rounded-xl bg-tertiary-fixed/40 border border-tertiary/40 flex items-center justify-center mb-3">
                                                <span className="material-symbols-outlined text-2xl text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                                                    {a.icon}
                                                </span>
                                            </span>
                                            <h4 className="font-bold text-on-background">{a.name}</h4>
                                            <p className="text-xs text-on-surface-variant mt-1 flex-1">{a.description}</p>
                                            <span className="mt-3 px-3 py-1 rounded-full text-xs font-label-bold bg-tertiary-fixed/60 text-on-tertiary-container border border-tertiary/40">
                                                +{a.xp_reward} XP
                                            </span>
                                        </div>
                                    </FadeUp>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ===== CTA ===== */}
                    <section className="section-pad px-lg">
                        <FadeUp className="max-w-6xl mx-auto">
                            <div className="bg-primary-container/12 rounded-2xl p-xl border border-primary-container/40 flex flex-col lg:flex-row items-center justify-between gap-lg">
                                <div className="max-w-xl">
                                    <h3 className="font-display text-headline-lg text-on-background leading-snug">Stuck on a tricky question? Just ask your tutor.</h3>
                                    <p className="text-on-surface-variant mt-3">
                                        SmartStudy AI breaks complex formulas and chronologies into bite-sized analogies anyone can grasp in seconds.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-md shrink-0">
                                    {canRegister && (
                                        <Link href={route('register')} className="landing-btn-primary px-xl py-3.5 text-sm w-full sm:w-auto text-center">
                                            Start learning free
                                        </Link>
                                    )}
                                    {canLogin && (
                                        <Link href={route('login')} className="px-lg py-3.5 rounded-full font-label-bold text-label-bold uppercase text-secondary bg-surface-container-lowest border border-secondary hover:bg-secondary-container/15 transition-colors w-full sm:w-auto text-center">
                                            Log in
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </FadeUp>
                    </section>
                </main>

                {/* ===== FOOTER ===== */}
                <footer className="border-t border-slate-200/60 py-lg px-lg bg-surface-container-low">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-sm">
                        <div className="flex items-center gap-sm">
                            <span className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">school</span>
                            </span>
                            <span className="font-body-md text-body-md text-on-surface-variant">&copy; 2026 SmartStudy AI. Learn smarter, not harder.</span>
                        </div>
                        <nav className="flex gap-md text-sm">
                            {canLogin && (
                                <Link href={route('login')} className="text-on-surface-variant hover:text-primary">Login</Link>
                            )}
                            {canRegister && (
                                <Link href={route('register')} className="text-on-surface-variant hover:text-primary">Register</Link>
                            )}
                            <a href="#subjects" className="text-on-surface-variant hover:text-primary">Subjects</a>
                        </nav>
                    </div>
                </footer>
            </div>
        </>
    );
}
