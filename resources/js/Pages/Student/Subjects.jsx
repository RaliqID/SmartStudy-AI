import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

/**
 * Subjects — browse all subjects with client-side search.
 * Props: subjects (Subject model w/ active units) from SubjectsController@index.
 */
export default function Subjects({ auth, subjects = [] }) {
    const [searchQuery, setSearchQuery] = useState('');

    const query = searchQuery.trim().toLowerCase();
    const filtered = query
        ? subjects.filter((s) =>
              s.name?.toLowerCase().includes(query) || s.description?.toLowerCase().includes(query)
          )
        : subjects;

    return (
        <AppLayout auth={auth}>
            {/* Header */}
            <div className="mb-lg">
                <h1 className="font-display text-display text-on-background mb-xs">Subjects</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Explore your learning materials.</p>
            </div>

            {/* Search */}
            <div className="mb-lg relative max-w-xl">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" aria-hidden="true">search</span>
                <input
                    type="search"
                    placeholder="Search subjects…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search subjects"
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-2xl py-3 pl-12 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
                />
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg pb-xl">
                    {filtered.map((subject) => (
                        <Link
                            key={subject.id}
                            href={route('student.subjects.show', subject.slug)}
                            className="group bg-surface-container-lowest border-2 border-surface-variant border-b-[6px] rounded-[24px] p-lg flex flex-col items-center text-center hover:translate-y-[-2px] transition-transform active:translate-y-[2px] active:border-b-[2px]"
                            style={{
                                backgroundImage: `radial-gradient(circle at 10% 20%, ${subject.color}0d 0%, transparent 25%), radial-gradient(circle at 90% 80%, ${subject.color}0d 0%, transparent 25%)`,
                            }}
                        >
                            <div
                                className="w-24 h-24 rounded-full flex items-center justify-center mb-md"
                                style={{ backgroundColor: `${subject.color}1a` }}
                            >
                                <span
                                    className="material-symbols-outlined text-[48px]"
                                    style={{ color: subject.color, fontVariationSettings: "'FILL' 1" }}
                                    aria-hidden="true"
                                >
                                    {subject.icon || 'school'}
                                </span>
                            </div>
                            <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">{subject.name}</h2>
                            {subject.description && (
                                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-md">{subject.description}</p>
                            )}
                            <div className="mt-auto w-full flex items-center justify-center gap-1 font-label-bold text-label-bold text-on-surface-variant uppercase text-xs">
                                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">layers</span>
                                {subject.units?.length || 0} Units
                            </div>
                            <div
                                className="mt-sm w-full bg-surface-container-high group-hover:bg-surface-container-highest rounded-xl py-sm px-lg font-label-bold text-label-bold uppercase flex items-center justify-center gap-1 transition-colors"
                                style={{ color: subject.color }}
                            >
                                Open
                                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform" aria-hidden="true">arrow_forward</span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-surface-container-lowest rounded-2xl chunky-border p-xl flex flex-col items-center gap-sm text-center">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant" aria-hidden="true">
                        {subjects.length === 0 ? 'school' : 'search_off'}
                    </span>
                    <p className="font-headline-md text-headline-md text-on-surface">
                        {subjects.length === 0 ? 'No subjects available yet' : `No results for "${searchQuery}"`}
                    </p>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                        {subjects.length === 0 ? 'Check back soon — new subjects are on the way!' : 'Try a different keyword.'}
                    </p>
                </div>
            )}
        </AppLayout>
    );
}
