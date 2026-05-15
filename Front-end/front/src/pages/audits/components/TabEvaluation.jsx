import { NIVEAUX } from './auditConstants';
import { stripNumericPrefix, stripObjectifPrefix, calcConformite } from './auditHelpers';
import { TabInfo, ConformiteBadge } from './AuditBadges';

const TabEvaluation = ({ referentiel, localEvals, setEval, openDomaines, setOpenDomaines, isDirty, saving, onSave, readOnly }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement du référentiel...</div>;

    const toggleDomaine = (id) => setOpenDomaines(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="space-y-3">
            <TabInfo text="L'objectif de cette feuille est d'évaluer le niveau de maturité atteint pour chacune des mesures de sécurité édictées par la DNSSI et ainsi en déduire le niveau de conformité. L'auteur de l'évaluation est invité à évaluer la mise en œuvre de chacune des règles selon l'échelle de maturité définie." />
            {/* Barre de sauvegarde */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3">
                <p className="text-sm text-gray-600">
                    <strong>2. Évaluation de la mise en œuvre des règles de la DNSSI</strong>
                    {isDirty && !readOnly && <span className="ml-2 text-xs text-orange-500">— modifications non sauvegardées</span>}
                </p>
                {!readOnly && (
                    <button
                        onClick={onSave}
                        disabled={saving || !isDirty}
                        className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white rounded-lg transition disabled:opacity-50"
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
                        {n.value === null ? 'N/A' : `${n.value} = ${n.label}`}
                    </span>
                ))}
            </div>

            {/* Domaines */}
            {referentiel.domaines?.map(domaine => {
                const mesures = domaine.objectifs?.flatMap(o => o.mesures) || [];
                const evCount = mesures.filter(m => localEvals[m.id] !== undefined).length;
                const isDomainNA = mesures.length > 0 && mesures.every(m => localEvals[m.id]?.niveau_maturite === -1);
                const hasStartedEval = mesures.some(m => { const n = localEvals[m.id]?.niveau_maturite; return n !== null && n !== undefined && n !== -1; });
                const isOpen = openDomaines[domaine.id];

                return (
                    <div key={domaine.id} className={`bg-white rounded-xl border overflow-hidden ${isDomainNA ? 'border-gray-300 opacity-70' : 'border-gray-200'}`}>
                        {/* En-tête domaine */}
                        <button
                            onClick={() => toggleDomaine(domaine.id)}
                            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50/60 transition"
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
                                        }}
                                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition border ${isDomainNA
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
                        </button>

                        {isOpen && (
                            <div className="border-t border-gray-100">
                                {isDomainNA ? (
                                    <div className="px-5 py-4 flex items-center gap-2.5 text-sm text-gray-500 bg-gray-50">
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
                                ) : (
                                    <>{domaine.objectifs?.map(objectif => {
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

                                                {/* Table des mesures */}
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b border-gray-100">
                                                            <th className="text-left px-5 py-2 font-semibold text-gray-400 uppercase tracking-wider w-28">Règle</th>
                                                            <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider w-44">Niveau maturité</th>
                                                            <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider w-28">Conformité</th>
                                                            <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider w-44">Constat</th>
                                                            <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider w-44">Recommandation</th>
                                                            <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider">Preuves / Références</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {objectif.mesures?.map(mesure => {
                                                            const ev = localEvals[mesure.id] || {};
                                                            const niveau = ev.niveau_maturite ?? null;
                                                            const conformite = calcConformite(niveau);
                                                            const isNA = niveau === null;

                                                            return (
                                                                <tr key={mesure.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                                                                    <td className="px-5 py-2">
                                                                        <div className="relative group inline-flex items-center gap-1">
                                                                            <span className="font-mono text-gray-500 cursor-help underline decoration-dotted decoration-gray-400">
                                                                                {mesure.code}
                                                                            </span>
                                                                            <div className="absolute z-50 left-0 bottom-full mb-2 w-80 p-3 bg-gray-900 text-white rounded-lg shadow-2xl hidden group-hover:block pointer-events-none">
                                                                                <p className="font-semibold text-gray-100 mb-1.5">{mesure.code?.trim()}</p>
                                                                                {mesure.description && <p className="text-gray-300 leading-relaxed text-[11px]">{mesure.description}</p>}
                                                                                <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <select
                                                                            value={niveau === null ? 'na' : String(niveau)}
                                                                            onChange={e => {
                                                                                if (readOnly) return;
                                                                                const v = e.target.value === 'na' ? null : parseInt(e.target.value);
                                                                                setEval(mesure.id, 'niveau_maturite', v);
                                                                            }}
                                                                            disabled={readOnly}
                                                                            className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-default"
                                                                            style={{ '--tw-ring-color': 'var(--brand-red)' }}
                                                                        >
                                                                            <option value="na">N/A</option>
                                                                            <option value="0">0 — Aucun</option>
                                                                            <option value="1">1 — Initial</option>
                                                                            <option value="2">2 — Reproductible</option>
                                                                            <option value="3">3 — Défini</option>
                                                                            <option value="4">4 — Maitrisé</option>
                                                                            <option value="5">5 — Optimisé</option>
                                                                        </select>
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <ConformiteBadge conformite={conformite} />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <textarea
                                                                            value={ev.commentaire || ''}
                                                                            onChange={e => !readOnly && setEval(mesure.id, 'commentaire', e.target.value)}
                                                                            readOnly={readOnly}
                                                                            rows={2}
                                                                            placeholder={readOnly ? '—' : 'Constat...'}
                                                                            className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 read-only:bg-gray-50 read-only:text-gray-600 read-only:cursor-default resize-none"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <textarea
                                                                            value={ev.recommandation || ''}
                                                                            onChange={e => !readOnly && setEval(mesure.id, 'recommandation', e.target.value)}
                                                                            readOnly={readOnly}
                                                                            rows={2}
                                                                            placeholder={readOnly ? '—' : 'Recommandation...'}
                                                                            className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 read-only:bg-gray-50 read-only:text-gray-600 read-only:cursor-default resize-none"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="text"
                                                                            value={ev.preuve || ''}
                                                                            onChange={e => !readOnly && setEval(mesure.id, 'preuve', e.target.value)}
                                                                            readOnly={readOnly}
                                                                            placeholder={readOnly ? '—' : isNA ? 'Justifier la non-applicabilité...' : 'Références / preuves...'}
                                                                            className={`w-full text-xs border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 read-only:cursor-default ${isNA && !readOnly
                                                                                ? 'border-orange-200 bg-orange-50 read-only:bg-gray-50'
                                                                                : 'border-gray-200 read-only:bg-gray-50 read-only:text-gray-600'
                                                                                }`}
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
