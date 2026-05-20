import React from 'react';
import { NIVEAUX } from './auditConstants';
import { isoConformite, niveauLabel } from './auditHelpers';
import { TabInfo, ConformiteBadge } from './AuditBadges';

const TabAvancement = ({ referentiel, localEvals, synthese }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement...</div>;

    return (
        <div className="space-y-4">
            <TabInfo text="Cette feuille a pour but de renseigner les actions déjà entreprises ainsi que les actions qui seront implémentées pour la mise en conformité de l'entité ou de l'IIV avec la DNSSI. Cet aperçu sur l'état d'avancement tient en compte les mesures à court terme et les mesures atteignables à moyen terme." />
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-2">5. État d'avancement</h2>
                <p className="text-xs text-gray-400 mb-5">Vue détaillée de l'avancement par domaine et par règle</p>

                {/* Barres de progression par domaine */}
                <div className="space-y-3 mb-6">
                    {synthese.map(d => (
                        <div key={d.id} className="flex items-center gap-4">
                            <div className="w-48 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{d.code}</span>
                                    <span className="text-xs text-gray-600 truncate">{d.nom}</span>
                                </div>
                            </div>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${d.progress}%`, backgroundColor: d.progress === 100 ? '#16a34a' : 'var(--brand-red)' }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 w-12 text-right">{d.progress}%</span>
                            <span className="text-xs text-gray-400 w-16 text-right">{d.evaluated}/{d.total}</span>
                        </div>
                    ))}
                </div>

                {/* Tableau détail — 1 objectif → N règles */}
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80">
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100 w-72">Objectif</th>
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100 w-24">Règle</th>
                                <th className="text-center px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100 w-32">Conformité</th>
                                <th className="text-center px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100 w-32">Maturité</th>
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100">Constat</th>
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Recommandation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referentiel.domaines?.map(domaine => (
                                <React.Fragment key={domaine.id}>
                                    {/* Ligne d'en-tête domaine */}
                                    <tr className="bg-gray-100/70">
                                        <td colSpan={6} className="px-4 py-2 border-b border-gray-200">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>
                                                    {domaine.code}
                                                </span>
                                                <span className="font-semibold text-gray-700 text-xs">{domaine.nom}</span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Lignes par objectif avec rowspan */}
                                    {domaine.objectifs?.map(obj => {
                                        const mesures = obj.mesures || [];
                                        return mesures.map((mesure, idx) => {
                                            const ev = localEvals[mesure.id] || {};
                                            const niveau = ev.niveau_maturite ?? null;
                                            const conformite = isoConformite(niveau);
                                            return (
                                                <tr key={mesure.id} className="hover:bg-blue-50/20 border-b border-gray-50">
                                                    {/* Cellule fusionnée objectif — seulement sur la 1re ligne */}
                                                    {idx === 0 && (
                                                        <td
                                                            rowSpan={mesures.length}
                                                            className="px-4 py-3 border-r border-gray-100 align-top"
                                                            style={{ verticalAlign: 'top' }}
                                                        >
                                                            <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide mb-1">{obj.code}</p>
                                                            <p className="text-gray-700 leading-relaxed">{obj.description}</p>
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-2.5 border-r border-gray-100">
                                                        <span className="font-mono text-gray-500">{mesure.code}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center border-r border-gray-100">
                                                        <ConformiteBadge conformite={conformite} />
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center border-r border-gray-100">
                                                        <span className={`font-semibold ${NIVEAUX.find(n => n.value === niveau)?.color ?? 'text-gray-400'}`}>
                                                            {niveauLabel(niveau)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-500 border-r border-gray-100">{ev.commentaire || <span className="text-gray-300">—</span>}</td>
                                                    <td className="px-4 py-2.5 text-gray-500">{ev.recommandation || <span className="text-gray-300">—</span>}</td>
                                                </tr>
                                            );
                                        });
                                    })}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TabAvancement;
