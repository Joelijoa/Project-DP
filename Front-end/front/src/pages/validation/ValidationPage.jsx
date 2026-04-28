import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAudits, validerAudit, rejeterAudit } from '../../services/endpoints/auditService';
import { getAllPlanActions, validerPlanAction, rejeterPlanAction } from '../../services/endpoints/planActionService';

const TABS = [
    { id: 'audits', label: 'Audits' },
    { id: 'plans', label: "Plans d'actions" },
];

const STATUT_AUDIT = {
    brouillon: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600' },
    en_cours:  { label: 'En cours',  cls: 'bg-blue-100 text-blue-700' },
    termine:   { label: 'Terminé',   cls: 'bg-green-100 text-green-700' },
};

const PRIORITE = {
    critique: { label: 'Critique', cls: 'bg-red-100 text-red-700' },
    haute:    { label: 'Haute',    cls: 'bg-orange-100 text-orange-700' },
    moyenne:  { label: 'Moyenne',  cls: 'bg-yellow-100 text-yellow-700' },
    faible:   { label: 'Faible',   cls: 'bg-gray-100 text-gray-600' },
};

// ── Sub-components ────────────────────────────────────────────────────────────

const EmptyState = ({ label }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-1">Tout est à jour !</p>
    </div>
);

const ActionButtons = ({ onValider, onRejeter, saving }) => (
    <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onRejeter} disabled={saving}
            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
            Rejeter
        </button>
        <button onClick={onValider} disabled={saving}
            className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--brand-red)' }}>
            Valider
        </button>
    </div>
);

const AuditCard = ({ audit, onNavigate, onValider, onRejeter, saving }) => {
    const cfg = STATUT_AUDIT[audit.statut] || { label: audit.statut, cls: 'bg-gray-100 text-gray-500' };
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-gray-300 transition">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onNavigate}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-gray-900">{audit.nom}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
                        {cfg.label}
                    </span>
                </div>
                <p className="text-xs text-gray-500">{audit.client}</p>
                {audit.referentiel && (
                    <p className="text-xs text-gray-400 mt-0.5">{audit.referentiel.nom}</p>
                )}
                {audit.auditeurs?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                        {audit.auditeurs.length > 1 ? 'Auditeurs' : 'Auditeur'} :{' '}
                        {audit.auditeurs.map(a => `${a.prenom} ${a.nom}`).join(', ')}
                    </p>
                )}
            </div>
            <ActionButtons onValider={onValider} onRejeter={onRejeter} saving={saving} />
        </div>
    );
};

const PlanCard = ({ plan, onNavigate, onValider, onRejeter, saving }) => {
    const pCfg = PRIORITE[plan.priorite];
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-gray-300 transition">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onNavigate}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-gray-900">
                        {plan.action_corrective || `Plan d'action #${plan.id}`}
                    </p>
                    {pCfg && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pCfg.cls}`}>
                            {pCfg.label}
                        </span>
                    )}
                </div>
                {plan.audit && (
                    <p className="text-xs text-gray-500">
                        Audit : <span className="font-medium">{plan.audit.nom}</span> — {plan.audit.client}
                    </p>
                )}
                {plan.mesure && (
                    <p className="text-xs text-gray-400 mt-0.5">
                        Mesure : {plan.mesure.code} — {plan.mesure.description}
                    </p>
                )}
                {plan.responsable && (
                    <p className="text-xs text-gray-400 mt-0.5">Responsable : {plan.responsable}</p>
                )}
                {plan.delai && (
                    <p className="text-xs text-gray-400">
                        Délai : {new Date(plan.delai).toLocaleDateString('fr-FR')}
                    </p>
                )}
            </div>
            <ActionButtons onValider={onValider} onRejeter={onRejeter} saving={saving} />
        </div>
    );
};

// ── Page principale ───────────────────────────────────────────────────────────

const ValidationPage = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('audits');
    const [audits, setAudits] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rejetTarget, setRejetTarget] = useState(null); // { type, id, auditId }
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

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-sm text-gray-400">Chargement...</div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-sm text-red-500">Erreur : {error}</div>
    );

    return (
        <div className="flex flex-col h-full">
            {/* ── Barre d'onglets ── */}
            <div className="px-6 pt-6 pb-0 border-b border-gray-100 flex-shrink-0">
                <p className="text-xs text-gray-500 mb-4">
                    {total === 0
                        ? 'Aucun élément en attente de décision'
                        : `${total} élément${total > 1 ? 's' : ''} en attente de décision`}
                </p>
                <div className="flex gap-0">
                    {TABS.map(t => {
                        const count = t.id === 'audits' ? pendingAudits : pendingPlans;
                        const active = tab === t.id;
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${active ? 'border-b-[var(--brand-red)] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                style={active ? { borderBottomColor: 'var(--brand-red)' } : {}}>
                                {t.label}
                                {count > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white leading-none"
                                        style={{ backgroundColor: 'var(--brand-red)' }}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Contenu ── */}
            <div className="flex-1 overflow-y-auto p-6">
                {tab === 'audits' && (
                    audits.length === 0
                        ? <EmptyState label="Aucun audit en attente de validation" />
                        : (
                            <div className="space-y-3 max-w-4xl">
                                {audits.map(a => (
                                    <AuditCard key={a.id} audit={a}
                                        onNavigate={() => navigate(`/audits/${a.id}`)}
                                        onValider={() => handleValiderAudit(a.id)}
                                        onRejeter={() => openRejet('audit', a.id)}
                                        saving={saving} />
                                ))}
                            </div>
                        )
                )}

                {tab === 'plans' && (
                    plans.length === 0
                        ? <EmptyState label="Aucun plan d'action en attente de validation" />
                        : (
                            <div className="space-y-3 max-w-4xl">
                                {plans.map(p => (
                                    <PlanCard key={p.id} plan={p}
                                        onNavigate={() => navigate(`/audits/${p.audit_id}`)}
                                        onValider={() => handleValiderPlan(p.audit_id, p.id)}
                                        onRejeter={() => openRejet('plan', p.id, p.audit_id)}
                                        saving={saving} />
                                ))}
                            </div>
                        )
                )}
            </div>

            {/* ── Modal de rejet ── */}
            {rejetTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Motif de rejet</h3>
                        <p className="text-xs text-gray-500 mb-4">Ce commentaire sera transmis à l'équipe concernée.</p>
                        <textarea value={rejetComment} onChange={e => setRejetComment(e.target.value)}
                            rows={4} placeholder="Expliquez la raison du rejet..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-red-300" />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setRejetTarget(null)}
                                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                                Annuler
                            </button>
                            <button onClick={handleRejeter} disabled={!rejetComment.trim() || saving}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                {saving ? 'Rejet...' : 'Rejeter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValidationPage;
