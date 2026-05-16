import { useEffect, useState, useMemo } from 'react';
import { getAllAudits, getEvaluations } from '../../services/endpoints/auditService';
import { getReferentielById } from '../../services/endpoints/referentielService';
import EvolutionChart from './components/EvolutionChart';

// ── Helpers ────────────────────────────────────────────────────────────────────

const pct = (n, total) => (total > 0 ? Math.round((n / total) * 100) : 0);

const conformiteScore = (evals) => {
    if (!evals.length) return null;
    const applicable = evals.filter(e => e.conformite !== 'na');
    if (!applicable.length) return null;
    const conforme = applicable.filter(e => e.conformite === 'conforme').length;
    const partiel  = applicable.filter(e => e.conformite === 'partiel').length;
    return Math.round(((conforme + partiel * 0.5) / applicable.length) * 100);
};

const maturiteMoy = (evals) => {
    const valid = evals.filter(e => e.niveau_maturite !== null && e.niveau_maturite !== undefined);
    if (!valid.length) return null;
    return (valid.reduce((s, e) => s + e.niveau_maturite, 0) / valid.length);
};

const Sk = ({ className }) => <div className={`bg-gray-100 animate-pulse rounded-lg ${className}`} />;

const Spin = () => (
    <div className="flex justify-center items-center py-24">
        <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
    </div>
);

// ── Page ───────────────────────────────────────────────────────────────────────

const IndicateursPage = () => {
    const [audits,    setAudits]    = useState([]);
    const [allEvals,  setAllEvals]  = useState({}); // auditId → evaluations[]
    const [allRefs,   setAllRefs]   = useState({}); // refId   → referentiel
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        const run = async () => {
            try {
                const { data } = await getAllAudits();
                const termines = (data.audits || []).filter(a => a.statut === 'termine');
                setAudits(data.audits || []);

                if (!termines.length) { setLoading(false); return; }

                // Charger évaluations + référentiels en parallèle
                const uniqueRefIds = [...new Set(termines.map(a => a.referentiel_id))];
                const [evResults, refResults] = await Promise.all([
                    Promise.all(termines.map(a => getEvaluations(a.id).then(r => ({ id: a.id, evals: r.data.evaluations || [] })))),
                    Promise.all(uniqueRefIds.map(id => getReferentielById(id).then(r => ({ id, ref: r.data.referentiel })))),
                ]);

                const evMap  = {};
                evResults.forEach(({ id, evals }) => { evMap[id] = evals; });

                const refMap = {};
                refResults.forEach(({ id, ref }) => {
                    refMap[id] = {};
                    ref?.domaines?.forEach(d => {
                        d.objectifs?.forEach(o => { refMap[id][o.id] = d; });
                    });
                    refMap[id].__domaines = ref?.domaines || [];
                });

                setAllEvals(evMap);
                setAllRefs(refMap);
            } catch {
                // silencieux
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    // ── Calculs agrégés ────────────────────────────────────────────────────────

    const { termines, kpis, evolution, domainesCritiques, parEntite, parReferentiel } = useMemo(() => {
        const termines = audits.filter(a => a.statut === 'termine' && allEvals[a.id]);
        if (!termines.length) return { termines: [], kpis: null, evolution: [], domainesCritiques: [], parEntite: [], parReferentiel: [] };

        // KPIs globaux
        let sommeTaux = 0, sommeMat = 0, nbTaux = 0, nbMat = 0;
        termines.forEach(a => {
            const ev = allEvals[a.id] || [];
            const t  = conformiteScore(ev);
            const m  = maturiteMoy(ev);
            if (t !== null) { sommeTaux += t; nbTaux++; }
            if (m !== null) { sommeMat  += m; nbMat++;  }
        });
        const kpis = {
            nbAnalyses:   termines.length,
            tauxMoyen:    nbTaux > 0 ? Math.round(sommeTaux / nbTaux) : 0,
            maturiteMoy:  nbMat  > 0 ? (sommeMat / nbMat).toFixed(1) : '—',
            nbEntites:    new Set(termines.map(a => a.client)).size,
        };

        // Évolution dans le temps
        const evolution = [...termines]
            .sort((a, b) => new Date(a.date_fin || a.createdAt) - new Date(b.date_fin || b.createdAt))
            .map(a => {
                const score = conformiteScore(allEvals[a.id] || []);
                return { label: a.nom, date: a.date_fin || a.createdAt, score: score ?? 0 };
            });

        // Domaines critiques : taux moyen par domaine sur tous les audits
        const domaineAccum = {}; // domaineNom → { sum, count }
        termines.forEach(a => {
            const ev     = allEvals[a.id]     || [];
            const objMap = allRefs[a.referentiel_id] || {};
            ev.forEach(e => {
                const d = objMap[e.mesure?.objectif_id];
                if (!d) return;
                if (!domaineAccum[d.nom]) domaineAccum[d.nom] = { sum: 0, count: 0, code: d.code };
                if (e.conformite !== 'na') {
                    domaineAccum[d.nom].sum   += e.conformite === 'conforme' ? 1 : e.conformite === 'partiel' ? 0.5 : 0;
                    domaineAccum[d.nom].count++;
                }
            });
        });
        const domainesCritiques = Object.entries(domaineAccum)
            .map(([nom, { sum, count, code }]) => ({
                nom, code,
                taux: count > 0 ? Math.round((sum / count) * 100) : 0,
                count,
            }))
            .filter(d => d.count > 0)
            .sort((a, b) => a.taux - b.taux)
            .slice(0, 8);

        // Par entité (client)
        const entiteMap = {};
        termines.forEach(a => {
            const score = conformiteScore(allEvals[a.id] || []);
            if (score === null) return;
            if (!entiteMap[a.client]) entiteMap[a.client] = { sum: 0, count: 0 };
            entiteMap[a.client].sum   += score;
            entiteMap[a.client].count++;
        });
        const parEntite = Object.entries(entiteMap)
            .map(([nom, { sum, count }]) => ({ nom, taux: Math.round(sum / count) }))
            .sort((a, b) => b.taux - a.taux);

        // Par référentiel
        const refTypeMap = {};
        termines.forEach(a => {
            const type  = a.referentiel?.type || 'Autre';
            const score = conformiteScore(allEvals[a.id] || []);
            if (score === null) return;
            if (!refTypeMap[type]) refTypeMap[type] = { sum: 0, count: 0 };
            refTypeMap[type].sum   += score;
            refTypeMap[type].count++;
        });
        const parReferentiel = Object.entries(refTypeMap)
            .map(([type, { sum, count }]) => ({ type, taux: Math.round(sum / count), count }));

        return { termines, kpis, evolution, domainesCritiques, parEntite, parReferentiel };
    }, [audits, allEvals, allRefs]);

    // ── Rendu ──────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* En-tête */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Indicateurs SSI</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                    Analyse agrégée sur l'ensemble des audits terminés — vue plateforme
                </p>
            </div>

            {loading ? <Spin /> : termines.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ backgroundColor: 'var(--brand-red-light)' }}>
                        <svg className="w-6 h-6" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Aucune donnée disponible</p>
                    <p className="text-xs text-gray-400 mt-1">Les indicateurs s'alimentent automatiquement dès qu'un audit est clôturé.</p>
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Audits analysés',          value: kpis.nbAnalyses,         sub: 'audits terminés',              icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
                            { label: 'Taux de conformité moyen', value: `${kpis.tauxMoyen}%`,    sub: 'sur tous les audits terminés', icon: 'M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z' },
                            { label: 'Maturité moyenne',         value: kpis.maturiteMoy,         sub: 'niveau moyen sur 5',           icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' },
                            { label: 'Entités distinctes',       value: kpis.nbEntites,           sub: 'entités auditées',             icon: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
                        ].map((k, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <p className="text-xs font-medium text-gray-400">{k.label}</p>
                                    <div className="p-1.5 rounded-lg bg-gray-50 flex-shrink-0">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold tracking-tight text-gray-900">{k.value}</p>
                                <p className="text-xs text-gray-400 mt-1.5">{k.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Évolution + par référentiel */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Évolution — col-span-2 */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-semibold text-gray-800">Évolution de la conformité</p>
                                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">
                                    audits triés par date de clôture
                                </span>
                            </div>
                            {evolution.length < 2 ? (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <p className="text-xs text-gray-400">Au moins 2 audits terminés sont nécessaires</p>
                                </div>
                            ) : (
                                <EvolutionChart points={evolution} />
                            )}
                        </div>

                        {/* Par référentiel */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <p className="text-sm font-semibold text-gray-800 mb-4">Par référentiel</p>
                            <div className="space-y-4">
                                {parReferentiel.map(r => (
                                    <div key={r.type}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div>
                                                <span className="text-xs font-semibold text-gray-700">{r.type}</span>
                                                <span className="text-[10px] text-gray-400 ml-1.5">{r.count} audit{r.count > 1 ? 's' : ''}</span>
                                            </div>
                                            <span className="text-sm font-extrabold" style={{ color: 'var(--brand-red)' }}>{r.taux}%</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all"
                                                style={{ width: `${r.taux}%`, backgroundColor: 'var(--brand-red)' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Domaines critiques + classement entités */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Domaines critiques */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-semibold text-gray-800">Domaines les plus faibles</p>
                                <span className="text-xs text-gray-400">tous audits confondus</span>
                            </div>
                            {domainesCritiques.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-8">Aucune donnée</p>
                            ) : (
                                <div className="space-y-3.5">
                                    {domainesCritiques.map((d, i) => (
                                        <div key={d.nom}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0">
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-xs font-medium text-gray-700 truncate">
                                                        {d.code && <span className="font-mono text-gray-400 mr-1">{d.code}</span>}
                                                        {d.nom}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-bold flex-shrink-0 ml-2"
                                                    style={{ color: d.taux >= 75 ? '#16A34A' : d.taux >= 50 ? '#D97706' : '#CC0000' }}>
                                                    {d.taux}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-6">
                                                <div className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${d.taux}%`,
                                                        backgroundColor: d.taux >= 75 ? '#16A34A' : d.taux >= 50 ? '#D97706' : '#CC0000',
                                                    }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Classement entités */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-semibold text-gray-800">Classement des entités auditées</p>
                                <span className="text-xs text-gray-400">taux moyen</span>
                            </div>
                            {parEntite.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-8">Aucune donnée</p>
                            ) : (
                                <div className="space-y-3.5">
                                    {parEntite.map((e, i) => (
                                        <div key={e.nom}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                                        i === 0 ? 'bg-yellow-100 text-yellow-700'
                                                        : i === 1 ? 'bg-gray-100 text-gray-600'
                                                        : i === 2 ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-gray-50 text-gray-400'
                                                    }`}>
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-xs font-medium text-gray-700 truncate">{e.nom}</span>
                                                </div>
                                                <span className="text-xs font-bold flex-shrink-0 ml-2"
                                                    style={{ color: e.taux >= 75 ? '#16A34A' : e.taux >= 50 ? '#D97706' : '#CC0000' }}>
                                                    {e.taux}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-7">
                                                <div className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${e.taux}%`,
                                                        backgroundColor: e.taux >= 75 ? '#16A34A' : e.taux >= 50 ? '#D97706' : '#CC0000',
                                                    }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default IndicateursPage;
