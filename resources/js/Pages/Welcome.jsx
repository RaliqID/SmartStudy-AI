import { Head, Link } from '@inertiajs/react';

export default function Welcome({ canLogin, canRegister }) {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-background text-on-background font-sans flex flex-col">
                {/* Hero */}
                <section className="flex-1 flex flex-col items-center justify-center px-lg py-xl text-center">
                    <div className="max-w-2xl mx-auto flex flex-col items-center gap-lg">
                        <div className="flex items-center gap-md">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary flex items-center justify-center border-2 border-white/20 shrink-0">
                                <span className="material-symbols-outlined text-4xl md:text-5xl text-white" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                                    school
                                </span>
                            </div>
                            <h1 className="font-display text-display md:text-5xl text-on-background tracking-tight">SmartStudy AI</h1>
                        </div>

                        <p className="font-body-lg text-body-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed block">
                            Learn smarter with AI tutor, gamified quizzes, and progress tracking.
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center">
                            {canLogin && (
                                <Link
                                    href={route('login')}
                                    className="bg-primary text-on-primary px-xl py-3 rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-primary-fixed hover:brightness-105"
                                >
                                    Log in
                                </Link>
                            )}
                            {canRegister && (
                                <Link
                                    href={route('register')}
                                    className="bg-secondary-container text-on-secondary-container px-xl py-3 rounded-2xl font-label-bold text-label-bold uppercase btn-chunky border-2 border-secondary hover:opacity-90"
                                >
                                    Register
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t-2 border-outline-variant py-md px-lg">
                    <p className="font-body-md text-body-md text-on-surface-variant/60 text-center">
                        &copy; 2026 SmartStudy AI — Learn smarter, not harder.
                    </p>
                </footer>
            </div>
        </>
    );
}
