import { useState, useEffect } from 'react';
import { getAllAudits, getAuditById, getEvaluations } from '../../services/endpoints/auditService';
import { getReferentielById } from '../../services/endpoints/referentielService';
import { useAuth } from '../../store/auth/AuthContext';
import { sortRef, buildSynthese, scoreColor, scoreLabel, stripPrefix } from './components/resultatsHelpers';
import RadarChart from './components/RadarChart';
import DonutConformite from './components/DonutConformite';
import BarresEmpilees from './components/BarresEmpilees';
import JaugeScore from './components/JaugeScore';
import ResultatsEmptyState from './components/ResultatsEmptyState';

const ResultatsPage = () => {
    const { user } = useAuth();
    const [audits, setAudits]           = useState([]);
    const [selectedId, setSelectedId]   = useState('');
    const [audit, setAudit]             = useState(null);
    const [referentiel, setReferentiel] = useState(null);
    const [synthese, setSynthese]       = useState([]);
    const [loading, setLoading]         = useState(false);
    const [loadingList, setLoadingList] = useState(true);

    useEffect(() => {
        getAllAudits()
            .then(res => {
                let data = Array.isArray(res.data) ? res.data : (res.data.audits || []);
                if (user?.role === 'auditeur_junior') {
                    data = data.filter(a =>
                        a.auditeurs?.some(au => au.id === user.id) ||
                        a.createur?.id === user.id
                    );
                }
                setAudits(data);
            })
            .catch(() => {})
            .finally(() => setLoadingList(false));
    }, [user]);

    useEffect(() => {
        if (!selectedId) { setAudit(null); setReferentiel(null); setSynthese([]); return; }
        setLoading(true);
        (async () => {
            try {
                const [auditRes, evalsRes] = await Promise.all([
                    getAuditById(selectedId),
                    getEvaluations(selectedId),
                ]);
                const auditData = auditRes.data.audit || auditRes.data;
                const evalsArr  = evalsRes.data.evaluations || evalsRes.data || [];
                const refRes    = await getReferentielById(auditData.referentiel_id);
                const ref       = sortRef(refRes.data.referentiel || refRes.data);
                const evMap     = {};
                evalsArr.forEach(e => { evMap[e.mesure_id] = e; });
                setAudit(auditData);
                setReferentiel(ref);
                setSynthese(buildSynthese(ref, evMap));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [selectedId]);

    const globalScore    = synthese.length > 0 ? synthese.reduce((s, d) => s + d.avgScore, 0) / synthese.length : 0;
    const totalMesures   = synthese.reduce((s, d) => s + d.total, 0);
    const totalEvaluated = synthese.reduce((s, d) => s + d.evaluatedCount, 0);
    const totalConforme  = synthese.reduce((s, d) => s + d.conforme, 0);
    const totalPartiel   = synthese.reduce((s, d) => s + d.partiel, 0);
    const totalNC        = synthese.reduce((s, d) => s + d.non_conforme, 0);
    const totalNA        = synthese.reduce((s, d) => s + d.na, 0);
    const tauxGlobal     = synthese.length > 0
        ? Math.round(synthese.reduce((s, d) => s + d.tauxConformite, 0) / synthese.length)
        : 0;
    const isISO = audit?.referentiel?.type === 'ISO27001' || referentiel?.type === 'ISO27001';

    return (
        <div className="space-y-5">

            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Graphiques & Rosace</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Visualisation des résultats d'audit par domaine</p>
                </div>
                <div className="flex items-center gap-3">
                    {audit && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isISO ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                            {isISO ? 'ISO 27001' : 'DNSSI'}
                        </span>
                    )}
                    <select
                        value={selectedId}
                        onChange={e => setSelectedId(e.target.value)}
                        disabled={loadingList}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': 'var(--brand-red)', color: '#111827', minWidth: 240 }}
                    >
                        <option value="">— Sélectionner un audit —</option>
                        {audits.map(a => (
                            <option key={a.id} value={a.id}>{a.nom}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── État vide ── */}
            {!selectedId && !loadingList && (
                <ResultatsEmptyState audits={audits} loadingList={loadingList} />
            )}

            {/* ── Loading ── */}
            {loading && (
                <div className="bg-white rounded-xl border border-gray-200 p-16 flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Chargement des résultats…</span>
                </div>
            )}

            {/* ── Aucune évaluation ── */}
            {!loading && selectedId && synthese.length > 0 && synthese.every(d => d.evaluatedCount === 0) && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">Aucune évaluation enregistrée pour cet audit</p>
                    <p className="text-xs text-gray-400">Complétez l'onglet Évaluation dans le détail de l'audit.</p>
                </div>
            )}

            {/* ── Contenu principal ── */}
            {!loading && synthese.length > 0 && synthese.some(d => d.evaluatedCount > 0) && (
                <>
                    {/* KPI cards */}
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label: 'Score global',        value: globalScore.toFixed(1), sub: `/ 5 — ${scoreLabel(globalScore)}`, color: scoreColor(globalScore) },
                            { label: 'Taux de conformité',  value: `${tauxGlobal}%`,        sub: 'Moyenne des domaines',            color: '#2563eb' },
                            { label: 'Mesures évaluées',    value: totalEvaluated,           sub: `sur ${totalMesures} mesures`,     color: '#d97706' },
                            { label: 'Conformes (≥ niv. 3)',value: totalConforme,            sub: `sur ${totalMesures} mesures`,     color: '#16a34a' },
                        ].map((k, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                                <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                                <p className="text-2xl font-bold leading-none" style={{ color: k.color }}>{k.value}</p>
                                <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Ligne 2 : Rosace (DNSSI) ou Donut+Jauge côte à côte (ISO) ── */}
                    {!isISO ? (
                        <div className="grid grid-cols-5 gap-5">
                            <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                    <h2 className="text-sm font-semibold text-gray-800">Rosace de maturité par domaine</h2>
                                    <div className="flex items-center gap-5 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <span className="inline-block w-7 border-t-2 border-dashed border-blue-300" />
                                            Cible (niv. 3)
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(204,0,0,0.2)', border: '1.5px solid #CC0000' }} />
                                            Score actuel
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-center">
                                    <RadarChart synthese={synthese} />
                                </div>
                            </div>
                            <div className="col-span-2 flex flex-col gap-5">
                                <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center">
                                    <h2 className="text-sm font-semibold text-gray-800 mb-3 self-start">Répartition de conformité</h2>
                                    <DonutConformite conforme={totalConforme} partiel={totalPartiel} non_conforme={totalNC} na={totalNA} isISO={isISO} />
                                </div>
                                <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center">
                                    <h2 className="text-sm font-semibold text-gray-800 mb-1 self-start">Score global de maturité</h2>
                                    <p className="text-[10px] text-gray-400 self-start mb-2">Moyenne sur l'ensemble des domaines</p>
                                    <JaugeScore score={globalScore} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-5">
                            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center">
                                <h2 className="text-sm font-semibold text-gray-800 mb-3 self-start">Répartition de conformité (Annexe A)</h2>
                                <p className="text-[10px] text-gray-400 self-start mb-4">Contrôles applicables évalués — Conformes / NC mineures / NC majeures / N/A</p>
                                <DonutConformite conforme={totalConforme} partiel={totalPartiel} non_conforme={totalNC} na={totalNA} isISO={isISO} />
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center">
                                <h2 className="text-sm font-semibold text-gray-800 mb-1 self-start">Taux de conformité global</h2>
                                <p className="text-[10px] text-gray-400 self-start mb-2">Score moyen pondéré sur les contrôles applicables</p>
                                <JaugeScore score={globalScore} />
                                <p className="text-[10px] text-gray-400 mt-3 text-center max-w-xs">
                                    Pour ISO 27001, la rosace de maturité n'est pas applicable — l'évaluation utilise uniquement Conforme / NC mineure / NC majeure.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Ligne 3 : Barres empilées + Scores par domaine ── */}
                    <div className="grid grid-cols-5 gap-5">
                        <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-sm font-semibold text-gray-800 mb-4">Répartition conformité par domaine</h2>
                            <BarresEmpilees synthese={synthese} isISO={isISO} />
                        </div>

                        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-sm font-semibold text-gray-800 mb-4">Score de maturité par domaine</h2>
                            <div className="space-y-4">
                                {synthese.map(d => (
                                    <div key={d.id}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="shrink-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{d.code}</span>
                                                <span className="text-xs text-gray-600 truncate">{stripPrefix(d.nom)}</span>
                                            </div>
                                            <span className="shrink-0 text-xs font-bold ml-2" style={{ color: scoreColor(d.avgScore) }}>
                                                {d.avgScore.toFixed(1)}/5
                                            </span>
                                        </div>
                                        <div className="relative h-2 bg-gray-100 rounded-full overflow-visible">
                                            <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${(d.avgScore / 5) * 100}%`, backgroundColor: scoreColor(d.avgScore) }} />
                                            <div className="absolute top-[-3px] bottom-[-3px] w-px bg-blue-400 opacity-60" style={{ left: '60%' }} />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                            <span>{d.evaluatedCount}/{d.total} évaluées</span>
                                            <span>{d.tauxConformite}% conformité</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100">
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: '0 Inexistant',    color: '#CC0000' },
                                        { label: '1-2 Initial',     color: '#ea580c' },
                                        { label: '2-3 Reproductible', color: '#d97706' },
                                        { label: '3-4 Défini',      color: '#2563eb' },
                                        { label: '4-5 Optimisé',    color: '#16a34a' },
                                    ].map((l, i) => (
                                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: l.color + '18', color: l.color }}>
                                            {l.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Tableau détail ── */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-sm font-semibold text-gray-800 mb-4">Tableau de synthèse détaillé</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        {['Domaine', 'Score moy.', 'Niveau', 'Conformes', isISO ? 'NC mineures' : 'Partiels', isISO ? 'NC majeures' : 'Non-conformes', 'N/A', 'Taux conformité'].map((h, i) => (
                                            <th key={i} className={`text-xs font-semibold text-gray-500 pb-2.5 ${i === 0 ? 'text-left pr-4' : 'text-center px-3'}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {synthese.map((d, i) => (
                                        <tr key={d.id} className={`border-b border-gray-50 ${i % 2 !== 0 ? 'bg-gray-50/40' : ''}`}>
                                            <td className="py-3 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{d.code}</span>
                                                    <span className="text-xs text-gray-700">{stripPrefix(d.nom)}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className="text-sm font-bold" style={{ color: scoreColor(d.avgScore) }}>{d.avgScore.toFixed(1)}</span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: scoreColor(d.avgScore), backgroundColor: scoreColor(d.avgScore) + '1a' }}>{scoreLabel(d.avgScore)}</span>
                                            </td>
                                            <td className="py-3 px-3 text-center text-xs font-semibold text-green-600">{d.conforme}</td>
                                            <td className="py-3 px-3 text-center text-xs font-semibold text-yellow-600">{d.partiel}</td>
                                            <td className="py-3 px-3 text-center text-xs font-semibold text-red-600">{d.non_conforme}</td>
                                            <td className="py-3 px-3 text-center text-xs text-gray-400">{d.na}</td>
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-2 justify-center">
                                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${d.tauxConformite}%`, backgroundColor: '#2563eb' }} />
                                                    </div>
                                                    <span className="text-xs font-medium text-blue-600">{d.tauxConformite}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ResultatsPage;
