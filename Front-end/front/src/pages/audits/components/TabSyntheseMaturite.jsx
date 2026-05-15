import { TabInfo } from './AuditBadges';

const TabSyntheseMaturite = ({ synthese }) => (
    <div className="space-y-4">
        <TabInfo text="Cette feuille a pour but de donner une synthèse du niveau de maturité selon les valeurs renseignées par l'entité ou de l'IIV. Elle permet de visualiser l'état de mise en œuvre des règles de la DNSSI par niveau de maturité et d'identifier les axes d'amélioration prioritaires." />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-5">3. Synthèse du niveau de maturité par domaine</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Domaine</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mesures</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Évaluées</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score moyen</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progression</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {synthese.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50/40">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{d.code}</span>
                                        <span className="text-gray-700 font-medium text-xs">{d.nom}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center text-gray-600">{d.total}</td>
                                <td className="px-4 py-3 text-center text-gray-600">{d.evaluated}</td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`text-lg font-bold ${d.avgScore >= 4 ? 'text-green-600' : d.avgScore >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                                            {d.evaluated > 0 ? d.avgScore.toFixed(1) : '—'}
                                        </span>
                                        {d.evaluated > 0 && <span className="text-xs text-gray-400">/ 5</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${d.total > 0 ? (d.avgScore / 5) * 100 : 0}%`,
                                                    backgroundColor: d.avgScore >= 4 ? '#16a34a' : d.avgScore >= 2 ? '#ca8a04' : '#dc2626',
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-400 w-8">{d.total > 0 ? Math.round((d.avgScore / 5) * 100) : 0}%</span>
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

export default TabSyntheseMaturite;
