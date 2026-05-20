import { useState, useEffect, useRef } from 'react';
import { ISO_CONF_STATES } from './auditConstants';
import { TabInfo } from './AuditBadges';

const TabExigencesSMSI = ({ referentiel, localEvals, setEval, isDirty, saving, onSave, readOnly }) => {
    const [openSections, setOpenSections] = useState({});
    const sectionRefs = useRef({});

    useEffect(() => {
        const mainBody = referentiel?.domaines?.filter(d => !d.code.startsWith('A.')) ?? [];
        if (mainBody.length > 0) setOpenSections({ [mainBody[0].id]: true });
    }, [referentiel]);

    const toggleSection = (id) => {
        setOpenSections(prev => {
            const isNowOpen = !prev[id];
            if (isNowOpen) setTimeout(() => {
                const el = sectionRefs.current[id];
                if (el) el.style.scrollMarginTop = '120px';
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
            return { [id]: isNowOpen };
        });
    };

    const mainBodyDomaines = referentiel?.domaines?.filter(d => !d.code.startsWith('A.')) ?? [];
    const allMesures = mainBodyDomaines.flatMap(d => d.objectifs?.flatMap(o => o.mesures ?? []) ?? []);

    const conforme = allMesures.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
    const ncMineure = allMesures.filter(m => localEvals[m.id]?.niveau_maturite === 2).length;
    const ncMajeure = allMesures.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
    const evaluated = conforme + ncMineure + ncMajeure;

    if (mainBodyDomaines.length === 0) {
        return (
            <div className="space-y-4">
                <TabInfo text="Les exigences SMSI §4-10 ne sont pas encore chargées. Veuillez relancer le seed ISO 27001:2022." />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <TabInfo text="Évaluez la conformité de l'organisme aux exigences obligatoires du corps principal ISO 27001:2022 (§4 à §10). Ces exigences s'appliquent à toutes les organisations certifiées — aucune exclusion n'est permise." />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-4">
                        <p className="text-xs font-medium text-gray-400">Exigences totales</p>
                        <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-gray-900">{allMesures.length}</p>
                    <p className="text-xs text-gray-400 mt-1">{evaluated} évaluées</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-4">
                        <p className="text-xs font-medium text-gray-400">Conformes</p>
                        <div className="p-1.5 rounded-lg bg-green-50 text-green-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-green-600">{conforme}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-4">
                        <p className="text-xs font-medium text-gray-400">NC mineures</p>
                        <div className="p-1.5 rounded-lg bg-orange-50 text-orange-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-orange-600">{ncMineure}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-4">
                        <p className="text-xs font-medium text-gray-400">NC majeures</p>
                        <div className="p-1.5 rounded-lg bg-red-50 text-red-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-red-600">{ncMajeure}</p>
                </div>
            </div>

            {/* Accordion par section §4-10 */}
            {mainBodyDomaines.map(section => {
                const isOpen = !!openSections[section.id];
                const sectionMesures = section.objectifs?.flatMap(o => o.mesures ?? []) ?? [];
                const sectionEval = sectionMesures.filter(m =>
                    localEvals[m.id]?.niveau_maturite !== null && localEvals[m.id]?.niveau_maturite !== undefined
                ).length;

                return (
                    <div key={section.id} ref={el => sectionRefs.current[section.id] = el} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>
                                    §{section.code}
                                </span>
                                <span className="text-sm font-semibold text-gray-800">{section.nom}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">{sectionEval}/{sectionMesures.length} évaluées</span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </button>

                        {isOpen && (
                            <div className="border-t border-gray-100 divide-y divide-gray-50">
                                {section.objectifs?.map(obj => (
                                    <div key={obj.id} className="px-5 py-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{obj.description}</p>
                                        <div className="space-y-3">
                                            {obj.mesures?.map(mesure => {
                                                const ev = localEvals[mesure.id] || {};
                                                const niveau = ev.niveau_maturite ?? null;
                                                return (
                                                    <div key={mesure.id} className="rounded-xl border border-gray-100 bg-gray-50/40 p-3">
                                                        <div className="flex items-start gap-3">
                                                            <span className="font-mono text-[11px] text-gray-400 flex-shrink-0 w-16 pt-0.5">{mesure.code}</span>
                                                            <p className="flex-1 text-xs text-gray-700 leading-relaxed">{mesure.description}</p>
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
                                                        {niveau !== null && (
                                                            <div className="mt-2 ml-[76px] grid gap-3" style={{ gridTemplateColumns: '180px 1fr 1fr' }}>
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
                                    </div>
                                ))}
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

export default TabExigencesSMSI;
