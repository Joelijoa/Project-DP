import { useState } from 'react';
import { PRIORITE_CONFIG, STATUT_PLAN_CONFIG, PLAN_VALIDATION_CONFIG } from './auditConstants';
import { TabInfo } from './AuditBadges';
import AppSelect from '../../../components/common/AppSelect';
import { exportPlanActionsPDF } from '../../../utils/exportPlanActionsPDF';

const emptyPlanForm = { mesure_id: '', description_nc: '', action_corrective: '', responsable: '', delai: '', priorite: 'moyenne', statut: 'a_faire', kpi: '' };

const TabPlanActions = ({ referentiel, planActions, localEvals, soaMap, isISO, user, onAdd, onBulkAdd, onUpdate, onDelete, onSoumettre, onValider, onRejeter, readOnly, auditNom, clientNom }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...emptyPlanForm });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [generating, setGenerating] = useState(false);
    const [showGenConfirm, setShowGenConfirm] = useState(false);
    const [viewingPlan, setViewingPlan] = useState(null);
    const [filterPriorite, setFilterPriorite] = useState('all');
    const [clientEditPlan, setClientEditPlan] = useState(null);
    const [clientEditForm, setClientEditForm] = useState({ responsable: '', delai: '' });
    const [clientEditSubmitting, setClientEditSubmitting] = useState(false);

    const isClient = user?.role === 'client';

    const openClientEdit = (plan) => {
        setClientEditForm({ responsable: plan.responsable || '', delai: plan.delai || '' });
        setClientEditPlan(plan);
    };
    const handleClientEditSubmit = async (e) => {
        e.preventDefault();
        setClientEditSubmitting(true);
        try {
            await onUpdate(clientEditPlan.id, { responsable: clientEditForm.responsable, delai: clientEditForm.delai });
            setClientEditPlan(null);
        } finally {
            setClientEditSubmitting(false);
        }
    };

    const setF = (k, v) => {
        setForm(p => ({ ...p, [k]: v }));
        if (errors[k]) setErrors(p => ({ ...p, [k]: false }));
    };

    const resetForm = () => { setForm({ ...emptyPlanForm }); setEditingId(null); setErrors({}); };

    const handleEdit = (plan) => {
        setForm({
            mesure_id: plan.mesure_id || '',
            description_nc: plan.description_nc || '',
            action_corrective: plan.action_corrective || '',
            responsable: plan.responsable || '',
            delai: plan.delai || '',
            priorite: plan.priorite || 'moyenne',
            statut: plan.statut || 'a_faire',
            kpi: plan.kpi || '',
        });
        setEditingId(plan.id);
        setErrors({});
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!editingId && !form.mesure_id) newErrors.mesure_id = true;
        if (!form.action_corrective?.trim()) newErrors.action_corrective = true;
        if (!form.responsable?.trim()) newErrors.responsable = true;
        if (!form.delai) newErrors.delai = true;
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setSubmitting(true);
        try {
            if (editingId) {
                await onUpdate(editingId, form);
            } else {
                await onAdd(form);
            }
            setShowForm(false);
            resetForm();
        } finally {
            setSubmitting(false);
        }
    };

    const allMesures = referentiel?.domaines?.flatMap(d => d.objectifs?.flatMap(o => o.mesures ?? []) ?? []) ?? [];

    // Map mesure_id → code du domaine parent (pour distinguer §4-10 vs Annexe A)
    const mesureDomainCode = {};
    referentiel?.domaines?.forEach(d => {
        d.objectifs?.forEach(o => o.mesures?.forEach(m => { mesureDomainCode[m.id] = d.code; }));
    });

    const isNCMesure = (m) => {
        const n = localEvals[m.id]?.niveau_maturite;
        if (n === null || n === undefined) return false;
        if (!isISO) return n <= 1;
        const domCode = mesureDomainCode[m.id] ?? '';
        if (domCode.startsWith('A.')) return soaMap[m.id]?.applicable === true && (n === 0 || n === 2);
        return n === 0 || n === 2;
    };

    // Inclut les partiels (CMM niveaux 2-3) en plus des NC
    const needsActionPlan = (m) => {
        const n = localEvals[m.id]?.niveau_maturite;
        if (n === null || n === undefined) return false;
        if (!isISO) return n <= 3; // NC (0-1) + Partiel (2-3)
        const domCode = mesureDomainCode[m.id] ?? '';
        if (domCode.startsWith('A.')) return soaMap[m.id]?.applicable === true && (n === 0 || n === 2);
        return n === 0 || n === 2;
    };

    const getPriorite = (m) => {
        const n = localEvals[m.id]?.niveau_maturite;
        if (!isISO) {
            if (n <= 1) return 'haute';
            return 'basse'; // partiel
        }
        return n === 0 ? 'haute' : 'moyenne'; // NC majeure vs NC mineure
    };

    // Mesures non conformes (pour mettre en évidence dans le dropdown)
    const nonConfIds = new Set(allMesures.filter(isNCMesure).map(m => m.id));

    // Mesures NC avec recommandation sans plan d'action existant
    const existingMesureIds = new Set(planActions.map(p => Number(p.mesure_id)));
    const toGenerate = allMesures.filter(m =>
        needsActionPlan(m) &&
        !existingMesureIds.has(Number(m.id)) &&
        !!localEvals[m.id]?.recommandation?.trim()
    );

    const handleGenerate = async () => {
        setShowGenConfirm(false);
        setGenerating(true);
        try {
            const dataList = toGenerate.map(m => ({
                mesure_id: m.id,
                description_nc: localEvals[m.id]?.commentaire || '',
                action_corrective: localEvals[m.id]?.recommandation,
                responsable: '',
                delai: null,
                priorite: getPriorite(m),
                statut: 'a_faire',
                kpi: '',
            }));
            await onBulkAdd(dataList);
        } finally {
            setGenerating(false);
        }
    };

    const PRIORITE_ORDER = { haute: 0, moyenne: 1, basse: 2 };
    const filteredPlans = planActions
        .filter(p => filterPriorite === 'all' || p.priorite === filterPriorite)
        .sort((a, b) => (PRIORITE_ORDER[a.priorite] ?? 1) - (PRIORITE_ORDER[b.priorite] ?? 1));

    return (
        <div className="space-y-4">
            <TabInfo text="Définissez les actions correctives pour traiter les non-conformités identifiées lors de l'évaluation. Chaque action est associée à une mesure, un responsable, un délai et une priorité de traitement." />

            {/* Barre d'action */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-gray-600">{planActions.length} action(s) définie(s)</span>
                    {planActions.length > 0 && (
                        <button
                            onClick={() => exportPlanActionsPDF({ plans: planActions, auditNom, clientNom, referentiel })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Exporter PDF
                        </button>
                    )}
                    {nonConfIds.size > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-50 text-red-700">
                            {nonConfIds.size} mesure(s) NC
                        </span>
                    )}
                    {/* Filtre priorité */}
                    <div className="flex items-center gap-1">
                        {[
                            { key: 'all', label: 'Toutes' },
                            { key: 'haute', label: 'Haute', bg: 'bg-red-50', text: 'text-red-700', activeBg: 'bg-red-600' },
                            { key: 'moyenne', label: 'Moyenne', bg: 'bg-orange-50', text: 'text-orange-700', activeBg: 'bg-orange-500' },
                            { key: 'basse', label: 'Basse', bg: 'bg-blue-50', text: 'text-blue-700', activeBg: 'bg-blue-500' },
                        ].map(({ key, label, activeBg }) => (
                            <button key={key} onClick={() => setFilterPriorite(key)}
                                className={`px-2.5 py-0.5 rounded text-xs font-medium transition ${filterPriorite === key
                                    ? `${activeBg ?? 'bg-gray-700'} text-white`
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                {!readOnly && (
                    <div className="flex items-center gap-2">
                        {toGenerate.length > 0 && (
                            <button
                                onClick={() => setShowGenConfirm(v => !v)}
                                disabled={generating}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 transition disabled:opacity-60"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                                Générer depuis les recommandations ({toGenerate.length})
                            </button>
                        )}
                        <button onClick={() => { resetForm(); setShowForm(true); setShowGenConfirm(false); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-xl transition"
                            style={{ backgroundColor: 'var(--brand-red)' }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Ajouter une action
                        </button>
                    </div>
                )}
            </div>

            {/* Panneau de confirmation génération */}
            {showGenConfirm && !readOnly && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-orange-800">
                                {toGenerate.length} action(s) seront créées automatiquement
                            </p>
                            <p className="text-xs text-orange-600 mt-0.5">
                                Depuis les recommandations des mesures NC sans plan d'action existant. Le responsable et le délai sont à compléter ensuite.
                            </p>
                        </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 border border-orange-200 rounded-xl bg-white p-2">
                        {toGenerate.map(m => {
                            const ev = localEvals[m.id];
                            const isMAJ = ev?.niveau_maturite === 0;
                            return (
                                <div key={m.id} className="flex items-start gap-2 text-xs">
                                    <span className="font-mono text-gray-500 flex-shrink-0 w-24">{m.code}</span>
                                    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded font-medium ${isMAJ ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                                        {isISO ? (isMAJ ? 'NC maj.' : 'NC min.') : 'NC'}
                                    </span>
                                    <span className="text-gray-600 truncate">{ev?.recommandation}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleGenerate} disabled={generating}
                            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white rounded-xl disabled:opacity-60 transition"
                            style={{ backgroundColor: '#d97706' }}>
                            {generating && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Confirmer la génération
                        </button>
                        <button onClick={() => setShowGenConfirm(false)}
                            className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Formulaire — Modal popup */}
            {showForm && !readOnly && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); resetForm(); } }}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-800">
                                {editingId ? "Modifier l'action corrective" : 'Nouvelle action corrective'}
                            </h3>
                            <button onClick={() => { setShowForm(false); resetForm(); }}
                                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                            {!editingId && (
                                <div>
                                    <label className={`text-xs font-semibold uppercase tracking-wider ${errors.mesure_id ? 'text-red-500' : 'text-gray-500'}`}>
                                        Mesure / Contrôle *
                                    </label>
                                    <select value={form.mesure_id} onChange={e => setF('mesure_id', e.target.value)}
                                        className={`w-full mt-1 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-1 border ${errors.mesure_id ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`}>
                                        <option value="">— Sélectionner une mesure —</option>
                                        {allMesures.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {nonConfIds.has(m.id) ? '⚠ ' : ''}{m.code} — {m.description?.substring(0, 70)}{m.description?.length > 70 ? '…' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.mesure_id && <p className="mt-1 text-xs text-red-500">Veuillez sélectionner une mesure.</p>}
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description de la non-conformité</label>
                                <textarea value={form.description_nc} onChange={e => setF('description_nc', e.target.value)}
                                    rows={2} placeholder="Décrivez la non-conformité observée..."
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1" />
                            </div>

                            <div>
                                <label className={`text-xs font-semibold uppercase tracking-wider ${errors.action_corrective ? 'text-red-500' : 'text-gray-500'}`}>
                                    Action corrective *
                                </label>
                                <textarea value={form.action_corrective} onChange={e => setF('action_corrective', e.target.value)}
                                    rows={2} placeholder="Décrivez l'action à mettre en place..."
                                    className={`w-full mt-1 text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 border ${errors.action_corrective ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} />
                                {errors.action_corrective && <p className="mt-1 text-xs text-red-500">Ce champ est requis.</p>}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={`text-xs font-semibold uppercase tracking-wider ${errors.responsable ? 'text-red-500' : 'text-gray-500'}`}>
                                        Responsable *
                                    </label>
                                    <input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)}
                                        placeholder="Nom..."
                                        className={`w-full mt-1 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-1 border ${errors.responsable ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} />
                                    {errors.responsable && <p className="mt-1 text-xs text-red-500">Requis.</p>}
                                </div>
                                <div>
                                    <label className={`text-xs font-semibold uppercase tracking-wider ${errors.delai ? 'text-red-500' : 'text-gray-500'}`}>
                                        Délai *
                                    </label>
                                    <input type="date" value={form.delai} onChange={e => setF('delai', e.target.value)}
                                        className={`w-full mt-1 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-1 border ${errors.delai ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} />
                                    {errors.delai && <p className="mt-1 text-xs text-red-500">Requis.</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priorité</label>
                                    <AppSelect
                                        value={form.priorite}
                                        onChange={v => setF('priorite', v)}
                                        options={[
                                            { value: 'basse', label: 'Basse' },
                                            { value: 'moyenne', label: 'Moyenne' },
                                            { value: 'haute', label: 'Haute' },
                                        ]}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            {editingId && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</label>
                                    <AppSelect
                                        value={form.statut}
                                        onChange={v => setF('statut', v)}
                                        options={[
                                            { value: 'a_faire', label: 'À faire' },
                                            { value: 'en_cours', label: 'En cours' },
                                            { value: 'cloture', label: 'Clôturé' },
                                        ]}
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KPI de suivi (optionnel)</label>
                                <input type="text" value={form.kpi} onChange={e => setF('kpi', e.target.value)}
                                    placeholder="Ex : Taux de couverture antivirus"
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1" />
                            </div>

                            {/* Footer */}
                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                                <button type="submit" disabled={submitting}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60"
                                    style={{ backgroundColor: 'var(--brand-red)' }}>
                                    {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {editingId ? 'Enregistrer' : "Créer l'action"}
                                </button>
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tableau */}
            {planActions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-500">Aucune action corrective définie</p>
                    <p className="text-xs text-gray-400 mt-1">Ajoutez des actions pour traiter les non-conformités identifiées</p>
                </div>
            ) : filteredPlans.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <p className="text-sm text-gray-500">Aucune action avec cette priorité</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Mesure</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Action corrective</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Responsable</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Délai</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Priorité</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500 uppercase tracking-wider">Validation</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredPlans.map(plan => {
                                const pr = PRIORITE_CONFIG[plan.priorite] ?? PRIORITE_CONFIG.moyenne;
                                const st = STATUT_PLAN_CONFIG[plan.statut] ?? STATUT_PLAN_CONFIG.a_faire;
                                return (
                                    <tr key={plan.id} className="hover:bg-gray-50/40">
                                        <td className="px-4 py-3">
                                            <span className="font-mono font-semibold text-gray-600">{plan.mesure?.code || `#${plan.mesure_id}`}</span>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <p className="text-gray-700 line-clamp-2">{plan.action_corrective || plan.description_nc || '—'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{plan.responsable || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {plan.delai ? new Date(plan.delai).toLocaleDateString('fr-FR') : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded font-medium ${pr.bg} ${pr.text}`}>{pr.label}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {(() => {
                                                const vc = PLAN_VALIDATION_CONFIG[plan.statut_validation];
                                                const isJuniorUser = user?.role === 'auditeur_junior';
                                                const isSeniorAdminUser = user?.role === 'admin' || user?.role === 'auditeur_senior';
                                                return (
                                                    <div className="flex items-center justify-center gap-1 flex-wrap">
                                                        {vc
                                                            ? <span className={`inline-flex px-2 py-0.5 rounded font-medium ${vc.bg} ${vc.text}`}>{vc.label}</span>
                                                            : <span className="text-gray-400 text-xs">—</span>
                                                        }
                                                        {!readOnly && isJuniorUser && plan.created_by === user?.id && plan.statut_validation !== 'en_attente' && plan.statut_validation !== 'valide' && (
                                                            <button onClick={() => onSoumettre(plan.id)}
                                                                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium">
                                                                Soumettre
                                                            </button>
                                                        )}
                                                        {!readOnly && isSeniorAdminUser && plan.statut_validation === 'en_attente' && (
                                                            <>
                                                                <button onClick={() => onValider(plan.id)}
                                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 font-medium">✓</button>
                                                                <button onClick={() => onRejeter(plan.id)}
                                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium">✕</button>
                                                            </>
                                                        )}
                                                        {plan.commentaire_rejet && (
                                                            <span title={plan.commentaire_rejet} className="cursor-help text-red-400">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setViewingPlan(plan)}
                                                    className="p-1 text-gray-400 hover:text-indigo-600 rounded" title="Visualiser">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </button>
                                                {isClient && (
                                                    <button onClick={() => openClientEdit(plan)}
                                                        className="p-1 text-gray-400 hover:text-blue-600 rounded" title="Modifier délai / responsable">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {!readOnly && (
                                                    <>
                                                        <button onClick={() => handleEdit(plan)}
                                                            className="p-1 text-gray-400 hover:text-blue-600 rounded" title="Modifier">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => { if (window.confirm('Supprimer cette action ?')) onDelete(plan.id); }}
                                                            className="p-1 text-gray-400 hover:text-red-600 rounded" title="Supprimer">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal client : modifier délai + responsable */}
            {clientEditPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) setClientEditPlan(null); }}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-800">Modifier le suivi</h3>
                            <button onClick={() => setClientEditPlan(null)}
                                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleClientEditSubmit} className="px-6 py-5 space-y-4">
                            <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                                <span className="font-mono font-semibold text-gray-700">{clientEditPlan.mesure?.code || `#${clientEditPlan.mesure_id}`}</span>
                                {' — '}{clientEditPlan.action_corrective?.substring(0, 80) || '—'}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsable</label>
                                <input type="text" value={clientEditForm.responsable}
                                    onChange={e => setClientEditForm(p => ({ ...p, responsable: e.target.value }))}
                                    placeholder="Nom du responsable..."
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Délai</label>
                                <input type="date" value={clientEditForm.delai}
                                    onChange={e => setClientEditForm(p => ({ ...p, delai: e.target.value }))}
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1" />
                            </div>
                            <div className="flex gap-2 pt-1 border-t border-gray-100">
                                <button type="submit" disabled={clientEditSubmitting}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60"
                                    style={{ backgroundColor: 'var(--brand-red)' }}>
                                    {clientEditSubmitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Enregistrer
                                </button>
                                <button type="button" onClick={() => setClientEditPlan(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal visualisation plan d'action */}
            {viewingPlan && (() => {
                const pr = PRIORITE_CONFIG[viewingPlan.priorite] ?? PRIORITE_CONFIG.moyenne;
                const st = STATUT_PLAN_CONFIG[viewingPlan.statut] ?? STATUT_PLAN_CONFIG.a_faire;
                const vc = PLAN_VALIDATION_CONFIG[viewingPlan.statut_validation];
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={e => { if (e.target === e.currentTarget) setViewingPlan(null); }}>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-gray-700">{viewingPlan.mesure?.code || `#${viewingPlan.mesure_id}`}</span>
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${pr.bg} ${pr.text}`}>{pr.label}</span>
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                                </div>
                                <button onClick={() => setViewingPlan(null)}
                                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                {viewingPlan.description_nc && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description de la non-conformité</p>
                                        <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2">{viewingPlan.description_nc}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Action corrective</p>
                                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2">{viewingPlan.action_corrective || '—'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Responsable</p>
                                        <p className="text-sm text-gray-700">{viewingPlan.responsable || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Délai</p>
                                        <p className="text-sm text-gray-700">{viewingPlan.delai ? new Date(viewingPlan.delai).toLocaleDateString('fr-FR') : '—'}</p>
                                    </div>
                                </div>
                                {viewingPlan.kpi && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">KPI de suivi</p>
                                        <p className="text-sm text-gray-700">{viewingPlan.kpi}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Validation</p>
                                    {vc
                                        ? <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${vc.bg} ${vc.text}`}>{vc.label}</span>
                                        : <span className="text-sm text-gray-400">Non soumis</span>
                                    }
                                    {viewingPlan.commentaire_rejet && (
                                        <p className="mt-1 text-xs text-red-600 bg-red-50 rounded px-2 py-1">{viewingPlan.commentaire_rejet}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default TabPlanActions;
