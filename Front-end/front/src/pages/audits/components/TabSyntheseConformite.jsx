import { TabInfo } from './AuditBadges';

const TabSyntheseConformite = ({ synthese, totalConforme, totalPartiel, totalNC, totalNA, tauxGlobal }) => (
    <div className="space-y-4">
        <TabInfo text="Cette feuille a pour but de donner une synthèse du niveau de conformité du SI par rapport aux règles de la DNSSI selon les valeurs renseignées par l'entité ou de l'IIV. La conformité est déduite du niveau de maturité : niveaux 0-1 → Non conforme, 2-3 → Partielle, 4-5 → Totale." />
        {/* KPIs */}
        <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-medium text-gray-400">Conforme (Totale)</p>
                    <div className="p-1.5 rounded-lg bg-green-50 text-green-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>
                <p className="text-3xl font-bold tracking-tight text-green-600">{totalConforme}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-medium text-gray-400">Partielle</p>
                    <div className="p-1.5 rounded-lg bg-yellow-50 text-yellow-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    </div>
                </div>
                <p className="text-3xl font-bold tracking-tight text-yellow-600">{totalPartiel}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-medium text-gray-400">Non conforme</p>
                    <div className="p-1.5 rounded-lg bg-red-50 text-red-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>
                <p className="text-3xl font-bold tracking-tight text-red-600">{totalNC}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-medium text-gray-400">Non applicable</p>
                    <div className="p-1.5 rounded-lg bg-gray-100 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    </div>
                </div>
                <p className="text-3xl font-bold tracking-tight text-gray-400">{totalNA ?? 0}</p>
            </div>
            {(() => {
                const color = tauxGlobal >= 70 ? '#16a34a' : tauxGlobal >= 40 ? '#f97316' : '#dc2626';
                return (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-4">
                            <p className="text-xs font-medium text-gray-400">Taux global</p>
                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>
                            </div>
                        </div>
                        <p className="text-3xl font-bold tracking-tight" style={{ color }}>{tauxGlobal}%</p>
                    </div>
                );
            })()}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-5">4. Synthèse du niveau de conformité par domaine</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Domaine</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-green-600 uppercase tracking-wider">Totale</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-yellow-600 uppercase tracking-wider">Partielle</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-red-600 uppercase tracking-wider">Non conforme</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">N/A</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Taux (%)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {synthese.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50/40">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{d.code}</span>
                                        <span className="text-gray-700 text-xs font-medium">{d.nom}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-green-700 font-semibold">{d.conforme}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-yellow-700 font-semibold">{d.partiel}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-red-700 font-semibold">{d.non_conforme}</span>
                                </td>
                                <td className="px-4 py-3 text-center text-gray-400">{d.na}</td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${d.tauxConformite}%`, backgroundColor: d.tauxConformite >= 75 ? '#16a34a' : d.tauxConformite >= 50 ? '#ca8a04' : '#dc2626' }} />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-700">{d.tauxConformite}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

export default TabSyntheseConformite;
