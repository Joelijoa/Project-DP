import { useState, useEffect, useRef } from 'react';
import { TabInfo } from './AuditBadges';
import AppSelect from '../../../components/common/AppSelect';

// Supprime "X.X — " ou "X.X.X — " en début de description
const stripCode = (str = '') => str.replace(/^[\d.]+\s*[—\-–]\s*/, '').trim();

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

    // KPI comptés par objectif (premier mesure = clé représentative)
    const allObjectifs = mainBodyDomaines.flatMap(d => d.objectifs ?? []);
    const repIds = allObjectifs.map(o => o.mesures?.[0]?.id).filter(Boolean);
    const conforme  = repIds.filter(id => localEvals[id]?.niveau_maturite === 5).length;
    const ncMineure = repIds.filter(id => localEvals[id]?.niveau_maturite === 2).length;
    const ncMajeure = repIds.filter(id => localEvals[id]?.niveau_maturite === 0).length;
    const evaluated = repIds.filter(id => localEvals[id]?.niveau_maturite !== null && localEvals[id]?.niveau_maturite !== undefined).length;

    if (mainBodyDomaines.length === 0) {
        return <TabInfo text="Les exigences SMSI §4-10 ne sont pas encore chargées. Veuillez relancer le seed ISO 27001:2022." />;
    }

    return (
        <div className="space-y-4">
            <TabInfo text="Évaluez la conformité de l'organisme aux exigences obligatoires du corps principal ISO 27001:2022 (§4 à §10). Ces exigences s'appliquent à toutes les organisations certifiées — aucune exclusion n'est permise." />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Exigences totales',  value: repIds.length,  sub: `${evaluated} évaluées`, color: '#111827' },
                    { label: 'Conformes',           value: conforme,                                     color: '#16a34a' },
                    { label: 'NC mineures',         value: ncMineure,                                    color: '#ea580c' },
                    { label: 'NC majeures',         value: ncMajeure,                                    color: '#dc2626' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                        {kpi.sub && <p className="text-xs text-gray-400">{kpi.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Légende niveaux de conformité */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 px-1">
                {[
                    { dot: 'bg-green-600',  label: 'Conforme',    desc: 'Exigence pleinement satisfaite' },
                    { dot: 'bg-orange-500', label: 'NC mineure',  desc: 'Écart limité, correction planifiée requise' },
                    { dot: 'bg-red-600',    label: 'NC majeure',  desc: 'Écart critique, action corrective urgente' },
                ].map(n => (
                    <div key={n.label} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${n.dot}`} />
                        <span className="text-xs font-semibold text-gray-700">{n.label}</span>
                        <span className="text-xs text-gray-400">— {n.desc}</span>
                    </div>
                ))}
            </div>

            {/* Accordion par clause §4-10 */}
            {mainBodyDomaines.map(section => {
                const isOpen = !!openSections[section.id];
                const objList = section.objectifs ?? [];
                const secRepIds = objList.map(o => o.mesures?.[0]?.id).filter(Boolean);
                const secEval = secRepIds.filter(id =>
                    localEvals[id]?.niveau_maturite !== null && localEvals[id]?.niveau_maturite !== undefined
                ).length;

                return (
                    <div key={section.id} ref={el => sectionRefs.current[section.id] = el}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                        <button onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>
                                    §{section.code}
                                </span>
                                <span className="text-sm font-semibold text-gray-800">{section.nom}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">{secEval}/{secRepIds.length} évaluées</span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </button>

                        {isOpen && (
                            <div className="border-t border-gray-100">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/60">
                                            <th className="text-left px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider w-48">Exigence</th>
                                            <th className="text-left px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider w-36">Conformité</th>
                                            <th className="text-left px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider w-32">Preuves / Références</th>
                                            <th className="text-left px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Constat</th>
                                            <th className="text-left px-3 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Recommandation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {objList.map(obj => {
                                            const repId = obj.mesures?.[0]?.id;
                                            if (!repId) return null;
                                            const ev = localEvals[repId] || {};
                                            const niveau = ev.niveau_maturite ?? null;
                                            const title = stripCode(obj.description || '');
                                            return (
                                                <tr key={obj.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors align-top">
                                                    {/* Exigence */}
                                                    <td className="px-5 py-3">
                                                        <span className="font-mono text-[11px] text-gray-400 mr-2">{obj.code}</span>
                                                        <span className="text-xs text-gray-700">{title}</span>
                                                    </td>
                                                    {/* Conformité dropdown */}
                                                    <td className="px-3 py-3">
                                                        <AppSelect
                                                            value={niveau === null || niveau === undefined ? '' : String(niveau)}
                                                            onChange={v => {
                                                                if (readOnly) return;
                                                                setEval(repId, 'niveau_maturite', v === '' ? null : parseInt(v));
                                                            }}
                                                            locked={readOnly}
                                                            size="sm"
                                                            options={[
                                                                { value: '',  label: '— Sélectionner —' },
                                                                { value: '5', label: 'Conforme' },
                                                                { value: '2', label: 'NC mineure' },
                                                                { value: '0', label: 'NC majeure' },
                                                            ]}
                                                        />
                                                    </td>
                                                    {/* Preuves */}
                                                    <td className="px-3 py-3">
                                                        <input type="text" value={ev.preuve || ''}
                                                            onChange={e => !readOnly && setEval(repId, 'preuve', e.target.value)}
                                                            readOnly={readOnly}
                                                            placeholder={readOnly ? '—' : 'Références...'}
                                                            className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed" />
                                                    </td>
                                                    {/* Constat */}
                                                    <td className="px-3 py-3">
                                                        <textarea value={ev.commentaire || ''}
                                                            onChange={e => !readOnly && setEval(repId, 'commentaire', e.target.value)}
                                                            readOnly={readOnly}
                                                            rows={5}
                                                            placeholder={readOnly ? '—' : 'Constat...'}
                                                            className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed resize-y" />
                                                    </td>
                                                    {/* Recommandation */}
                                                    <td className="px-3 py-3">
                                                        <textarea value={ev.recommandation || ''}
                                                            onChange={e => !readOnly && setEval(repId, 'recommandation', e.target.value)}
                                                            readOnly={readOnly}
                                                            rows={5}
                                                            placeholder={readOnly ? '—' : 'Recommandation...'}
                                                            className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed resize-y" />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}

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
