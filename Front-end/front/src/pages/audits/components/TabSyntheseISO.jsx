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
                {(() => {
                    const tColor = tauxGlobal >= 70 ? '#16a34a' : tauxGlobal >= 40 ? '#f97316' : '#dc2626';
                    return (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-4">
                                <p className="text-xs font-medium text-gray-400">Taux global</p>
                                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${tColor}15`, color: tColor }}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>
                                </div>
                            </div>
                            <p className="text-3xl font-bold tracking-tight" style={{ color: tColor }}>{tauxGlobal}%</p>
                        </div>
                    );
                })()}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-4">
                        <p className="text-xs font-medium text-gray-400">Conformes</p>
                        <div className="p-1.5 rounded-lg bg-green-50 text-green-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-green-600">{totConf}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-4">
                        <p className="text-xs font-medium text-gray-400">NC mineures</p>
                        <div className="p-1.5 rounded-lg bg-orange-50 text-orange-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-orange-600">{totMin}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-4">
                        <p className="text-xs font-medium text-gray-400">NC majeures</p>
                        <div className="p-1.5 rounded-lg bg-red-50 text-red-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-red-600">{totMaj}</p>
                </div>
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
