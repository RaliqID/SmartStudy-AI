import { Link, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';

/**
 * Material — content viewer (video/text/pdf) + completion + prev/next nav.
 * Props: material {id,title,content_type,content_url,text_content,duration_minutes},
 *        unit {id,title}|null, subject {id,name,slug,icon,color}|null,
 *        prev {id,title}|null, next {id,title}|null, isCompleted bool
 */

/**
 * Study notes are authored as HTML by teachers/admins, so they must be
 * rendered as markup rather than shown as escaped source. Anything that can
 * execute or load remote resources is stripped first (defence in depth: the
 * same content is also sanitised on input by the admin/teacher forms).
 */
const ALLOWED_TAGS = new Set([
    'H2', 'H3', 'H4', 'P', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'B', 'I',
    'U', 'BR', 'HR', 'BLOCKQUOTE', 'CODE', 'PRE', 'A',
]);

function sanitizeHtml(html) {
    if (typeof window === 'undefined' || !html) return '';

    // DOMParser does not execute scripts or fetch resources, so parsing in an
    // inert document is safe; we then walk the tree and drop anything risky.
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);

    const doomed = [];
    while (walker.nextNode()) {
        const el = walker.currentNode;
        if (!ALLOWED_TAGS.has(el.tagName)) {
            doomed.push(el);
            continue;
        }
        // Keep only href on links; drop every other attribute (onclick, style,
        // src, srcset, srcdoc, …) so no handler or remote load survives.
        [...el.attributes].forEach((attr) => {
            const keep = el.tagName === 'A' && attr.name === 'href';
            if (!keep) el.removeAttribute(attr.name);
        });
        if (el.tagName === 'A') {
            const href = el.getAttribute('href') || '';
            // Block javascript:/data: URLs; force external links to open safely.
            if (!/^(https?:|\/|#|mailto:)/i.test(href)) {
                el.removeAttribute('href');
            } else if (/^https?:/i.test(href)) {
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener noreferrer');
            }
        }
    }
    doomed.forEach((el) => el.replaceWith(...el.childNodes));

    return doc.body.innerHTML;
}

/** Rich study notes: HTML if the content looks like markup, else plain text. */
function ContentBlock({ text }) {
    const raw = String(text || '');

    // Legacy plain-text notes (separated by blank lines) keep the old layout.
    const safeHtml = useMemo(
        () => sanitizeHtml(/<[a-z][\s\S]*>/i.test(raw) ? raw : ''),
        [raw],
    );

    if (!safeHtml) {
        return (
            <div className="flex flex-col gap-md">
                {raw
                    .split(/\n{2,}/)
                    .filter(Boolean)
                    .map((para, i) => (
                        <p key={i} className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                            {para}
                        </p>
                    ))}
            </div>
        );
    }

    return (
        <div
            className="material-notes font-body-md text-body-md text-on-surface-variant"
            // Sanitised above: only an allow-list of tags and attributes survives.
            dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
    );
}

function MaterialContent({ material }) {
    if (material.content_type === 'video' && material.content_url) {
        return (
            <div className="aspect-video w-full bg-surface-container-highest rounded-2xl border-2 border-surface-container-highest border-b-4 overflow-hidden">
                <iframe
                    src={material.content_url}
                    title={material.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                ></iframe>
            </div>
        );
    }

    if (material.content_type === 'pdf' && material.content_url) {
        return (
            <div className="flex flex-col gap-sm">
                <iframe
                    src={material.content_url}
                    title={material.title}
                    className="w-full h-[70vh] bg-surface-container-highest rounded-2xl border-2 border-surface-container-highest border-b-4"
                    loading="lazy"
                ></iframe>
                <a
                    href={material.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start flex items-center gap-1 text-secondary font-label-bold text-label-bold hover:underline"
                >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">open_in_new</span>
                    Open PDF in new tab
                </a>
            </div>
        );
    }

    if (material.text_content) {
        return <ContentBlock text={material.text_content} />;
    }

    return (
        <div className="flex flex-col items-center gap-sm py-xl text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">description</span>
            <p className="font-body-md text-body-md text-on-surface-variant">No content available for this material yet.</p>
        </div>
    );
}

function SiblingNavCard({ sibling, direction }) {
    const isPrev = direction === 'prev';
    const icon = isPrev ? 'arrow_back' : 'arrow_forward';
    const label = isPrev ? 'Previous' : 'Next';

    if (!sibling) {
        return (
            <div className="flex-1 rounded-2xl border-2 border-dashed border-outline-variant/50 p-md flex items-center gap-sm opacity-50" aria-disabled="true">
                <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">{icon}</span>
                <div className="min-w-0">
                    <p className="font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">{label}</p>
                    <p className="font-body-md text-body-md text-on-surface-variant/70">—</p>
                </div>
            </div>
        );
    }

    return (
        <Link
            href={route('student.materials.show', sibling.id)}
            preserveScroll
            className={`flex-1 min-w-0 bg-surface-container-lowest rounded-2xl chunky-border p-md flex items-center gap-sm hover:bg-surface-container-low transition-colors ${
                isPrev ? '' : 'justify-end text-right'
            }`}
        >
            {isPrev && <span className="material-symbols-outlined text-secondary shrink-0" aria-hidden="true">{icon}</span>}
            <div className="min-w-0 flex-1" style={{ order: isPrev ? 1 : 2 }}>
                <p className="font-label-bold text-label-bold text-secondary uppercase text-xs">{label}</p>
                <p className="font-body-md text-body-md font-bold text-on-surface truncate">{sibling.title}</p>
            </div>
            {!isPrev && <span className="material-symbols-outlined text-secondary shrink-0" style={{ order: 3 }} aria-hidden="true">{icon}</span>}
        </Link>
    );
}

export default function Material({ auth, material, unit, subject, prev, next, isCompleted }) {
    const { post, processing } = useForm();
    const flash = usePage().props.flash;

    const color = subject?.color || '#006590';
    const icon = subject?.icon || 'menu_book';
    const typeMeta = {
        video: { icon: 'play_circle', label: 'Video' },
        text: { icon: 'article', label: 'Reading' },
        pdf: { icon: 'picture_as_pdf', label: 'PDF' },
    };
    const meta = typeMeta[material.content_type] || { icon: 'school', label: 'Material' };

    const markComplete = (e) => {
        e.preventDefault();
        post(route('student.materials.complete', material.id));
    };

    return (
        <AppLayout auth={auth}>
            <div className="max-w-3xl mx-auto">
                {/* Breadcrumb */}
                <nav className="mb-lg flex items-center gap-2 text-on-surface-variant font-label-bold text-label-bold uppercase flex-wrap" aria-label="Breadcrumb">
                    <Link href={route('student.subjects')} className="hover:text-primary transition-colors">Subjects</Link>
                    {subject && (
                        <>
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
                            <Link href={route('student.subjects.show', subject.slug)} className="hover:text-primary transition-colors truncate">{subject.name}</Link>
                        </>
                    )}
                    {unit && (
                        <>
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
                            <span className="text-on-surface truncate">{unit.title}</span>
                        </>
                    )}
                </nav>

                {/* Header card */}
                <div
                    className="rounded-3xl border-2 border-surface-container-highest border-b-4 overflow-hidden bg-surface-container-lowest"
                >
                    <div
                        className="p-lg relative"
                        style={{
                            backgroundImage: `radial-gradient(circle at 10% 20%, ${color}12 0%, transparent 25%), radial-gradient(circle at 90% 80%, ${color}12 0%, transparent 25%)`,
                        }}
                    >
                        <div className="flex items-start justify-between gap-md flex-wrap">
                            <div className="flex items-center gap-md min-w-0">
                                <div
                                    className="w-14 h-14 rounded-2xl border-2 border-b-4 flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${color}1a`, color, borderColor: `${color}33` }}
                                >
                                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                                        {icon}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-sm flex-wrap">
                                        <span className="font-label-bold text-label-bold text-primary uppercase flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm" aria-hidden="true">{meta.icon}</span>
                                            {meta.label}
                                        </span>
                                        {material.duration_minutes != null && (
                                            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm" aria-hidden="true">timer</span>
                                                {material.duration_minutes} min
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="font-display text-display font-black text-on-surface tracking-tight mt-1">{material.title}</h1>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-lg md:p-xl">
                        <MaterialContent material={material} />
                    </div>

                    {/* Completion */}
                    <div className="px-lg md:px-xl pb-lg">
                        {flash?.success && (
                            <div className="mb-md bg-primary-container/10 border-2 border-primary/30 rounded-2xl p-md flex items-center gap-sm" role="status">
                                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                                <p className="font-body-md text-body-md text-primary font-bold">{flash.success}</p>
                            </div>
                        )}

                        {isCompleted ? (
                            <div className="bg-primary-container/10 border-2 border-primary/30 rounded-2xl p-md flex items-center justify-between gap-md flex-wrap">
                                <div className="flex items-center gap-sm">
                                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                                    <p className="font-label-bold text-label-bold text-primary uppercase">Completed ✓</p>
                                </div>
                                <p className="font-label-bold text-label-bold text-tertiary flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">bolt</span>
                                    XP Earned
                                </p>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={markComplete}
                                disabled={processing}
                                className="w-full bg-primary text-on-primary py-3 rounded-2xl font-label-bold text-label-bold uppercase tracking-wider btn-chunky border-2 border-on-primary-fixed-variant hover:brightness-105 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">task_alt</span>
                                {processing ? 'Saving...' : 'Mark as Complete'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Prev / Next navigation */}
                <div className="mt-lg flex flex-col sm:flex-row gap-sm">
                    <SiblingNavCard sibling={prev} direction="prev" />
                    <SiblingNavCard sibling={next} direction="next" />
                </div>
            </div>
        </AppLayout>
    );
}
