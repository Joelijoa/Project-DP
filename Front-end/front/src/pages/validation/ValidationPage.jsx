import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAudits, validerAudit, rejeterAudit } from '../../services/endpoints/auditService';
import { getAllPlanActions, validerPlanAction, rejeterPlanAction } from '../../services/endpoints/planActionService';
import AuditCard from './components/AuditCard';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

// ── Spinner ────────────────────────────────────────────────────────────────────
const Spinner = () => (
    <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
    </div>
);

// ── Empty state ────────────────────────────────────────────────────────────────
const EmptyState = ({ label, filtered = false }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: filtered ? '#f9fafb' : '#f0fdf4', border: filtered ? '1px solid #f3f4f6' : '1px solid #bbf7d0' }}>
            <svg className={`w-7 h-7 ${filtered ? 'text-gray-300' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-1">{filtered ? 'Essayez de modifier la recherche.' : 'Tout est à jour'}</p>
    </div>
);

// ── Page principale ────────────────────────────────────────────────────────────
const ValidationPage = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('audits');
    const [audits, setAudits] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rejetTarget, setRejetTarget] = useState(null);
    const [rejetComment, setRejetComment] = useState('');
    const [saving, setSaving] = useState(false);
    const [openGroups, setOpenGroups] = useState(new Set());
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [auditsRes, plansRes] = await Promise.all([getAllAudits(), getAllPlanActions()]);
            setAudits((auditsRes.data.audits || []).filter(a => a.statut_validation === 'en_attente'));
            const filteredPlans = (plansRes.data.plans_actions || []).filter(p => p.statut_validation === 'en_attente');
            setPlans(filteredPlans);
            setOpenGroups(new Set(filteredPlans.map(p => p.audit_id)));
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleValiderAudit = async (id) => {
        setSaving(true);
        try { await validerAudit(id); await load(); } finally { setSaving(false); }
    };

    const handleValiderPlan = async (auditId, planId) => {
        setSaving(true);
        try { await validerPlanAction(auditId, planId); await load(); } finally { setSaving(false); }
    };

    const openRejet = (type, id, auditId = null) => {
        setRejetTarget({ type, id, auditId });
        setRejetComment('');
    };

    const handleRejeter = async () => {
        if (!rejetComment.trim() || saving) return;
        setSaving(true);
        try {
            if (rejetTarget.type === 'audit') {
                await rejeterAudit(rejetTarget.id, rejetComment);
            } else {
                await rejeterPlanAction(rejetTarget.auditId, rejetTarget.id, rejetComment);
            }
            setRejetTarget(null);
            await load();
        } finally { setSaving(false); }
    };

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

    const pendingAudits = audits.length;
    const pendingPlans  = plans.length;
    const total         = pendingAudits + pendingPlans;

    const filteredAudits = useMemo(() => audits.filter(a => {
        if (!search) return true;
        const q = search.toLowerCase();
        return a.nom.toLowerCase().includes(q) || (a.client || '').toLowerCase().includes(q);
    }), [audits, search]);

    const filteredPlansByAudit = useMemo(() => plansByAudit.map(g => ({
        ...g,
        plans: g.plans.filter(p => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (p.action_corrective || '').toLowerCase().includes(q) ||
                   (g.audit?.nom || '').toLowerCase().includes(q);
        }),
    })).filter(g => g.plans.length > 0), [plansByAudit, search]);

    return (
        <div className="space-y-5">

            {/* ── En-tête — style Archives ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Travaux soumis</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {loading ? 'Chargement...' : total === 0
                            ? 'Aucun travail en attente — tout est à jour'
                            : `${total} élément${total > 1 ? 's' : ''} nécessite${total > 1 ? 'nt' : ''} votre décision`}
                    </p>
                </div>
                {!loading && total > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-semibold text-amber-700">{total} en attente</span>
                    </div>
                )}
            </div>

            {loading ? <Spinner /> : error ? (
                <div className="p-6 text-sm text-red-500">Erreur : {error}</div>
            ) : (
                <>
                    {/* ── Onglets — style Archives ── */}
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                        {[
                            { key: 'audits', label: 'Audits',          count: pendingAudits },
                            { key: 'plans',  label: "Plans d'actions", count: pendingPlans  },
                        ].map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                    tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}>
                                {t.label}
                                {t.count > 0 && (
                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                                        tab === t.key ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── Barre de recherche — style Archives ── */}
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
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition">
                                Réinitialiser
                            </button>
                        )}
                        <span className="ml-auto text-xs text-gray-400">
                            {tab === 'audits'
                                ? `${filteredAudits.length} résultat${filteredAudits.length !== 1 ? 's' : ''}`
                                : `${filteredPlansByAudit.reduce((s, g) => s + g.plans.length, 0)} résultat${filteredPlansByAudit.reduce((s, g) => s + g.plans.length, 0) !== 1 ? 's' : ''}`
                            }
                        </span>
                    </div>

                    {/* ── Audits ── */}
                    {tab === 'audits' && (
                        filteredAudits.length === 0
                            ? <EmptyState label="Aucun audit en attente de validation" filtered={!!search && audits.length > 0} />
                            : <div className="space-y-3">
                                {filteredAudits.map(a => (
                                    <AuditCard key={a.id} audit={a}
                                        onNavigate={() => navigate(`/audits/${a.id}`)}
                                        onValider={() => handleValiderAudit(a.id)}
                                        onRejeter={() => openRejet('audit', a.id)}
                                        saving={saving} />
                                ))}
                            </div>
                    )}

                    {/* ── Plans d'actions ── */}
                    {tab === 'plans' && (
                        filteredPlansByAudit.length === 0
                            ? <EmptyState label="Aucun plan d'action en attente de validation" filtered={!!search && plansByAudit.length > 0} />
                            : <div className="space-y-3">
                                {filteredPlansByAudit.map(({ audit, auditId, plans: groupPlans }) => {
                                    const isOpen = openGroups.has(auditId);
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
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="text-xs font-semibold text-gray-500">{groupPlans.length} plan{groupPlans.length > 1 ? 's' : ''}</span>
                                                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">en attente</span>
                                                    <button onClick={e => { e.stopPropagation(); navigate(`/audits/${auditId}`); }}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white rounded-lg hover:opacity-90 transition"
                                                        style={{ backgroundColor: 'var(--brand-red)' }}>
                                                        Voir l'audit
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </button>

                                            {isOpen && (
                                                <div className="border-t border-gray-100 divide-y divide-gray-50">
                                                    {groupPlans.map(p => (
                                                        <div key={p.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                    {p.mesure?.code && (
                                                                        <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                            {p.mesure.code}
                                                                        </span>
                                                                    )}
                                                                    {p.priorite && (
                                                                        <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                                                                            p.priorite === 'haute'   ? 'bg-red-50 text-red-700' :
                                                                            p.priorite === 'moyenne' ? 'bg-amber-50 text-amber-700' :
                                                                                                      'bg-gray-100 text-gray-600'
                                                                        }`}>
                                                                            {p.priorite.charAt(0).toUpperCase() + p.priorite.slice(1)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-800 line-clamp-2">
                                                                    {p.action_corrective || `Plan d'action #${p.id}`}
                                                                </p>
                                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                                    {p.responsable && <span className="text-xs text-gray-400">Resp. {p.responsable}</span>}
                                                                    {p.delai && <span className="text-xs text-gray-400">· {fmtDate(p.delai)}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                                                                <button onClick={() => handleValiderPlan(auditId, p.id)} disabled={saving}
                                                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                    </svg>
                                                                    Valider
                                                                </button>
                                                                <button onClick={() => openRejet('plan', p.id, auditId)} disabled={saving}
                                                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                                                                    style={{ backgroundColor: 'var(--brand-red)' }}>
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                    Rejeter
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                    )}
                </>
            )}
            {/* ── Modal de rejet ── */}
            {rejetTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Motif de rejet</h3>
                                <p className="text-xs text-gray-500">Ce commentaire sera transmis à l'équipe concernée.</p>
                            </div>
                        </div>
                        <textarea value={rejetComment} onChange={e => setRejetComment(e.target.value)}
                            rows={4} placeholder="Expliquez la raison du rejet..."
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition" />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setRejetTarget(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                                Annuler
                            </button>
                            <button onClick={handleRejeter} disabled={!rejetComment.trim() || saving}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition disabled:opacity-50"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                Rejeter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValidationPage;
