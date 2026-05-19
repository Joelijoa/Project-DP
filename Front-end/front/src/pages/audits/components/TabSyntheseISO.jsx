import { TabInfo } from './AuditBadges';

const SyntheseTable = ({ rows, caption }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-5">{caption}</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Évaluées</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-green-600">Conformes</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-orange-600">NC mineures</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-red-600">NC majeures</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Taux (%)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {rows.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50/40">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{t.code}</span>
                                    <span className="text-xs font-medium text-gray-700">{t.nom}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600 text-xs">{t.evaluated}/{t.total}</td>
                            <td className="px-4 py-3 text-center text-green-700 font-semibold text-xs">{t.conforme}</td>
                            <td className="px-4 py-3 text-center text-orange-600 font-semibold text-xs">{t.ncMineure}</td>
                            <td className="px-4 py-3 text-center text-red-700 font-semibold text-xs">{t.ncMajeure}</td>
                            <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${t.taux}%`, backgroundColor: t.taux >= 75 ? '#16a34a' : t.taux >= 50 ? '#d97706' : '#dc2626' }} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">{t.taux}%</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const TabSyntheseISO = ({ referentiel, soaMap, localEvals }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement...</div>;

    const mainBodyDomaines = referentiel.domaines.filter(d => !d.code.startsWith('A.'));
    const annexeDomaines = referentiel.domaines.filter(d => d.code.startsWith('A.'));

    // §4-10 : toutes les mesures (pas de SoA)
    const smsiRows = mainBodyDomaines.map(d => {
        const mesures = d.objectifs.flatMap(o => o.mesures);
        const conforme = mesures.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
        const ncMineure = mesures.filter(m => localEvals[m.id]?.niveau_maturite === 2).length;
        const ncMajeure = mesures.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
        const evaluated = conforme + ncMineure + ncMajeure;
        const taux = evaluated > 0 ? Math.round(((conforme + ncMineure * 0.5) / evaluated) * 100) : 0;
        return { ...d, total: mesures.length, evaluated, conforme, ncMineure, ncMajeure, taux };
    });

    // Annexe A : filtrée par SoA
    const annexeRows = annexeDomaines.map(d => {
        const mesures = d.objectifs.flatMap(o => o.mesures).filter(m => soaMap[m.id]?.applicable === true);
        const conforme = mesures.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
        const ncMineure = mesures.filter(m => localEvals[m.id]?.niveau_maturite === 2).length;
        const ncMajeure = mesures.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
        const evaluated = conforme + ncMineure + ncMajeure;
        const taux = evaluated > 0 ? Math.round(((conforme + ncMineure * 0.5) / evaluated) * 100) : 0;
        return { ...d, total: mesures.length, evaluated, conforme, ncMineure, ncMajeure, taux };
    });

    const allRows = [...smsiRows, ...annexeRows];
    const totConf = allRows.reduce((s, t) => s + t.conforme, 0);
    const totMin = allRows.reduce((s, t) => s + t.ncMineure, 0);
    const totMaj = allRows.reduce((s, t) => s + t.ncMajeure, 0);
    const totEval = allRows.reduce((s, t) => s + t.evaluated, 0);
    const tauxGlobal = totEval > 0 ? Math.round(((totConf + totMin * 0.5) / totEval) * 100) : 0;

    const hasAnySoA = annexeRows.some(t => t.total > 0);

    return (
        <div className="space-y-4">
            <TabInfo text="Synthèse globale de la conformité ISO 27001:2022 — exigences du corps principal (§4-10) et contrôles de l'Annexe A (SoA)." />

            {/* KPIs globaux */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Taux global', value: `${tauxGlobal}%`, color: tauxGlobal >= 75 ? '#16a34a' : tauxGlobal >= 50 ? '#d97706' : '#dc2626', accent: true },
                    { label: 'Conformes', value: totConf, color: '#16a34a' },
                    { label: 'NC mineures', value: totMin, color: '#ea580c' },
                    { label: 'NC majeures', value: totMaj, color: '#dc2626' },
                ].map((k, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4" style={k.accent ? { borderTopWidth: '3px', borderTopColor: k.color } : {}}>
                        <p className="text-xs font-medium text-gray-500">{k.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* §4-10 */}
            {smsiRows.length > 0 && (
                <SyntheseTable rows={smsiRows} caption="Exigences SMSI — Corps principal §4-10 (toutes applicables)" />
            )}
            {smsiRows.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Exigences SMSI — Corps principal §4-10</p>
                    <p className="text-xs text-gray-400">Non disponible — lancez le seed ISO 27001:2022 pour ajouter les exigences §4-10.</p>
                </div>
            )}

            {/* Annexe A */}
            {hasAnySoA ? (
                <SyntheseTable rows={annexeRows.filter(t => t.total > 0)} caption="Annexe A — Contrôles applicables (SoA)" />
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Annexe A — Contrôles</p>
                    <p className="text-xs text-gray-400">Complétez la Déclaration d'Applicabilité pour voir la synthèse Annexe A.</p>
                </div>
            )}
        </div>
    );
};

export { SyntheseTable };
export default TabSyntheseISO;
