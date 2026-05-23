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

const KpiPanel = ({ label, subtitle, taux, conforme, ncMineure, ncMajeure, evaluated, total }) => {
    const tColor = taux >= 75 ? '#16a34a' : taux >= 50 ? '#f97316' : '#dc2626';
    const barW   = `${taux}%`;
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
                <span className="text-2xl font-bold tracking-tight" style={{ color: tColor }}>{taux}%</span>
            </div>

            {/* Barre de progression */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: barW, backgroundColor: tColor }} />
            </div>

            {/* Compteurs */}
            <div className="grid grid-cols-3 divide-x divide-gray-100">
                <div className="flex flex-col items-center gap-1 pr-4">
                    <span className="text-lg font-bold text-green-600">{conforme}</span>
                    <span className="text-xs text-gray-400">Conformes</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-4">
                    <span className="text-lg font-bold text-orange-500">{ncMineure}</span>
                    <span className="text-xs text-gray-400">NC mineures</span>
                </div>
                <div className="flex flex-col items-center gap-1 pl-4">
                    <span className="text-lg font-bold text-red-600">{ncMajeure}</span>
                    <span className="text-xs text-gray-400">NC majeures</span>
                </div>
            </div>

            {/* Progression évaluation */}
            <p className="text-xs text-gray-400 text-right">{evaluated} / {total} évaluées</p>
        </div>
    );
};

const computeRows = (domaines, localEvals) =>
    domaines.map(d => {
        const mesures = d.objectifs.flatMap(o => o.mesures);
        // Exclure les mesures N/A (niveau -2) du total effectif
        const actives = mesures.filter(m => localEvals[m.id]?.niveau_maturite !== -2);
        const conforme  = actives.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
        const ncMineure = actives.filter(m => localEvals[m.id]?.niveau_maturite === 2).length;
        const ncMajeure = actives.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
        const evaluated = conforme + ncMineure + ncMajeure;
        const taux = evaluated > 0 ? Math.round(((conforme + ncMineure * 0.5) / evaluated) * 100) : 0;
        return { ...d, total: actives.length, evaluated, conforme, ncMineure, ncMajeure, taux };
    });

const sumKpis = rows => {
    const conf   = rows.reduce((s, t) => s + t.conforme,  0);
    const min    = rows.reduce((s, t) => s + t.ncMineure, 0);
    const maj    = rows.reduce((s, t) => s + t.ncMajeure, 0);
    const eval_  = rows.reduce((s, t) => s + t.evaluated, 0);
    const total  = rows.reduce((s, t) => s + t.total,     0);
    const taux   = eval_ > 0 ? Math.round(((conf + min * 0.5) / eval_) * 100) : 0;
    return { conforme: conf, ncMineure: min, ncMajeure: maj, evaluated: eval_, total, taux };
};

const TabSyntheseISO = ({ referentiel, localEvals }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement...</div>;

    const mainBodyDomaines = referentiel.domaines.filter(d => !d.code.startsWith('A.'));
    const annexeDomaines   = referentiel.domaines.filter(d =>  d.code.startsWith('A.'));

    const smsiRows   = computeRows(mainBodyDomaines, localEvals);
    const annexeRows = computeRows(annexeDomaines,   localEvals);

    const smsiKpis   = sumKpis(smsiRows);
    const annexeKpis = sumKpis(annexeRows);

    return (
        <div className="space-y-4">
            <TabInfo text="Synthèse globale de la conformité ISO 27001:2022 — exigences du corps principal (§4-10) et contrôles de l'Annexe A." />

            {/* KPIs côte à côte */}
            <div className="grid grid-cols-2 gap-4">
                <KpiPanel
                    label="SMSI — Corps principal"
                    subtitle="Exigences §4 à §10"
                    {...smsiKpis}
                />
                <KpiPanel
                    label="Annexe A — Contrôles"
                    subtitle="Chapitres A.5 à A.8"
                    {...annexeKpis}
                />
            </div>

            {/* Table §4-10 */}
            {smsiRows.length > 0 ? (
                <SyntheseTable rows={smsiRows} caption="Exigences SMSI — Corps principal §4-10" />
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Exigences SMSI — Corps principal §4-10</p>
                    <p className="text-xs text-gray-400">Non disponible — lancez le seed ISO 27001:2022 pour ajouter les exigences §4-10.</p>
                </div>
            )}

            {/* Table Annexe A — tous les chapitres (A.5→A.8) */}
            {annexeRows.length > 0 ? (
                <SyntheseTable rows={annexeRows} caption="Annexe A — Contrôles (A.5 à A.8)" />
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Annexe A — Contrôles</p>
                    <p className="text-xs text-gray-400">Aucun contrôle Annexe A disponible dans ce référentiel.</p>
                </div>
            )}
        </div>
    );
};

export { SyntheseTable };
export default TabSyntheseISO;
