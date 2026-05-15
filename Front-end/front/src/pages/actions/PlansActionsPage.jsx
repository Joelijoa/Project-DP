import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/auth/AuthContext';
import { getAllPlanActions, updatePlanAction, deletePlanAction, soumettreValidationPlan, validerPlanAction, rejeterPlanAction } from '../../services/endpoints/planActionService';
import { toast } from 'react-toastify';
import RejeterPlanModal from './components/RejeterPlanModal';

const PLAN_VALIDATION_CONFIG = {
    en_attente: { label: 'En attente', bg: 'bg-amber-50',  text: 'text-amber-700' },
    valide:     { label: 'Validé',     bg: 'bg-green-50',  text: 'text-green-700' },
    rejete:     { label: 'Rejeté',     bg: 'bg-red-50',    text: 'text-red-700'   },
};

const PRIORITE_CONFIG = {
    haute:   { label: 'Haute',   bg: 'bg-red-50',   text: 'text-red-700'    },
    moyenne: { label: 'Moyenne', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    basse:   { label: 'Basse',   bg: 'bg-green-50',  text: 'text-green-700'  },
};

const STATUT_CONFIG = {
    a_faire:  { label: 'À faire',  bg: 'bg-gray-100', text: 'text-gray-600' },
    en_cours: { label: 'En cours', bg: 'bg-blue-50',  text: 'text-blue-700' },
    cloture:  { label: 'Clôturé',  bg: 'bg-green-50', text: 'text-green-700' },
};

const PlansActionsPage = () => {
    const { user } = useAuth();
    const isJunior        = user?.role === 'auditeur_junior';
    const isClient        = user?.role === 'client';
    const isSeniorOrAdmin = user?.role === 'admin' || user?.role === 'auditeur_senior';

    const [plans, setPlans]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [filterStatut, setFilterStatut] = useState('');
    const [filterPriorite, setFilterPriorite] = useState('');
    const [search, setSearch]             = useState('');
    const [editingId, setEditingId]       = useState(null);
    const [editForm, setEditForm]         = useState({});
    const [savingId, setSavingId]         = useState(null);
    const [rejetingPlanId, setRejetingPlanId] = useState(null);
    const [openGroups, setOpenGroups]     = useState(new Set());

    const handleUpdateStatut = async (plan, newStatut) => {
        setSavingId(plan.id);
        try {
            const res = await updatePlanAction(plan.audit_id, plan.id, { statut: newStatut });
            setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, ...res.data.plan_action } : p));
        } catch { toast.error('Erreur lors de la mise à jour du statut'); }
        finally { setSavingId(null); }
    };

    const load = async () => {
        try {
            const res = await getAllPlanActions();
            const all = res.data.plans_actions || [];
            const visible = isJunior
                ? all.filter(p => p.audit?.auditeurs?.some(au => au.id === user.id))
                : all;
            setPlans(visible);
            // Tout déplier par défaut
            const ids = new Set(visible.map(p => p.audit_id));
            setOpenGroups(ids);
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || 'Erreur réseau');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // ── Filtrage ───────────────────────────────────────────────────────────────

    const filtered = useMemo(() => plans.filter(p => {
        if (filterStatut    && p.statut    !== filterStatut)    return false;
        if (filterPriorite  && p.priorite  !== filterPriorite)  return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                p.mesure?.code?.toLowerCase().includes(q) ||
                p.action_corrective?.toLowerCase().includes(q) ||
                p.responsable?.toLowerCase().includes(q) ||
                p.audit?.nom?.toLowerCase().includes(q) ||
                p.audit?.client?.toLowerCase().includes(q)
            );
        }
        return true;
    }), [plans, filterStatut, filterPriorite, search]);

    // ── Groupement par audit ───────────────────────────────────────────────────

    const groups = useMemo(() => {
        const map = {};
        filtered.forEach(p => {
            if (!map[p.audit_id]) map[p.audit_id] = { audit: p.audit, auditId: p.audit_id, plans: [] };
            map[p.audit_id].plans.push(p);
        });
        return Object.values(map);
    }, [filtered]);

    const allOpen   = groups.every(g => openGroups.has(g.auditId));
    const toggleAll = () => {
        if (allOpen) setOpenGroups(new Set());
        else setOpenGroups(new Set(groups.map(g => g.auditId)));
    };
    const toggleGroup = (id) => setOpenGroups(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    // ── Stats globales ─────────────────────────────────────────────────────────

    const stats = {
        total:    plans.length,
        a_faire:  plans.filter(p => p.statut === 'a_faire').length,
        en_cours: plans.filter(p => p.statut === 'en_cours').length,
        cloture:  plans.filter(p => p.statut === 'cloture').length,
    };

    // ── Actions ────────────────────────────────────────────────────────────────

    const startEdit = (plan) => {
        setEditingId(plan.id);
        setEditForm({
            statut:            plan.statut            || 'a_faire',
            priorite:          plan.priorite          || 'moyenne',
            responsable:       plan.responsable       || '',
            delai:             plan.delai             || '',
            action_corrective: plan.action_corrective || '',
        });
    };
    const cancelEdit = () => { setEditingId(null); setEditForm({}); };

    const saveEdit = async (plan) => {
        setSavingId(plan.id);
        try {
            const res = await updatePlanAction(plan.audit_id, plan.id, editForm);
            setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, ...res.data.plan_action } : p));
            setEditingId(null);
            toast.success('Action mise à jour');
        } catch { toast.error('Erreur lors de la mise à jour'); }
        finally { setSavingId(null); }
    };

    const handleSoumettre = async (plan) => {
        try { await soumettreValidationPlan(plan.audit_id, plan.id); await load(); toast.success("Plan soumis pour validation."); }
        catch { toast.error('Erreur lors de la soumission.'); }
    };

    const handleValider = async (plan) => {
        try { await validerPlanAction(plan.audit_id, plan.id); await load(); toast.success("Plan validé."); }
        catch { toast.error('Erreur lors de la validation.'); }
    };

    const handleRejeter = async (plan, commentaire) => {
        setRejetingPlanId(null);
        try { await rejeterPlanAction(plan.audit_id, plan.id, commentaire); await load(); toast.success("Plan rejeté."); }
        catch { toast.error('Erreur lors du rejet.'); }
    };

    const handleDelete = async (plan) => {
        if (!window.confirm('Supprimer cette action corrective ?')) return;
        try {
            await deletePlanAction(plan.audit_id, plan.id);
            setPlans(prev => prev.filter(p => p.id !== plan.id));
            toast.success('Action supprimée');
        } catch { toast.error('Erreur lors de la suppression'); }
    };

    // ── Rendu ──────────────────────────────────────────────────────────────────

    return (
        <div>
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Plans d'actions</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {isClient  ? 'Actions correctives à mettre en œuvre dans votre organisation'
                        : isJunior ? 'Actions correctives de vos audits assignés'
                        : 'Suivi de toutes les actions correctives'}
                    </p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total',    value: stats.total,    color: '#111827' },
                    { label: 'À faire',  value: stats.a_faire,  color: '#6B7280' },
                    { label: 'En cours', value: stats.en_cours, color: '#1D4ED8' },
                    { label: 'Clôturés', value: stats.cloture,  color: '#16a34a' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>
                            {loading ? '—' : kpi.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
                <input type="text" placeholder="Rechercher..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-48 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
                    <option value="">Tous les statuts</option>
                    <option value="a_faire">À faire</option>
                    <option value="en_cours">En cours</option>
                    <option value="cloture">Clôturé</option>
                </select>
                <select value={filterPriorite} onChange={e => setFilterPriorite(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
                    <option value="">Toutes priorités</option>
                    <option value="haute">Haute</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="basse">Basse</option>
                </select>
                {(filterStatut || filterPriorite || search) && (
                    <button onClick={() => { setFilterStatut(''); setFilterPriorite(''); setSearch(''); }}
                        className="text-sm text-gray-500 hover:text-gray-700 px-2">
                        Réinitialiser
                    </button>
                )}
            </div>

            {/* Contenu */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                </div>
            ) : groups.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
                    <p className="text-sm text-gray-500">Aucune action trouvée</p>
                    <p className="text-xs text-gray-400 mt-1">Les actions correctives sont créées depuis le détail d'un audit</p>
                    <Link to="/audits" className="mt-3 inline-block text-xs text-blue-600 hover:text-blue-800">
                        Accéder aux audits →
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Tout déplier / réduire */}
                    <div className="flex justify-end">
                        <button onClick={toggleAll}
                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition">
                            <svg className={`w-3.5 h-3.5 transition-transform ${allOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                            {allOpen ? 'Tout réduire' : 'Tout déplier'}
                        </button>
                    </div>

                    {groups.map(({ audit, auditId, plans: groupPlans }) => {
                        const isOpen = openGroups.has(auditId);
                        const gStats = {
                            a_faire:  groupPlans.filter(p => p.statut === 'a_faire').length,
                            en_cours: groupPlans.filter(p => p.statut === 'en_cours').length,
                            cloture:  groupPlans.filter(p => p.statut === 'cloture').length,
                        };
                        const hasHaute = groupPlans.some(p => p.priorite === 'haute' && p.statut !== 'cloture');

                        return (
                            <div key={auditId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                                {/* ── En-tête du groupe ── */}
                                <button onClick={() => toggleGroup(auditId)}
                                    className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition text-left">
                                    {/* Chevron */}
                                    <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>

                                    {/* Nom de l'audit */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link to={`/audits/${auditId}`}
                                                onClick={e => e.stopPropagation()}
                                                className="text-sm font-semibold text-gray-800 hover:text-red-600 hover:underline transition truncate">
                                                {audit?.nom || `Audit #${auditId}`}
                                            </Link>
                                            {audit?.referentiel?.nom && (
                                                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 flex-shrink-0">
                                                    {audit.referentiel.nom}
                                                </span>
                                            )}
                                            {hasHaute && (
                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600 flex-shrink-0">
                                                    priorité haute
                                                </span>
                                            )}
                                        </div>
                                        {audit?.client && (
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{audit.client}</p>
                                        )}
                                    </div>

                                    {/* Mini stats */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs font-semibold text-gray-500">{groupPlans.length} action{groupPlans.length > 1 ? 's' : ''}</span>
                                        <div className="flex items-center gap-1.5">
                                            {gStats.a_faire  > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{gStats.a_faire} à faire</span>}
                                            {gStats.en_cours > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{gStats.en_cours} en cours</span>}
                                            {gStats.cloture  > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 font-medium">{gStats.cloture} clôturé{gStats.cloture > 1 ? 's' : ''}</span>}
                                        </div>
                                    </div>
                                </button>

                                {/* ── Table des plans ── */}
                                {isOpen && (
                                    <div className="border-t border-gray-100 overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-100">
                                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mesure</th>
                                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action corrective</th>
                                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsable</th>
                                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Délai</th>
                                                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priorité</th>
                                                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                                    {!isClient && <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Validation</th>}
                                                    {!isJunior && !isClient && <th className="px-4 py-2.5" />}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {groupPlans.map(plan => {
                                                    const isEditing = editingId === plan.id;
                                                    const pr = PRIORITE_CONFIG[plan.priorite] ?? PRIORITE_CONFIG.moyenne;
                                                    const st = STATUT_CONFIG[plan.statut]     ?? STATUT_CONFIG.a_faire;

                                                    return (
                                                        <tr key={plan.id} className={`hover:bg-gray-50/40 ${isEditing ? 'bg-blue-50/30' : ''}`}>
                                                            <td className="px-4 py-3">
                                                                <span className="font-mono text-xs text-gray-700 font-semibold">{plan.mesure?.code || '—'}</span>
                                                            </td>
                                                            <td className="px-4 py-3 max-w-xs">
                                                                {isEditing ? (
                                                                    <textarea value={editForm.action_corrective}
                                                                        onChange={e => setEditForm(p => ({ ...p, action_corrective: e.target.value }))}
                                                                        rows={2} className="w-full text-xs border border-gray-200 rounded px-2 py-1 resize-none focus:outline-none" />
                                                                ) : (
                                                                    <p className="text-xs text-gray-700 line-clamp-2">
                                                                        {plan.action_corrective || plan.description_nc || '—'}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {isEditing ? (
                                                                    <input type="text" value={editForm.responsable}
                                                                        onChange={e => setEditForm(p => ({ ...p, responsable: e.target.value }))}
                                                                        className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none" />
                                                                ) : (
                                                                    <span className="text-xs text-gray-600">{plan.responsable || '—'}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {isEditing ? (
                                                                    <input type="date" value={editForm.delai}
                                                                        onChange={e => setEditForm(p => ({ ...p, delai: e.target.value }))}
                                                                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none" />
                                                                ) : (
                                                                    <span className="text-xs text-gray-600">
                                                                        {plan.delai ? new Date(plan.delai).toLocaleDateString('fr-FR') : '—'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {isEditing ? (
                                                                    <select value={editForm.priorite}
                                                                        onChange={e => setEditForm(p => ({ ...p, priorite: e.target.value }))}
                                                                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none">
                                                                        <option value="basse">Basse</option>
                                                                        <option value="moyenne">Moyenne</option>
                                                                        <option value="haute">Haute</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${pr.bg} ${pr.text}`}>{pr.label}</span>
                                                                )}
                                                            </td>
                                                            {/* Statut — client : select direct, autres : inline edit */}
                                                            <td className="px-4 py-3 text-center">
                                                                {isClient ? (
                                                                    <select
                                                                        value={plan.statut}
                                                                        disabled={savingId === plan.id}
                                                                        onChange={e => handleUpdateStatut(plan, e.target.value)}
                                                                        className={`text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none transition ${savingId === plan.id ? 'opacity-50' : ''}`}>
                                                                        <option value="a_faire">À faire</option>
                                                                        <option value="en_cours">En cours</option>
                                                                        <option value="cloture">Clôturé</option>
                                                                    </select>
                                                                ) : isEditing ? (
                                                                    <select value={editForm.statut}
                                                                        onChange={e => setEditForm(p => ({ ...p, statut: e.target.value }))}
                                                                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none">
                                                                        <option value="a_faire">À faire</option>
                                                                        <option value="en_cours">En cours</option>
                                                                        <option value="cloture">Clôturé</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                                                                )}
                                                            </td>

                                                            {/* Validation — masqué pour client */}
                                                            {!isClient && (
                                                                <td className="px-4 py-3 text-center">
                                                                    <div className="flex items-center justify-center gap-1 flex-wrap">
                                                                        {(() => {
                                                                            const vc = PLAN_VALIDATION_CONFIG[plan.statut_validation];
                                                                            return vc
                                                                                ? <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${vc.bg} ${vc.text}`}>{vc.label}</span>
                                                                                : <span className="text-gray-400 text-xs">—</span>;
                                                                        })()}
                                                                        {isJunior && plan.statut_validation !== 'en_attente' && plan.statut_validation !== 'valide' && (
                                                                            <button onClick={() => handleSoumettre(plan)}
                                                                                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium">
                                                                                Soumettre
                                                                            </button>
                                                                        )}
                                                                        {isSeniorOrAdmin && plan.statut_validation === 'en_attente' && (
                                                                            <>
                                                                                <button onClick={() => handleValider(plan)}
                                                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 font-medium">✓</button>
                                                                                <button onClick={() => setRejetingPlanId(plan.id)}
                                                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium">✕</button>
                                                                            </>
                                                                        )}
                                                                        {plan.commentaire_rejet && (
                                                                            <span title={plan.commentaire_rejet} className="cursor-help text-red-400">
                                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                                                                </svg>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            )}

                                                            {/* Actions modifier/supprimer — masquées pour client et junior */}
                                                            {!isJunior && !isClient && (
                                                                <td className="px-4 py-3">
                                                                    {isEditing ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <button onClick={() => saveEdit(plan)} disabled={savingId === plan.id}
                                                                                className="px-2.5 py-1 text-xs font-medium text-white rounded disabled:opacity-60"
                                                                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                                                                {savingId === plan.id ? '...' : 'OK'}
                                                                            </button>
                                                                            <button onClick={cancelEdit}
                                                                                className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200">
                                                                                Annuler
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1">
                                                                            <button onClick={() => startEdit(plan)}
                                                                                className="p-1 text-gray-400 hover:text-blue-600 rounded" title="Modifier">
                                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                                                </svg>
                                                                            </button>
                                                                            <button onClick={() => handleDelete(plan)}
                                                                                className="p-1 text-gray-400 hover:text-red-600 rounded" title="Supprimer">
                                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {rejetingPlanId && (
                <RejeterPlanModal
                    onConfirm={(commentaire) => handleRejeter(plans.find(p => p.id === rejetingPlanId), commentaire)}
                    onCancel={() => setRejetingPlanId(null)}
                />
            )}
        </div>
    );
};

export default PlansActionsPage;
