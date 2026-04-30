import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAudits, validerAudit, rejeterAudit } from '../../services/endpoints/auditService';
import { getAllPlanActions, validerPlanAction, rejeterPlanAction } from '../../services/endpoints/planActionService';

const PRIORITE = {
    haute:   { label: 'Haute',   cls: 'bg-orange-100 text-orange-700' },
    moyenne: { label: 'Moyenne', cls: 'bg-yellow-100 text-yellow-700' },
    basse:   { label: 'Basse',   cls: 'bg-gray-100 text-gray-500'    },
};

const STATUT_AUDIT = {
    brouillon: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600' },
    en_cours:  { label: 'En cours',  cls: 'bg-blue-100 text-blue-700' },
    termine:   { label: 'Terminé',   cls: 'bg-green-100 text-green-700' },
};

// ── Spinner ────────────────────────────────────────────────────────────────────
const Spinner = () => (
    <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
    </div>
);

// ── Empty state ────────────────────────────────────────────────────────────────
const EmptyState = ({ label }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-1">Tout est à jour</p>
    </div>
);

// ── Audit card ─────────────────────────────────────────────────────────────────
const AuditCard = ({ audit, onNavigate, onValider, onRejeter, saving }) => {
    const cfg = STATUT_AUDIT[audit.statut] || { label: audit.statut, cls: 'bg-gray-100 text-gray-500' };
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
                {/* Icône + info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 border border-gray-100">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={onNavigate}>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${cfg.cls}`}>
                                {cfg.label}
                            </span>
                            {audit.referentiel && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-50 text-violet-600">
                                    {audit.referentiel.nom}
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-red-700 truncate">{audit.nom}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {audit.client && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                                    </svg>
                                    {audit.client}
                                </span>
                            )}
                            {audit.auditeurs?.length > 0 && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    {audit.auditeurs.map(a => `${a.prenom} ${a.nom}`).join(', ')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={onRejeter} disabled={saving}
                        className="px-3.5 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
                        Rejeter
                    </button>
                    <button onClick={onValider} disabled={saving}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Valider
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center mt-4 pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">Soumis pour validation</span>
                <button onClick={onNavigate} className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition">
                    Voir l'audit
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// ── Plan card ──────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, onNavigate, onValider, onRejeter, saving }) => {
    const pCfg = PRIORITE[plan.priorite] || PRIORITE.basse;
    const isOverdue = plan.delai && new Date(plan.delai) < new Date();

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
                {/* Icône + info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 border border-gray-100">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={onNavigate}>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${pCfg.cls}`}>
                                {pCfg.label}
                            </span>
                            {plan.delai && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                                    </svg>
                                    {new Date(plan.delai).toLocaleDateString('fr-FR')}
                                    {isOverdue && ' — En retard'}
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {plan.action_corrective || `Plan d'action #${plan.id}`}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {plan.audit && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                    {plan.audit.nom}
                                </span>
                            )}
                            {plan.responsable && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    {plan.responsable}
                                </span>
                            )}
                            {plan.mesure && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                    {plan.mesure.code}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={onRejeter} disabled={saving}
                        className="px-3.5 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
                        Rejeter
                    </button>
                    <button onClick={onValider} disabled={saving}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Valider
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center mt-4 pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">Soumis pour validation</span>
                <button onClick={onNavigate} className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition">
                    Voir l'audit
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

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

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [auditsRes, plansRes] = await Promise.all([getAllAudits(), getAllPlanActions()]);
            setAudits((auditsRes.data.audits || []).filter(a => a.statut_validation === 'en_attente'));
            setPlans((plansRes.data.plans_actions || []).filter(p => p.statut_validation === 'en_attente'));
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

    const pendingAudits = audits.length;
    const pendingPlans  = plans.length;
    const total         = pendingAudits + pendingPlans;

    return (
        <div className="flex flex-col h-full">

            {/* ── En-tête ── */}
            <div className="flex-shrink-0 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">En attente de validation</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {loading ? 'Chargement...' : total === 0
                                ? 'Aucun élément en attente — tout est à jour'
                                : `${total} élément${total > 1 ? 's' : ''} nécessite${total > 1 ? 'nt' : ''} votre décision`}
                        </p>
                    </div>
                </div>

                {/* Compteurs */}
                {!loading && (
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => setTab('audits')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${tab === 'audits' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tab === 'audits' ? 'bg-white' : 'bg-gray-100'}`}>
                                <svg className={`w-4 h-4 ${tab === 'audits' ? 'text-red-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <p className={`text-lg font-bold leading-none ${tab === 'audits' ? 'text-red-700' : 'text-gray-800'}`}>{pendingAudits}</p>
                                <p className={`text-xs mt-0.5 ${tab === 'audits' ? 'text-red-600' : 'text-gray-500'}`}>Audits</p>
                            </div>
                        </button>

                        <button onClick={() => setTab('plans')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${tab === 'plans' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tab === 'plans' ? 'bg-white' : 'bg-gray-100'}`}>
                                <svg className={`w-4 h-4 ${tab === 'plans' ? 'text-red-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <p className={`text-lg font-bold leading-none ${tab === 'plans' ? 'text-red-700' : 'text-gray-800'}`}>{pendingPlans}</p>
                                <p className={`text-xs mt-0.5 ${tab === 'plans' ? 'text-red-600' : 'text-gray-500'}`}>Plans d'actions</p>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* ── Contenu ── */}
            <div className="flex-1 overflow-y-auto">
                {loading ? <Spinner /> : error ? (
                    <div className="p-6 text-sm text-red-500">Erreur : {error}</div>
                ) : (
                    <>
                        {tab === 'audits' && (
                            audits.length === 0
                                ? <EmptyState label="Aucun audit en attente de validation" />
                                : <div className="space-y-3 max-w-4xl">
                                    {audits.map(a => (
                                        <AuditCard key={a.id} audit={a}
                                            onNavigate={() => navigate(`/audits/${a.id}`)}
                                            onValider={() => handleValiderAudit(a.id)}
                                            onRejeter={() => openRejet('audit', a.id)}
                                            saving={saving} />
                                    ))}
                                </div>
                        )}
                        {tab === 'plans' && (
                            plans.length === 0
                                ? <EmptyState label="Aucun plan d'action en attente de validation" />
                                : <div className="space-y-3 max-w-4xl">
                                    {plans.map(p => (
                                        <PlanCard key={p.id} plan={p}
                                            onNavigate={() => navigate(`/audits/${p.audit_id}`)}
                                            onValider={() => handleValiderPlan(p.audit_id, p.id)}
                                            onRejeter={() => openRejet('plan', p.id, p.audit_id)}
                                            saving={saving} />
                                    ))}
                                </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Modal de rejet ── */}
            {rejetTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4.5 h-4.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition" />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setRejetTarget(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                                Annuler
                            </button>
                            <button onClick={handleRejeter} disabled={!rejetComment.trim() || saving}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50"
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
