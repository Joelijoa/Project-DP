import { TabInfo } from './AuditBadges';

const TabSyntheseConformite = ({ synthese, totalConforme, totalPartiel, totalNC, tauxGlobal }) => (
    <div className="space-y-4">
        <TabInfo text="Cette feuille a pour but de donner une synthèse du niveau de conformité du SI par rapport aux règles de la DNSSI selon les valeurs renseignées par l'entité ou de l'IIV. La conformité est déduite du niveau de maturité : niveaux 0-1 → Non conforme, 2-3 → Partielle, 4-5 → Totale." />
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
            {[
                { label: 'Conforme (Totale)', value: totalConforme, color: '#16a34a', bg: '#f0fdf4' },
                { label: 'Partielle', value: totalPartiel, color: '#ca8a04', bg: '#fefce8' },
                { label: 'Non conforme', value: totalNC, color: '#dc2626', bg: '#fef2f2' },
                { label: 'Taux global', value: `${tauxGlobal}%`, color: 'var(--brand-red)', bg: 'var(--brand-red-light)', accent: true },
            ].map((k, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4" style={k.accent ? { borderTopWidth: '3px', borderTopColor: k.color } : {}}>
                    <p className="text-xs font-medium text-gray-500">{k.label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
                </div>
            ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
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
