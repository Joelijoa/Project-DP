import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth/AuthContext';
import { getAllAudits } from '../../services/endpoints/auditService';
import { getAllPlanActions } from '../../services/endpoints/planActionService';

const VALIDATION_CONFIG = {
    en_attente: {
        label: 'En attente',
        bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
        dot: 'bg-amber-400',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    valide: {
        label: 'Validé',
        bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200',
        dot: 'bg-green-500',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    rejete: {
        label: 'Rejeté',
        bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200',
        dot: 'bg-red-500',
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
};

const StatusBadge = ({ statut }) => {
    const cfg = VALIDATION_CONFIG[statut];
    if (!cfg) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
};

const Spin = () => (
    <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
    </div>
);

const EmptyTab = ({ label }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-gray-50">
            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
        </div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-xs text-gray-400 mt-1">Aucun élément soumis pour le moment</p>
    </div>
);

const MesSoumissionsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('audits');
    const [audits, setAudits] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            try {
                const [aRes, pRes] = await Promise.all([getAllAudits(), getAllPlanActions()]);
                const allAudits = aRes.data.audits || [];
                const allPlans  = pRes.data.plans_actions || [];

                setAudits(
                    allAudits.filter(a =>
                        a.auditeurs?.some(au => au.id === user.id) &&
                        a.statut_validation != null
                    )
                );
                setPlans(
                    allPlans.filter(p =>
                        p.audit?.auditeurs?.some(au => au.id === user.id) &&
                        p.statut_validation != null
                    )
                );
            } catch { } finally { setLoading(false); }
        };
        run();
    }, [user.id]);

    const countByStatut = (list) => ({
        en_attente: list.filter(x => x.statut_validation === 'en_attente').length,
        valide:     list.filter(x => x.statut_validation === 'valide').length,
        rejete:     list.filter(x => x.statut_validation === 'rejete').length,
    });

    const auditStats = countByStatut(audits);
    const planStats  = countByStatut(plans);

    const tabs = [
        { key: 'audits', label: 'Audits soumis',         count: audits.length, stats: auditStats },
        { key: 'plans',  label: "Plans d'actions soumis", count: plans.length,  stats: planStats  },
    ];

    return (
        <div className="space-y-6">

            {/* En-tête */}
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Mes soumissions</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Suivi des audits et plans d'actions que vous avez soumis pour validation
                </p>
            </div>

            {loading ? <Spin /> : (
                <>
                    {/* Onglets */}
                    <div className="flex gap-3">
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${tab === t.key ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                                <div className="text-left">
                                    <p className={`text-lg font-bold leading-none ${tab === t.key ? 'text-red-700' : 'text-gray-800'}`}>
                                        {t.count}
                                    </p>
                                    <p className={`text-xs mt-0.5 ${tab === t.key ? 'text-red-600' : 'text-gray-500'}`}>
                                        {t.label}
                                    </p>
                                </div>
                                {t.count > 0 && (
                                    <div className="flex gap-1.5 ml-2">
                                        {t.stats.en_attente > 0 && (
                                            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-0.5" title={`${t.stats.en_attente} en attente`} />
                                        )}
                                        {t.stats.valide > 0 && (
                                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-0.5" title={`${t.stats.valide} validé(s)`} />
                                        )}
                                        {t.stats.rejete > 0 && (
                                            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-0.5" title={`${t.stats.rejete} rejeté(s)`} />
                                        )}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Alerte rejets */}
                    {tab === 'audits' && auditStats.rejete > 0 && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <p className="text-sm text-red-700 font-medium">
                                {auditStats.rejete} audit{auditStats.rejete > 1 ? 's' : ''} rejeté{auditStats.rejete > 1 ? 's' : ''} — consultez le motif ci-dessous et corrigez avant de resoumettre.
                            </p>
                        </div>
                    )}
                    {tab === 'plans' && planStats.rejete > 0 && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <p className="text-sm text-red-700 font-medium">
                                {planStats.rejete} plan{planStats.rejete > 1 ? 's' : ''} rejeté{planStats.rejete > 1 ? 's' : ''} — consultez le motif ci-dessous et corrigez dans Plans d'actions.
                            </p>
                        </div>
                    )}

                    {/* Liste audits */}
                    {tab === 'audits' && (
                        audits.length === 0
                            ? <EmptyTab label="Aucun audit soumis" />
                            : <div className="space-y-3 max-w-4xl">
                                {audits.map(a => {
                                    const cfg = VALIDATION_CONFIG[a.statut_validation];
                                    return (
                                        <div key={a.id}
                                            className={`bg-white border rounded-2xl p-5 transition-all ${a.statut_validation === 'rejete' ? 'border-red-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                        <StatusBadge statut={a.statut_validation} />
                                                        {a.referentiel && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-50 text-violet-600">
                                                                {a.referentiel.nom}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900">{a.nom}</p>
                                                    {a.client && (
                                                        <p className="text-xs text-gray-400 mt-1">{a.client}</p>
                                                    )}
                                                    {/* Motif de rejet */}
                                                    {a.statut_validation === 'rejete' && a.commentaire_rejet && (
                                                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                                                            <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                                            </svg>
                                                            <div>
                                                                <p className="text-[11px] font-semibold text-red-600 mb-0.5">Motif du rejet</p>
                                                                <p className="text-xs text-red-700 leading-relaxed">{a.commentaire_rejet}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={() => navigate(`/audits/${a.id}`)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition flex-shrink-0">
                                                    Voir l'audit
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                    )}

                    {/* Liste plans */}
                    {tab === 'plans' && (
                        plans.length === 0
                            ? <EmptyTab label="Aucun plan d'action soumis" />
                            : <div className="space-y-3 max-w-4xl">
                                {plans.map(p => {
                                    return (
                                        <div key={p.id}
                                            className={`bg-white border rounded-2xl p-5 transition-all ${p.statut_validation === 'rejete' ? 'border-red-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                        <StatusBadge statut={p.statut_validation} />
                                                        {p.mesure?.code && (
                                                            <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                {p.mesure.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                                                        {p.action_corrective || `Plan d'action #${p.id}`}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                        {p.audit && (
                                                            <span className="text-xs text-gray-400">{p.audit.nom}</span>
                                                        )}
                                                        {p.responsable && (
                                                            <span className="text-xs text-gray-400">· Resp. {p.responsable}</span>
                                                        )}
                                                        {p.delai && (
                                                            <span className="text-xs text-gray-400">
                                                                · {new Date(p.delai).toLocaleDateString('fr-FR')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Motif de rejet */}
                                                    {p.statut_validation === 'rejete' && p.commentaire_rejet && (
                                                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                                                            <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                                            </svg>
                                                            <div>
                                                                <p className="text-[11px] font-semibold text-red-600 mb-0.5">Motif du rejet</p>
                                                                <p className="text-xs text-red-700 leading-relaxed">{p.commentaire_rejet}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={() => navigate(`/audits/${p.audit_id}`)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition flex-shrink-0">
                                                    Voir l'audit
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MesSoumissionsPage;
