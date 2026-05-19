import { PHASES_DEF } from './auditConstants';

const PhasesStepper = ({ phase, statut, canChange, onPrev, onNext, nextConfig, changing }) => {
    const allDone = statut === 'termine';
    const currentIdx = PHASES_DEF.findIndex(p => p.id === phase);
    const idx = allDone ? PHASES_DEF.length : (currentIdx < 0 ? 0 : currentIdx);
    const showRight = (canChange && !allDone && idx > 0) || nextConfig;
    return (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-1 flex-1 min-w-0">
                {PHASES_DEF.map((p, i) => {
                    const done = i < idx;
                    const current = i === idx;
                    return (
                        <div key={p.id} className="flex items-center gap-1">
                            {i > 0 && (
                                <div className="h-px w-4 flex-shrink-0" style={{ backgroundColor: done || allDone ? '#16a34a' : i <= idx ? 'var(--brand-red)' : '#e5e7eb' }} />
                            )}
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition-all ${done ? 'bg-green-100 text-green-700' : current ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                                style={current ? { backgroundColor: 'var(--brand-red)' } : {}}>
                                {done ? '✓ ' : ''}{p.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            {showRight && (
                <div className="ml-2 pl-2 border-l border-gray-100 flex items-center gap-2 flex-shrink-0">
                    {canChange && !allDone && idx > 0 && (
                        <button onClick={onPrev} disabled={changing}
                            className="px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50 transition">
                            ← Reculer
                        </button>
                    )}
                    {nextConfig && (
                        <button onClick={onNext} disabled={nextConfig.disabled}
                            title={nextConfig.title || ''}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            style={{ backgroundColor: 'var(--brand-red)' }}>
                            {changing ? 'En cours…' : nextConfig.label}
                            {!changing && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PhasesStepper;
