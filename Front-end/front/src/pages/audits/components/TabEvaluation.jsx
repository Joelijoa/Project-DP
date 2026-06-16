import { useRef } from 'react';
import { NIVEAUX } from './auditConstants';
import { stripNumericPrefix, stripObjectifPrefix, calcConformite } from './auditHelpers';
import { TabInfo, ConformiteBadge } from './AuditBadges';
import AppSelect from '../../../components/common/AppSelect';
import AppTooltip from '../../../components/common/AppTooltip';

const TabEvaluation = ({ referentiel, localEvals, setEval, openDomaines, setOpenDomaines, isDirty, saving, onSave, readOnly }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement du référentiel...</div>;

    const domaineRefs = useRef({});
    const toggleDomaine = (id) => {
        setOpenDomaines(prev => {
            const isNowOpen = !prev[id];
            if (isNowOpen) setTimeout(() => {
                const el = domaineRefs.current[id];
                if (el) el.style.scrollMarginTop = '120px';
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
            return { [id]: isNowOpen };
        });
    };

    return (
        <div className="space-y-3">
            <TabInfo text="L'objectif de cette feuille est d'évaluer le niveau de maturité atteint pour chacune des mesures de sécurité édictées par la DNSSI et ainsi en déduire le niveau de conformité. L'auteur de l'évaluation est invité à évaluer la mise en œuvre de chacune des règles selon l'échelle de maturité définie." />
            {/* Barre de sauvegarde */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
                <p className="text-sm text-gray-600">
                    <strong>2. Évaluation de la mise en œuvre des règles de la DNSSI</strong>
                    {isDirty && !readOnly && <span className="ml-2 text-xs text-orange-500">— modifications non sauvegardées</span>}
                </p>
                {!readOnly && (
                    <button
                        onClick={onSave}
                        disabled={saving || !isDirty}
                        className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white rounded-xl transition disabled:opacity-50"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                        Sauvegarder
                    </button>
                )}
            </div>

            {/* Légende niveaux */}
            <div className="flex flex-wrap gap-2 px-1">
                {NIVEAUX.map(n => (
                    <span key={String(n.value)} className={`text-xs font-medium ${n.color}`}>
                        {n.value === -2 ? 'N/A' : `${n.value} = ${n.label}`}
                    </span>
                ))}
            </div>

            {/* Domaines */}
            {referentiel.domaines?.map(domaine => {
                const mesures = domaine.objectifs?.flatMap(o => o.mesures) || [];
                const evCount = mesures.filter(m => { const n = localEvals[m.id]?.niveau_maturite; return n !== null && n !== undefined; }).length;
                const isDomainNA = mesures.length > 0 && mesures.every(m => localEvals[m.id]?.niveau_maturite === -1);
                const hasStartedEval = mesures.some(m => { const n = localEvals[m.id]?.niveau_maturite; return n !== null && n !== undefined && n !== -1; });
                const isOpen = openDomaines[domaine.id];

                return (
                    <div key={domaine.id} ref={el => domaineRefs.current[domaine.id] = el} className={`bg-white rounded-2xl overflow-hidden shadow-sm ${isDomainNA ? 'border border-gray-200 opacity-70' : 'border border-gray-100'}`}>
                        {/* En-tête domaine */}
                        <div
                            onClick={() => toggleDomaine(domaine.id)}
                            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50/60 transition cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: isDomainNA ? '#9ca3af' : 'var(--brand-red)' }}>
                                    {domaine.code}
                                </span>
                                <span className={`text-sm font-semibold ${isDomainNA ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{stripNumericPrefix(domaine.nom)}</span>
                                {isDomainNA && <span className="text-xs text-gray-400 italic">(non applicable)</span>}
                            </div>
                            <div className="flex items-center gap-3">
                                {!readOnly && (!hasStartedEval || isDomainNA) && (
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            const newValue = isDomainNA ? null : -1;
                                            mesures.forEach(m => setEval(m.id, 'niveau_maturite', newValue));
                                            if (newValue === -1) setOpenDomaines(prev => ({ ...prev, [domaine.id]: true }));
                                        }}
                                        className={`text-xs px-2.5 py-1 rounded-xl font-medium transition border ${isDomainNA
                                            ? 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
                                            : 'border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                            }`}
                                    >
                                        {isDomainNA ? '↩ Réactiver' : 'Non applicable'}
                                    </button>
                                )}
                                {!isDomainNA && <span className="text-xs text-gray-500">{evCount}/{mesures.length} évaluées</span>}
                                {!isDomainNA && (
                                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${mesures.length > 0 ? (evCount / mesures.length) * 100 : 0}%`, backgroundColor: 'var(--brand-red)' }} />
                                    </div>
                                )}
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </div>

                        {isOpen && (
                            <div className="border-t border-gray-100">
                                {isDomainNA ? (
                                    <div className="px-5 py-4 space-y-3 bg-gray-50">
                                        <div className="flex items-center gap-2.5 text-sm text-gray-500">
                                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                            Ce domaine a été marqué comme <strong className="font-semibold">non applicable</strong> à l'organisation auditée.
                                            {!readOnly && (
                                                <button
                                                    onClick={() => mesures.forEach(m => setEval(m.id, 'niveau_maturite', null))}
                                                    className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline"
                                                >
                                                    Annuler
                                                </button>
                                            )}
                                        </div>
                                        <div className="ml-6">
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Raison de non-applicabilité</label>
                                            <textarea
                                                value={localEvals[mesures[0]?.id]?.preuve || ''}
                                                onChange={e => {
                                                    if (readOnly) return;
                                                    const val = e.target.value;
                                                    mesures.forEach(m => setEval(m.id, 'preuve', val));
                                                }}
                                                readOnly={readOnly}
                                                rows={2}
                                                placeholder={readOnly ? '—' : 'Justifier pourquoi ce domaine n\'est pas applicable à l\'organisation auditée…'}
                                                className="w-full text-xs border border-orange-200 bg-orange-50/60 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-300 read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed resize-y"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>{domaine.objectifs?.map(objectif => {
                                        const objDesc = stripObjectifPrefix(objectif.description || '');
                                        return (
                                            <div key={objectif.id} className="border-b border-gray-50 last:border-0">
                                                {/* En-tête objectif */}
                                                <div className="px-5 py-2.5 bg-gray-50/60">
                                                    <p className="text-xs font-semibold text-gray-600">{objDesc}</p>
                                                </div>

                                                {/* Table des mesures */}
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b border-gray-100">
                                                            <th className="text-left px-5 py-2 font-semibold text-gray-400 uppercase tracking-wider w-28">Règle</th>
                                                            <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider w-44">Niveau maturité</th>
                                                            <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider w-28">Conformité</th>
                                                            <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider w-36">Preuves / Raison N/A</th>
                                                            <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider">Note</th>
                                                            <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider">Constat</th>
                                                            <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider">Recommandation</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {objectif.mesures?.map(mesure => {
                                                            const ev = localEvals[mesure.id] || {};
                                                            const niveau = ev.niveau_maturite ?? null;
                                                            const conformite = calcConformite(niveau);
                                                            const isNA = niveau === -2;

                                                            return (
                                                                <tr key={mesure.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                                                                    <td className="px-5 py-2">
                                                                        <AppTooltip code={mesure.code} description={mesure.description} />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <AppSelect
                                                                            value={niveau === null || niveau === undefined ? '' : niveau === -2 ? 'na' : String(niveau)}
                                                                            onChange={v => {
                                                                                if (readOnly) return;
                                                                                setEval(mesure.id, 'niveau_maturite', v === '' ? null : v === 'na' ? -2 : parseInt(v));
                                                                            }}
                                                                            locked={readOnly}
                                                                            size="sm"
                                                                            options={[
                                                                                { value: '', label: '— Sélectionner —' },
                                                                                { value: 'na', label: 'N/A' },
                                                                                { value: '0', label: '0 — Aucun' },
                                                                                { value: '1', label: '1 — Initial' },
                                                                                { value: '2', label: '2 — Reproductible' },
                                                                                { value: '3', label: '3 — Défini' },
                                                                                { value: '4', label: '4 — Maitrisé' },
                                                                                { value: '5', label: '5 — Optimisé' },
                                                                            ]}
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <ConformiteBadge conformite={conformite} />
                                                                    </td>
                                                                    <td className="px-3 py-2 w-36">
                                                                        <input
                                                                            type="text"
                                                                            value={ev.preuve || ''}
                                                                            onChange={e => !readOnly && setEval(mesure.id, 'preuve', e.target.value)}
                                                                            readOnly={readOnly}
                                                                            placeholder={readOnly ? '—' : isNA ? 'Justifier la N/A...' : 'Références...'}
                                                                            className={`w-full text-xs border rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 read-only:cursor-not-allowed ${isNA && !readOnly
                                                                                ? 'border-orange-200 bg-orange-50 read-only:bg-orange-50'
                                                                                : 'border-gray-200 read-only:bg-white read-only:text-gray-700'
                                                                                }`}
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <textarea
                                                                            value={ev.note || ''}
                                                                            onChange={e => !readOnly && setEval(mesure.id, 'note', e.target.value)}
                                                                            readOnly={readOnly}
                                                                            rows={6}
                                                                            placeholder={readOnly ? '—' : 'Note...'}
                                                                            className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed resize-y min-h-[120px]"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <textarea
                                                                            value={ev.commentaire || ''}
                                                                            onChange={e => !readOnly && setEval(mesure.id, 'commentaire', e.target.value)}
                                                                            readOnly={readOnly}
                                                                            rows={6}
                                                                            placeholder={readOnly ? '—' : 'Constat...'}
                                                                            className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed resize-y min-h-[120px]"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <textarea
                                                                            value={ev.recommandation || ''}
                                                                            onChange={e => !readOnly && setEval(mesure.id, 'recommandation', e.target.value)}
                                                                            readOnly={readOnly}
                                                                            rows={6}
                                                                            placeholder={readOnly ? '—' : 'Recommandation...'}
                                                                            className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 read-only:bg-white read-only:text-gray-700 read-only:cursor-not-allowed resize-y min-h-[120px]"
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })}</>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Bouton flottant sauvegarde */}
            {isDirty && (
                <div className="sticky bottom-4 flex justify-end">
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl shadow-lg transition disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                        Sauvegarder les évaluations
                    </button>
                </div>
            )}
        </div>
    );
};

export default TabEvaluation;
