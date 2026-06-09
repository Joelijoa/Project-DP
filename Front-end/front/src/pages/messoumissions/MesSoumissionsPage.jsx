import { useEffect, useState, useMemo } from 'react';
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

const STATUT_OPTIONS = [
    { value: '',           label: 'Tous les statuts' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'valide',     label: 'Validé' },
    { value: 'rejete',     label: 'Rejeté' },
];

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

const EmptyState = ({ label }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
        </div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-1">Aucun élément soumis pour le moment</p>
    </div>
);

const PLAN_VALIDATION_CONFIG = {
    en_attente: { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700' },
    valide:     { label: 'Validé',     bg: 'bg-green-50', text: 'text-green-700' },
    rejete:     { label: 'Rejeté',     bg: 'bg-red-50',   text: 'text-red-700'  },
};

const MesSoumissionsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('audits');
    const [audits, setAudits] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openGroups, setOpenGroups] = useState(new Set());
    const [search, setSearch] = useState('');
    const [filterStatut, setFilterStatut] = useState('');

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
                const filteredPlans = allPlans.filter(p =>
                    p.audit?.auditeurs?.some(au => au.id === user.id) &&
                    p.statut_validation != null
                );
                setPlans(filteredPlans);
                const ids = new Set(filteredPlans.map(p => p.audit_id));
                setOpenGroups(ids);
            } catch { } finally { setLoading(false); }
        };
        run();
    }, [user.id]);

    const plansByAudit = useMemo(() => {
        const map = {};
        plans.forEach(p => {
            if (!map[p.audit_id]) map[p.audit_id] = { audit: p.audit, auditId: p.audit_id, plans: [] };
            map[p.audit_id].plans.push(p);
        });
        return Object.values(map);
    }, [plans]);

    const toggleGroup = (id) => setOpenGroups(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const countByStatut = (list) => ({
        en_attente: list.filter(x => x.statut_validation === 'en_attente').length,
        valide:     list.filter(x => x.statut_validation === 'valide').length,
        rejete:     list.filter(x => x.statut_validation === 'rejete').length,
    });

    const auditStats = countByStatut(audits);
    const planStats  = countByStatut(plans);

    // Filtres
    const filteredAudits = useMemo(() => audits.filter(a => {
        if (search && !a.nom.toLowerCase().includes(search.toLowerCase()) &&
            !(a.client || '').toLowerCase().includes(search.toLowerCase())) return false;
        if (filterStatut && a.statut_validation !== filterStatut) return false;
        return true;
    }), [audits, search, filterStatut]);

    const filteredPlansByAudit = useMemo(() => plansByAudit.map(g => ({
        ...g,
        plans: g.plans.filter(p => {
            if (search && !(p.action_corrective || '').toLowerCase().includes(search.toLowerCase()) &&
                !(g.audit?.nom || '').toLowerCase().includes(search.toLowerCase())) return false;
            if (filterStatut && p.statut_validation !== filterStatut) return false;
            return true;
        }),
    })).filter(g => g.plans.length > 0), [plansByAudit, search, filterStatut]);

    const hasFilters = search || filterStatut;
    const total = tab === 'audits' ? audits.length : plans.length;

    const tabs = [
        { key: 'audits', label: 'Audits soumis',          count: audits.length, stats: auditStats },
        { key: 'plans',  label: "Plans d'actions soumis",  count: plans.length,  stats: planStats  },
    ];

    return (
        <div className="space-y-5">

            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Travaux soumis</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Suivi des audits et plans d'actions soumis pour validation
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-600">{total} soumission{total > 1 ? 's' : ''}</span>
                </div>
            </div>

            {loading ? <Spin /> : (
                <>
                    {/* Onglets — style Archives */}
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                    tab === t.key
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}>
                                {t.label}
                                {t.count > 0 && (
                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                                        tab === t.key ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {t.count}
                                    </span>
                                )}
                                {t.count > 0 && (
                                    <div className="flex gap-1">
                                        {t.stats.en_attente > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
                                        {t.stats.valide > 0     && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />}
                                        {t.stats.rejete > 0     && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Barre de filtres — style Archives */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-48">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Rechercher un audit ou action..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-1 py-1">
                            {STATUT_OPTIONS.map(opt => (
                                <button key={opt.value} onClick={() => setFilterStatut(opt.value)}
                                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                                        filterStatut === opt.value
                                            ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {hasFilters && (
                            <button onClick={() => { setSearch(''); setFilterStatut(''); }}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition">
                                Réinitialiser
                            </button>
                        )}
                        <span className="ml-auto text-xs text-gray-400">
                            {tab === 'audits' ? filteredAudits.length : filteredPlansByAudit.reduce((s, g) => s + g.plans.length, 0)} résultat{(tab === 'audits' ? filteredAudits.length : filteredPlansByAudit.reduce((s, g) => s + g.plans.length, 0)) > 1 ? 's' : ''}
                        </span>
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

                    {/* ── Onglet Audits ── */}
                    {tab === 'audits' && (
                        filteredAudits.length === 0
                            ? <EmptyState label={audits.length === 0 ? 'Aucun audit soumis' : 'Aucun résultat pour ces filtres'} />
                            : <div className="space-y-3">
                                {filteredAudits.map(a => {
                                    const cfg = VALIDATION_CONFIG[a.statut_validation];
                                    return (
                                        <div key={a.id}
                                            className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                                                a.statut_validation === 'rejete'
                                                    ? 'border-red-200'
                                                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                                            }`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                        <StatusBadge statut={a.statut_validation} />
                                                        {a.referentiel && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600">
                                                                {a.referentiel.type === 'ISO27001' ? 'ISO 27001' : a.referentiel.type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900">{a.nom}</p>
                                                    {a.client && (
                                                        <p className="text-xs text-gray-400 mt-0.5">{a.client}</p>
                                                    )}
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
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-xl transition hover:opacity-90 flex-shrink-0"
                                                    style={{ backgroundColor: 'var(--brand-red)' }}>
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

                    {/* ── Onglet Plans ── */}
                    {tab === 'plans' && (
                        filteredPlansByAudit.length === 0
                            ? <EmptyState label={plans.length === 0 ? "Aucun plan d'action soumis" : 'Aucun résultat pour ces filtres'} />
                            : <div className="space-y-3">
                                {filteredPlansByAudit.map(({ audit, auditId, plans: groupPlans }) => {
                                    const isOpen = openGroups.has(auditId);
                                    const byStatut = {
                                        en_attente: groupPlans.filter(p => p.statut_validation === 'en_attente').length,
                                        valide:     groupPlans.filter(p => p.statut_validation === 'valide').length,
                                        rejete:     groupPlans.filter(p => p.statut_validation === 'rejete').length,
                                    };
                                    return (
                                        <div key={auditId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                            <button onClick={() => toggleGroup(auditId)}
                                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left">
                                                <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                </svg>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-semibold text-gray-800 truncate">
                                                            {audit?.nom || `Audit #${auditId}`}
                                                        </span>
                                                        {audit?.referentiel?.type && (
                                                            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 flex-shrink-0">
                                                                {audit.referentiel.type === 'ISO27001' ? 'ISO 27001' : audit.referentiel.type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {audit?.client && (
                                                        <p className="text-xs text-gray-400 mt-0.5 truncate">{audit.client}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <span className="text-xs font-semibold text-gray-500">{groupPlans.length} plan{groupPlans.length > 1 ? 's' : ''}</span>
                                                    {byStatut.en_attente > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">{byStatut.en_attente} en attente</span>}
                                                    {byStatut.valide > 0     && <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">{byStatut.valide} validé{byStatut.valide > 1 ? 's' : ''}</span>}
                                                    {byStatut.rejete > 0     && <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-medium">{byStatut.rejete} rejeté{byStatut.rejete > 1 ? 's' : ''}</span>}
                                                </div>
                                            </button>

                                            {isOpen && (
                                                <div className="border-t border-gray-100 divide-y divide-gray-50">
                                                    {groupPlans.map(p => {
                                                        const vc = PLAN_VALIDATION_CONFIG[p.statut_validation];
                                                        return (
                                                            <div key={p.id} className={`px-5 py-3.5 ${p.statut_validation === 'rejete' ? 'bg-red-50/30' : ''}`}>
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                            {vc && (
                                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${vc.bg} ${vc.text}`}>
                                                                                    {vc.label}
                                                                                </span>
                                                                            )}
                                                                            {p.mesure?.code && (
                                                                                <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                                    {p.mesure.code}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-gray-800 line-clamp-2">
                                                                            {p.action_corrective || `Plan d'action #${p.id}`}
                                                                        </p>
                                                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                                            {p.responsable && <span className="text-xs text-gray-400">Resp. {p.responsable}</span>}
                                                                            {p.delai && <span className="text-xs text-gray-400">· {new Date(p.delai).toLocaleDateString('fr-FR')}</span>}
                                                                        </div>
                                                                        {p.statut_validation === 'rejete' && p.commentaire_rejet && (
                                                                            <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
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
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    <div className="px-5 py-3 flex justify-end bg-gray-50/50">
                                                        <button onClick={() => navigate(`/audits/${auditId}`)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-xl transition hover:opacity-90"
                                                            style={{ backgroundColor: 'var(--brand-red)' }}>
                                                            Voir l'audit
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
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
