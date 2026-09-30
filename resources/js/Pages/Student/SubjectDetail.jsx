import { Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

/**
 * SubjectDetail — unit/materials list for a single subject.
 * Props: subject (with nested units → materials, all active), slug.
 */
const contentIcon = {
    video: 'play_circle',
    text: 'article',
    pdf: 'picture_as_pdf',
};

function formatDuration(minutes) {
    if (minutes == null) return '';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function MaterialChip({ material, color }) {
    const icon = contentIcon[material.content_type] || 'description';
    return (
        <Link
            href={route('student.materials.show', material.id)}
            className="inline-flex items-center gap-1 px-sm py-xs rounded-full bg-surface-container-high border border-outline-variant/40 hover:bg-surface-container-highest transition-colors text-xs font-body-md text-on-surface-variant"
        >
            <span className="material-symbols-outlined text-[16px]" style={{ color }} aria-hidden="true">{icon}</span>
            <span className="truncate max-w-[140px]">{material.title}</span>
            {material.duration_minutes != null && (
                <span className="text-on-surface-variant/60 shrink-0">{formatDuration(material.duration_minutes)}</span>
            )}
        </Link>
    );
}

export default function SubjectDetail({ auth, subject: subjectProp }) {
    // usePage() must be called unconditionally — calling it inside the
    // fallback of a `??` after an early return breaks the Rules of Hooks.
    const pageProps = usePage().props;

    // Props via function param (konsisten dgn pages lain), fallback usePage.
    const subject = subjectProp ?? pageProps.subject;

    if (!subject) {
        return (
            <AppLayout auth={auth}>
                <div className="flex flex-col items-center gap-sm py-xl text-center">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">school</span>
                    <p className="font-headline-md text-headline-md text-on-surface">Subject not found</p>
                    <Link href={route('student.subjects')} className="text-secondary font-label-bold text-label-bold hover:underline">Back to subjects</Link>
                </div>
            </AppLayout>
        );
    }

    const color = subject.color || '#006590';
    const icon = subject.icon || 'school';
    const units = subject.units || [];

    const totalMaterials = units.reduce((sum, u) => sum + (u.materials?.length || 0), 0);
    const totalMinutes = units.reduce(
        (sum, u) => sum + (u.materials || []).reduce((m, mat) => m + (mat.duration_minutes || 0), 0),
        0,
    );

    return (
        <AppLayout auth={auth}>
            {/* Breadcrumb */}
            <nav className="mb-lg flex items-center gap-2 text-on-surface-variant font-label-bold text-label-bold uppercase flex-wrap" aria-label="Breadcrumb">
                <Link href={route('student.subjects')} className="hover:text-primary transition-colors">Subjects</Link>
                <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
                <span className="text-on-surface">{subject.name}</span>
            </nav>

            {/* Subject header card */}
            <div
                className="bg-surface-container-lowest rounded-2xl chunky-border p-lg flex flex-col sm:flex-row items-center sm:items-start gap-lg mb-xl"
                style={{ backgroundImage: `radial-gradient(circle at 90% 80%, ${color}12 0%, transparent 25%)` }}
            >
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border-2 border-b-4"
                    style={{ backgroundColor: `${color}1a`, borderColor: `${color}33` }}
                >
                    <span className="material-symbols-outlined text-[48px]" style={{ color, fontVariationSettings: "'FILL' 1" }} aria-hidden="true">{icon}</span>
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                    <h1 className="font-display text-display text-on-background">{subject.name}</h1>
                    {subject.description && (
                        <p className="font-body-md text-body-md text-on-surface-variant mt-1">{subject.description}</p>
                    )}
                    {/* Stats row */}
                    <div className="flex flex-wrap gap-sm mt-md">
                        <span className="inline-flex items-center gap-1 px-sm py-xs rounded-full bg-surface-container-high border border-outline-variant/40 font-label-bold text-label-bold text-on-surface-variant text-xs">
                            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">layers</span>
                            {units.length} Unit{units.length !== 1 ? 's' : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 px-sm py-xs rounded-full bg-surface-container-high border border-outline-variant/40 font-label-bold text-label-bold text-on-surface-variant text-xs">
                            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">article</span>
                            {totalMaterials} Material{totalMaterials !== 1 ? 's' : ''}
                        </span>
                        {totalMinutes > 0 && (
                            <span className="inline-flex items-center gap-1 px-sm py-xs rounded-full bg-surface-container-high border border-outline-variant/40 font-label-bold text-label-bold text-on-surface-variant text-xs">
                                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">timer</span>
                                {formatDuration(totalMinutes)} total
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Unit list */}
            {units.length > 0 ? (
                <div className="flex flex-col gap-md pb-xl">
                    {units.map((unit, idx) => {
                        const materials = unit.materials || [];
                        return (
                            <section key={unit.id} className="bg-surface-container-lowest rounded-2xl chunky-border p-lg">
                                <div className="flex items-start gap-md mb-md">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border-2 border-surface-container-highest border-b-4">
                                        <span className="font-headline-md text-headline-md font-black text-on-surface-variant">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-headline-md text-headline-md text-on-surface">{unit.title}</h2>
                                        {unit.description && (
                                            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 line-clamp-2">{unit.description}</p>
                                        )}
                                    </div>
                                </div>

                                {materials.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {materials.map((m) => (
                                            <MaterialChip key={m.id} material={m} color={color} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="font-body-md text-body-md text-on-surface-variant italic">Materials coming soon.</p>
                                )}
                            </section>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">layers</span>
                    <p className="font-headline-md text-headline-md text-on-surface">No units yet</p>
                    <p className="font-body-md text-body-md text-on-surface-variant">This subject is still being prepared. Check back soon!</p>
                </div>
            )}
        </AppLayout>
    );
}
