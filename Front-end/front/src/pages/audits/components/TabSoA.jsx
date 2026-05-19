import { useState, useEffect } from 'react';
import { RAISONS_INCLUSION, STATUT_IMPL_CONFIG } from './auditConstants';
import { stripObjectifPrefix } from './auditHelpers';
import { TabInfo } from './AuditBadges';
import AppSelect from '../../../components/common/AppSelect';
import AppTooltip from '../../../components/common/AppTooltip';

const TabSoA = ({ referentiel, soaMap, setSoaEntry, soaDirty, savingSoa, onSave, readOnly }) => {
    const [openThemes, setOpenThemes] = useState({});

    // Ouvrir le 1er thème par défaut
    useEffect(() => {
        if (referentiel?.domaines?.length > 0) {
            setOpenThemes({ [referentiel.domaines[0].id]: true });
        }
    }, [referentiel]);

    const toggleTheme = (id) => setOpenThemes(prev => ({ ...prev, [id]: !prev[id] }));

    // KPIs
    const allMesures = referentiel?.domaines?.flatMap(d => d.objectifs?.flatMap(o => o.mesures ?? []) ?? []) ?? [];
    const total = allMesures.length;
    const applicable = allMesures.filter(m => soaMap[m.id]?.applicable === true).length;
    const nonApplicable = allMesures.filter(m => soaMap[m.id]?.applicable === false).length;
    const undecided = total - applicable - nonApplicable;

    const toggleRaison = (mesureId, value) => {
        const current = soaMap[mesureId]?.raisons_inclusion ?? [];
        const next = current.includes(value)
            ? current.filter(r => r !== value)
            : [...current, value];
        setSoaEntry(mesureId, 'raisons_inclusion', next);
    };

    return (
        <div className="space-y-4">
            <TabInfo text="La Déclaration d'Applicabilité (SoA) est un document central de l'ISO 27001. Elle liste tous les contrôles de l'Annexe A et indique pour chacun s'il est applicable ou non, les raisons de son inclusion, son statut d'implémentation et les références documentaires associées." />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total contrôles', value: total, color: '#111827' },
                    { label: 'Applicables', value: applicable, color: '#16a34a' },
                    { label: 'Non applicables', value: nonApplicable, color: '#dc2626' },
                    { label: 'À décider', value: undecided, color: '#d97706' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Accordion par thème */}
            {referentiel?.domaines?.map(theme => {
                const isOpen = !!openThemes[theme.id];
                const themeMesures = theme.objectifs?.flatMap(o => o.mesures ?? []) ?? [];
                const themeApplicable = themeMesures.filter(m => soaMap[m.id]?.applicable === true).length;
                const themeTotal = themeMesures.length;

                return (
                    <div key={theme.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button
                            onClick={() => toggleTheme(theme.id)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>
                                    {theme.code}
                                </span>
                                <span className="text-sm font-semibold text-gray-800">{theme.nom}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">{themeApplicable}/{themeTotal} applicables</span>
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${themeTotal > 0 ? (themeApplicable / themeTotal) * 100 : 0}%` }} />
                                </div>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </button>

                        {isOpen && (
                            <div className="border-t border-gray-100">
                                {theme.objectifs?.map(objectif => {
                                    if (!objectif.mesures?.length) return null;
                                    const objDesc = stripObjectifPrefix(objectif.description || '');
                                    return (
                                        <div key={objectif.id} className="border-b border-gray-50 last:border-0">
                                            {/* En-tête objectif */}
                                            <div className="px-5 py-2.5 bg-gray-50/60">
                                                <p className="text-xs font-semibold text-gray-600">
                                                    <span className="text-gray-400 mr-1">{objectif.code}</span>
                                                    {objDesc}
                                                </p>
                                            </div>

                                            {/* Lignes contrôles */}
                                            {objectif.mesures?.map(mesure => {
                                                const entry = soaMap[mesure.id] || {};
                                                const isApplicable = entry.applicable;
                                                const raisons = entry.raisons_inclusion ?? [];

                                                return (
                                                    <div key={mesure.id} className="px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                                        {/* Ligne principale */}
                                                        <div className="flex items-start gap-4">
                                                            {/* Code + tooltip */}
                                                            <div className="flex-shrink-0 w-24">
                                                                <AppTooltip code={mesure.code?.trim()} description={mesure.description} />
                                                            </div>

                                                            {/* Description de la règle */}
                                                            <p className="flex-1 text-xs text-gray-700 leading-relaxed">{mesure.description || objDesc}</p>

                                                            {/* Toggle applicable */}
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                <button
                                                                    onClick={() => !readOnly && setSoaEntry(mesure.id, 'applicable', isApplicable === true ? null : true)}
                                                                    disabled={readOnly}
                                                                    className={`px-2.5 py-1 text-xs font-medium rounded-l-md border transition ${isApplicable === true ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200 hover:border-green-400'} ${readOnly ? 'cursor-default' : ''}`}
                                                                >
                                                                    Oui
                                                                </button>
                                                                <button
                                                                    onClick={() => !readOnly && setSoaEntry(mesure.id, 'applicable', isApplicable === false ? null : false)}
                                                                    disabled={readOnly}
                                                                    className={`px-2.5 py-1 text-xs font-medium rounded-r-md border-t border-r border-b transition ${isApplicable === false ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-500 border-gray-200 hover:border-red-400'} ${readOnly ? 'cursor-default' : ''}`}
                                                                >
                                                                    Non
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Détails si applicable = true */}
                                                        {isApplicable === true && (
                                                            <div className="mt-3 ml-28 space-y-3">
                                                                {/* Raisons d'inclusion */}
                                                                <div>
                                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Raisons d'inclusion</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {RAISONS_INCLUSION.map(r => (
                                                                            <label key={r.value} className={`flex items-center gap-1.5 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={raisons.includes(r.value)}
                                                                                    onChange={() => !readOnly && toggleRaison(mesure.id, r.value)}
                                                                                    disabled={readOnly}
                                                                                    className="w-3 h-3 rounded accent-red-600"
                                                                                />
                                                                                <span className="text-xs text-gray-600">{r.label}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {/* Statut implémentation */}
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Statut d'implémentation</p>
                                                                        <AppSelect
                                                                            value={entry.statut_implementation ?? ''}
                                                                            onChange={v => setSoaEntry(mesure.id, 'statut_implementation', v || null)}
                                                                            disabled={readOnly}
                                                                            placeholder="— Sélectionner —"
                                                                            options={Object.entries(STATUT_IMPL_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
                                                                        />
                                                                    </div>

                                                                    {/* Référence documentaire */}
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Référence documentaire</p>
                                                                        <input
                                                                            type="text"
                                                                            value={entry.reference_document ?? ''}
                                                                            onChange={e => setSoaEntry(mesure.id, 'reference_document', e.target.value || null)}
                                                                            readOnly={readOnly}
                                                                            placeholder="Ex : POL-SEC-001"
                                                                            className={`w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 ${readOnly ? 'bg-gray-50 text-gray-600 cursor-default' : ''}`}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Justification si non applicable */}
                                                        {isApplicable === false && (
                                                            <div className="mt-3 ml-28">
                                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Justification d'exclusion</p>
                                                                <textarea
                                                                    value={entry.justification_exclusion ?? ''}
                                                                    onChange={e => setSoaEntry(mesure.id, 'justification_exclusion', e.target.value || null)}
                                                                    readOnly={readOnly}
                                                                    placeholder="Expliquer pourquoi ce contrôle n'est pas applicable..."
                                                                    rows={2}
                                                                    className={`w-full text-xs border border-orange-200 rounded-xl px-2 py-1.5 bg-orange-50 focus:outline-none focus:ring-1 resize-none ${readOnly ? 'text-gray-600 cursor-default' : ''}`}
                                                                />
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
            {soaDirty && !readOnly && (
                <div className="sticky bottom-4 flex justify-end">
                    <button
                        onClick={onSave}
                        disabled={savingSoa}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl shadow-lg transition disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        {savingSoa ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                        Sauvegarder la Déclaration d'Applicabilité
                    </button>
                </div>
            )}
        </div>
    );
};

export default TabSoA;
