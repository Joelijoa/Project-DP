import { useState, useEffect, useRef } from 'react';
import { ISO_CONF_STATES } from './auditConstants';
import { stripObjectifPrefix } from './auditHelpers';
import { TabInfo, TabPlaceholder } from './AuditBadges';
import AppTooltip from '../../../components/common/AppTooltip';

const TabEvaluationISO = ({ referentiel, soaMap, localEvals, setEval, isDirty, saving, onSave, readOnly }) => {
    const [openThemes, setOpenThemes] = useState({});
    const themeRefs = useRef({});

    useEffect(() => {
        if (referentiel?.domaines?.length > 0) {
            setOpenThemes({ [referentiel.domaines[0].id]: true });
        }
    }, [referentiel]);

    const toggleTheme = (id) => {
        setOpenThemes(prev => {
            const isNowOpen = !prev[id];
            if (isNowOpen) setTimeout(() => {
                const el = themeRefs.current[id];
                if (el) el.style.scrollMarginTop = '120px';
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
            return { [id]: isNowOpen };
        });
    };

    const annexeDomaines = referentiel?.domaines?.filter(d => d.code.startsWith('A.')) ?? [];

    const allApplicable = annexeDomaines.flatMap(d =>
        d.objectifs?.flatMap(o => o.mesures?.filter(m => soaMap[m.id]?.applicable === true) ?? []) ?? []
    );

    if (allApplicable.length === 0) {
        return (
            <div className="space-y-4">
                <TabInfo text="Complétez d'abord la Déclaration d'Applicabilité pour définir les contrôles applicables avant d'évaluer." />
                <TabPlaceholder titre="Aucun contrôle applicable défini" texte="Retournez à l'onglet 'Déclaration d'Applicabilité' et marquez les contrôles applicables avant de commencer l'évaluation." />
            </div>
        );
    }

    const conforme = allApplicable.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
    const ncMineure = allApplicable.filter(m => localEvals[m.id]?.niveau_maturite === 2).length;
    const ncMajeure = allApplicable.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
    const evaluated = conforme + ncMineure + ncMajeure;

    return (
        <div className="space-y-4">
            <TabInfo text="Évaluez la conformité de chaque contrôle ISO 27001:2022 applicable défini dans la SoA. Pour chaque contrôle, indiquez s'il est Conforme, NC mineure ou NC majeure, puis ajoutez votre constat et vos recommandations." />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Contrôles applicables', value: allApplicable.length, sub: `${evaluated} évalués`, color: '#111827' },
                    { label: 'Conformes', value: conforme, color: '#16a34a' },
                    { label: 'NC mineures', value: ncMineure, color: '#ea580c' },
                    { label: 'NC majeures', value: ncMajeure, color: '#dc2626' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                        {kpi.sub && <p className="text-xs text-gray-400">{kpi.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Accordion par thème — Annexe A uniquement */}
            {annexeDomaines.map(theme => {
                const isOpen = !!openThemes[theme.id];
                const themeMesures = theme.objectifs?.flatMap(o =>
                    o.mesures?.filter(m => soaMap[m.id]?.applicable === true) ?? []) ?? [];

                if (themeMesures.length === 0) return null;

                const themeEval = themeMesures.filter(m =>
                    localEvals[m.id]?.niveau_maturite !== null && localEvals[m.id]?.niveau_maturite !== undefined
                ).length;

                return (
                    <div key={theme.id} ref={el => themeRefs.current[theme.id] = el} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button onClick={() => toggleTheme(theme.id)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>
                                    {theme.code}
                                </span>
                                <span className="text-sm font-semibold text-gray-800">{theme.nom}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">{themeEval}/{themeMesures.length} évalués</span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </button>

                        {isOpen && (
                            <div className="border-t border-gray-100">
                                {theme.objectifs?.map(objectif => {
                                    const objApplicable = objectif.mesures?.filter(m => soaMap[m.id]?.applicable === true) ?? [];
                                    if (objApplicable.length === 0) return null;
                                    const objDesc = stripObjectifPrefix(objectif.description || '');
                                    return (
                                        <div key={objectif.id} className="border-b border-gray-50 last:border-0">
                                            <div className="px-5 py-2.5 bg-gray-50/60">
                                                <p className="text-xs font-semibold text-gray-600">
                                                    <span className="text-gray-400 mr-1">{objectif.code}</span>
                                                    {objDesc}
                                                </p>
                                            </div>
                                            {objApplicable.map(mesure => {
                                                const ev = localEvals[mesure.id] || {};
                                                const niveau = ev.niveau_maturite ?? null;
                                                return (
                                                    <div key={mesure.id} className="px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                                        <div className="flex items-start gap-4">
                                                            {/* Code + tooltip */}
                                                            <div className="flex-shrink-0 w-20">
                                                                <AppTooltip code={mesure.code?.trim()} description={mesure.description} />
                                                            </div>
                                                            {/* Description de la règle */}
                                                            <p className="flex-1 text-xs text-gray-700 leading-relaxed">{mesure.description || objDesc}</p>
                                                            {/* 3-state toggle */}
                                                            <div className="flex items-center flex-shrink-0">
                                                                {ISO_CONF_STATES.map((s, idx) => (
                                                                    <button key={s.value}
                                                                        onClick={() => !readOnly && setEval(mesure.id, 'niveau_maturite', niveau === s.value ? null : s.value)}
                                                                        className={`px-2.5 py-1 text-xs font-medium border transition
                                                                            ${idx === 0 ? 'rounded-l-md border-r-0' : ''}
                                                                            ${idx === ISO_CONF_STATES.length - 1 ? 'rounded-r-md' : ''}
                                                                            ${idx > 0 && idx < ISO_CONF_STATES.length - 1 ? 'border-r-0' : ''}
                                                                            ${readOnly ? 'cursor-not-allowed' : ''}
                                                                            ${niveau === s.value ? s.activeCls : s.inactiveCls}`}
                                                                    >
                                                                        {s.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {/* Preuve + constat + recommandation si évalué */}
                                                        {niveau !== null && (
                                                            <div className="mt-2 ml-24 grid gap-3" style={{ gridTemplateColumns: '180px 1fr 1fr' }}>
                                                                <input type="text" value={ev.preuve || ''}
                                                                    onChange={e => !readOnly && setEval(mesure.id, 'preuve', e.target.value)}
                                                                    readOnly={readOnly}
                                                                    placeholder={readOnly ? '—' : 'Références / preuves...'}
                                                                    className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed self-start" />
                                                                <textarea value={ev.commentaire || ''}
                                                                    onChange={e => !readOnly && setEval(mesure.id, 'commentaire', e.target.value)}
                                                                    readOnly={readOnly}
                                                                    rows={4}
                                                                    placeholder={readOnly ? '—' : 'Constat...'}
                                                                    className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed resize-y" />
                                                                <textarea value={ev.recommandation || ''}
                                                                    onChange={e => !readOnly && setEval(mesure.id, 'recommandation', e.target.value)}
                                                                    readOnly={readOnly}
                                                                    rows={4}
                                                                    placeholder={readOnly ? '—' : 'Recommandation...'}
                                                                    className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed resize-y" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Bouton flottant sauvegarde */}
            {isDirty && !readOnly && (
                <div className="sticky bottom-4 flex justify-end">
                    <button onClick={onSave} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl shadow-lg transition disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                        Sauvegarder l'évaluation
                    </button>
                </div>
            )}
        </div>
    );
};

export default TabEvaluationISO;
