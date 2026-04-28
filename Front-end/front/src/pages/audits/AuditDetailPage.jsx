import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAuditById, updateAudit, getEvaluations, saveEvaluations, getSoA, saveSoA, soumettreAudit, validerAudit, rejeterAudit } from '../../services/endpoints/auditService';
import { getPlanActions, createPlanAction, updatePlanAction, deletePlanAction, soumettreValidationPlan, validerPlanAction, rejeterPlanAction } from '../../services/endpoints/planActionService';
import { getReferentielById } from '../../services/endpoints/referentielService';
import { getAllUsers } from '../../services/endpoints/userService';
import DateInput from '../../components/common/DateInput';
import ConfirmModal from '../../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import { useAuth } from '../../store/auth/AuthContext';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const stripNumericPrefix  = (str = '') => str.replace(/^\d+[\.\s\t]+/, '').trim();
const stripObjectifPrefix = (str = '') => str.replace(/^Objectif\s+\d+\s*:\s*/i, '').trim();

// ─── Constantes ────────────────────────────────────────────────────────────────

const NIVEAUX = [
    { value: null,  label: 'N/A',         color: 'text-gray-400' },
    { value: 0,     label: 'Aucun',       color: 'text-red-600' },
    { value: 1,     label: 'Initial',     color: 'text-orange-500' },
    { value: 2,     label: 'Reproductible', color: 'text-yellow-500' },
    { value: 3,     label: 'Défini',      color: 'text-blue-500' },
    { value: 4,     label: 'Maitrisé',    color: 'text-indigo-600' },
    { value: 5,     label: 'Optimisé',    color: 'text-green-600' },
];

const CONFORMITE_CONFIG = {
    conforme:     { label: 'Totale',       bg: 'bg-green-50',  text: 'text-green-700' },
    partiel:      { label: 'Partielle',    bg: 'bg-yellow-50', text: 'text-yellow-700' },
    non_conforme: { label: 'Non conforme', bg: 'bg-red-50',    text: 'text-red-700' },
    na:           { label: 'N/A',          bg: 'bg-gray-100',  text: 'text-gray-500' },
};

const STATUT_CONFIG = {
    brouillon: { label: 'Brouillon', bg: 'bg-gray-100', text: 'text-gray-600' },
    en_cours:  { label: 'En cours',  bg: 'bg-blue-50',  text: 'text-blue-700' },
    termine:   { label: 'Terminé',   bg: 'bg-green-50', text: 'text-green-700' },
    archive:   { label: 'Archivé',   bg: 'bg-yellow-50',text: 'text-yellow-700' },
};

const TABS_DNSSI = [
    { id: 'description',    label: 'Description outil évaluation' },
    { id: 'identification', label: 'Identification entité ou IIV' },
    { id: 'evaluation',     label: 'Évaluation MO DNSSI' },
    { id: 'synthese_mat',   label: 'Synthèse niveau de maturité' },
    { id: 'synthese_conf',  label: 'Synthèse niveau de conformité' },
    { id: 'avancement',     label: "État d'avancement" },
    { id: 'plans_actions',  label: "Plan d'actions" },
    { id: 'indicateurs',    label: 'Indicateurs de la SSI' },
];

const TABS_ISO = [
    { id: 'description',    label: "Description de l'audit" },
    { id: 'identification', label: "Identification de l'organisme" },
    { id: 'soa',            label: "Déclaration d'Applicabilité" },
    { id: 'evaluation_iso', label: 'Évaluation des contrôles' },
    { id: 'plans_actions',  label: "Plan d'actions" },
    { id: 'synthese_iso',   label: 'Synthèse par thème' },
    { id: 'nc',             label: 'Non-conformités' },
    { id: 'indicateurs_iso',label: 'Indicateurs SMSI' },
];

// Raisons d'inclusion ISO 27001
const RAISONS_INCLUSION = [
    { value: 'legal',          label: 'Exigence légale / réglementaire' },
    { value: 'contractuel',    label: 'Exigence contractuelle' },
    { value: 'risque',         label: 'Résultat d\'appréciation des risques' },
    { value: 'bonne_pratique', label: 'Bonne pratique retenue' },
];

const STATUT_IMPL_CONFIG = {
    implemente:     { label: 'Implémenté',          bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
    partiel:        { label: 'Partiellement impl.', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    planifie:       { label: 'Planifié',            bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
    non_implemente: { label: 'Non implémenté',      bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
};

const INDICATEURS_DEF = [
    { key: 'taux_organisation_ssi',    label: "Taux de conformité — Organisation SSI (Objectif 2)", auto: true },
    { key: 'taux_actifs_info',         label: "Taux de conformité — Actifs informationnels (Objectif 7)", auto: true },
    { key: 'budget_ssi_ratio',         label: "Taux de budget consacré aux projets SSI / budget SI", unit: '%' },
    { key: 'journaux_traites',         label: "Taux de plateformes dont les journaux d'événements sont traités", unit: '%' },
    { key: 'incidents_indispo',        label: "Nombre d'incidents induisant l'indisponibilité d'un service", unit: '/an' },
    { key: 'incidents_perte_donnees',  label: "Nombre d'incidents de perte de données sensibles", unit: '/an' },
    { key: 'taux_patch',               label: "Taux d'application de patch et mises à jour", unit: '%' },
    { key: 'freq_sauvegardes',         label: "Fréquence de vérification des sauvegardes", unit: '/an' },
    { key: 'taux_pra',                 label: "Taux de systèmes critiques disposant d'un PRA", unit: '%' },
    { key: 'nb_audits',                label: "Nombre d'audits effectués", unit: '/an' },
    { key: 'taux_sensibilisation',     label: "Taux d'utilisateurs sensibilisés en SSI", unit: '%' },
    { key: 'taux_admins_formes',       label: "Taux d'administrateurs formés en SSI", unit: '%' },
];

const ISO_INDICATEURS_DEF = [
    { key: 'iso_risques_traites',      label: "Nombre de risques identifiés et traités",                unit: '' },
    { key: 'iso_taux_nc',              label: "Taux de non-conformités (contrôles NC / applicables)",   auto: 'nc' },
    { key: 'iso_taux_conf',            label: "Taux de contrôles conformes (Annexe A)",                 auto: 'conf' },
    { key: 'iso_taux_impl',            label: "Taux de contrôles implémentés (SoA)",                    auto: 'impl' },
    { key: 'iso_incidents_smsi',       label: "Nombre d'incidents de sécurité déclarés",                unit: '/an' },
    { key: 'iso_audits_internes',      label: "Nombre d'audits internes réalisés",                      unit: '/an' },
    { key: 'iso_rev_direction',        label: "Nombre de revues de direction réalisées",                unit: '/an' },
    { key: 'iso_taux_sensibilisation', label: "Taux de personnel sensibilisé ISO 27001",                unit: '%' },
    { key: 'iso_actions_clot',         label: "Nombre d'actions correctives clôturées",                 unit: '' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Trie les domaines, objectifs et mesures par id (ordre d'insertion depuis le seed)
const sortReferentiel = (ref) => {
    if (!ref) return ref;
    return {
        ...ref,
        domaines: [...(ref.domaines || [])].sort((a, b) => a.id - b.id).map(d => ({
            ...d,
            objectifs: [...(d.objectifs || [])].sort((a, b) => a.id - b.id).map(o => ({
                ...o,
                mesures: [...(o.mesures || [])].sort((a, b) => a.id - b.id),
            })),
        })),
    };
};

const calcConformite = (niveau) => {
    if (niveau === null || niveau === undefined) return 'na';
    if (niveau <= 1) return 'non_conforme';
    if (niveau <= 3) return 'partiel';
    return 'conforme';
};

const niveauLabel = (v) => NIVEAUX.find(n => n.value === v)?.label ?? 'N/A';

// ─── Sous-composants ───────────────────────────────────────────────────────────

const TabInfo = ({ text }) => (
    <div className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5 text-sm text-gray-600 border border-blue-100 bg-blue-50/40">
        <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="leading-relaxed">{text}</p>
    </div>
);

const ConformiteBadge = ({ conformite }) => {
    const cfg = CONFORMITE_CONFIG[conformite] ?? CONFORMITE_CONFIG.na;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
};

const StatutBadge = ({ statut }) => {
    const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.brouillon;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
};

const VALIDATION_CONFIG = {
    en_attente: { label: 'En attente de validation', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
    valide:     { label: 'Validé',                   bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
    rejete:     { label: 'Rejeté',                   bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'   },
};

const RejeterModal = ({ title, onConfirm, onCancel }) => {
    const [commentaire, setCommentaire] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 mb-4">Ce commentaire sera visible par les auditeurs concernés.</p>
                <textarea
                    value={commentaire}
                    onChange={e => setCommentaire(e.target.value)}
                    rows={4}
                    placeholder="Motif du rejet..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1"
                    autoFocus
                />
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => commentaire.trim() && onConfirm(commentaire.trim())}
                        disabled={!commentaire.trim()}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                        style={{ backgroundColor: '#cc0000' }}>
                        Confirmer le rejet
                    </button>
                    <button onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Page principale ───────────────────────────────────────────────────────────

const AuditDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('description');
    const [audit, setAudit] = useState(null);
    const [referentiel, setReferentiel] = useState(null);
    const [evalMap, setEvalMap] = useState({});   // { mesure_id: evaluation }
    const [localEvals, setLocalEvals] = useState({}); // edits en cours
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [openDomaines, setOpenDomaines] = useState({});
    const [identification, setIdentification] = useState({});
    const [indicateurs, setIndicateurs] = useState({});
    const [savingInfo, setSavingInfo] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    // ISO 27001 — Déclaration d'Applicabilité
    const [soaMap, setSoaMap] = useState({});       // { mesure_id: entry }
    const [soaDirty, setSoaDirty] = useState(false);
    const [savingSoa, setSavingSoa] = useState(false);
    // Plans d'actions
    const [planActions, setPlanActions] = useState([]);
    // Validation workflow
    const [validating, setValidating]           = useState(false);
    const [showRejeterAudit, setShowRejeterAudit] = useState(false);
    const [rejetingPlanId, setRejetingPlanId]   = useState(null);

    // Chargement initial
    useEffect(() => {
        const load = async () => {
            try {
                const [auditRes, evalsRes, usersRes] = await Promise.all([
                    getAuditById(id),
                    getEvaluations(id),
                    user?.role !== 'auditeur_junior' ? getAllUsers() : Promise.resolve({ data: { users: [] } }),
                ]);
                const a = auditRes.data.audit;
                setAudit(a);
                setIdentification(a.identification || {});
                setIndicateurs(a.indicateurs || {});
                setAllUsers(usersRes.data.users || []);

                // Map des évaluations existantes (DNSSI)
                const map = {};
                (evalsRes.data.evaluations || []).forEach(ev => {
                    map[ev.mesure_id] = ev;
                });
                setEvalMap(map);
                setLocalEvals({ ...map });

                // Chargement du référentiel complet (trié par id)
                const refRes = await getReferentielById(a.referentiel_id);
                const sortedRef = sortReferentiel(refRes.data.referentiel);
                setReferentiel(sortedRef);

                // Ouvrir le 1er domaine par défaut
                if (sortedRef?.domaines?.length > 0) {
                    setOpenDomaines({ [sortedRef.domaines[0].id]: true });
                }

                // Chargement SoA si ISO 27001
                if (a.referentiel?.type === 'ISO27001' || refRes.data.referentiel?.type === 'ISO27001') {
                    const soaRes = await getSoA(id);
                    const sm = {};
                    (soaRes.data.soa || []).forEach(e => { sm[e.mesure_id] = e; });
                    setSoaMap(sm);
                }

                // Chargement plans d'actions
                const plansRes = await getPlanActions(id);
                setPlanActions(plansRes.data.plans_actions || []);
            } catch (err) {
                const msg = err?.response?.data?.message || err?.message || 'Erreur réseau';
                toast.error(`Chargement audit: ${msg}`);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    // Mise à jour d'une évaluation locale
    const setEval = (mesureId, field, value) => {
        setLocalEvals(prev => ({
            ...prev,
            [mesureId]: { ...(prev[mesureId] || { mesure_id: mesureId }), [field]: value },
        }));
        setIsDirty(true);
    };

    // Sauvegarde des évaluations
    const handleSaveEvals = async () => {
        setSaving(true);
        try {
            const evals = Object.values(localEvals).map(ev => ({
                mesure_id: ev.mesure_id,
                niveau_maturite: ev.niveau_maturite ?? null,
                commentaire: ev.commentaire || null,
                preuve: ev.preuve || null,
            }));
            await saveEvaluations(id, evals);
            setEvalMap({ ...localEvals });
            setIsDirty(false);
            // Reload audit pour statut à jour
            const res = await getAuditById(id);
            setAudit(res.data.audit);
            toast.success('Évaluations sauvegardées');
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    // Plans d'actions CRUD
    const handleCreatePlanAction = async (data) => {
        try {
            const res = await createPlanAction(id, data);
            setPlanActions(prev => [res.data.plan_action, ...prev]);
            toast.success("Action corrective créée");
        } catch {
            toast.error("Erreur lors de la création");
        }
    };

    const handleUpdatePlanAction = async (planId, data) => {
        try {
            const res = await updatePlanAction(id, planId, data);
            setPlanActions(prev => prev.map(p => p.id === planId ? { ...p, ...res.data.plan_action } : p));
            toast.success("Action mise à jour");
        } catch {
            toast.error("Erreur lors de la mise à jour");
        }
    };

    const handleDeletePlanAction = async (planId) => {
        try {
            await deletePlanAction(id, planId);
            setPlanActions(prev => prev.filter(p => p.id !== planId));
            toast.success("Action supprimée");
        } catch {
            toast.error("Erreur lors de la suppression");
        }
    };

    // ── Validation audit ──────────────────────────────────────────────────────
    const handleSoumettreAudit = async () => {
        setValidating(true);
        try {
            await soumettreAudit(id);
            const res = await getAuditById(id);
            setAudit(res.data.audit);
            toast.success('Audit soumis pour validation.');
        } catch { toast.error('Erreur lors de la soumission.'); }
        finally { setValidating(false); }
    };

    const handleValiderAudit = async () => {
        setValidating(true);
        try {
            await validerAudit(id);
            const res = await getAuditById(id);
            setAudit(res.data.audit);
            toast.success('Audit validé et clôturé.');
        } catch { toast.error('Erreur lors de la validation.'); }
        finally { setValidating(false); }
    };

    const handleRejeterAudit = async (commentaire) => {
        setShowRejeterAudit(false);
        setValidating(true);
        try {
            await rejeterAudit(id, commentaire);
            const res = await getAuditById(id);
            setAudit(res.data.audit);
            toast.success('Audit rejeté.');
        } catch { toast.error('Erreur lors du rejet.'); }
        finally { setValidating(false); }
    };

    // ── Validation plans d'actions ────────────────────────────────────────────
    const refreshPlans = async () => {
        const res = await getPlanActions(id);
        setPlanActions(res.data.plans_actions || []);
    };

    const handleSoumettrePlan = async (planId) => {
        try {
            await soumettreValidationPlan(id, planId);
            await refreshPlans();
            toast.success("Plan d'action soumis pour validation.");
        } catch { toast.error('Erreur lors de la soumission.'); }
    };

    const handleValiderPlan = async (planId) => {
        try {
            await validerPlanAction(id, planId);
            await refreshPlans();
            toast.success("Plan d'action validé.");
        } catch { toast.error('Erreur lors de la validation.'); }
    };

    const handleRejeterPlan = async (planId, commentaire) => {
        setRejetingPlanId(null);
        try {
            await rejeterPlanAction(id, planId, commentaire);
            await refreshPlans();
            toast.success("Plan d'action rejeté.");
        } catch { toast.error('Erreur lors du rejet.'); }
    };

    // Mise à jour d'une entrée SoA (ISO 27001)
    const setSoaEntry = (mesureId, field, value) => {
        setSoaMap(prev => ({
            ...prev,
            [mesureId]: { ...(prev[mesureId] || { mesure_id: mesureId }), [field]: value },
        }));
        setSoaDirty(true);
    };

    // Sauvegarde de la Déclaration d'Applicabilité
    const handleSaveSoA = async () => {
        setSavingSoa(true);
        try {
            const entries = Object.values(soaMap);
            await saveSoA(id, entries);
            setSoaDirty(false);
            const res = await getAuditById(id);
            setAudit(res.data.audit);
            toast.success('Déclaration d\'applicabilité sauvegardée');
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSavingSoa(false);
        }
    };

    // Clôture de l'audit
    const [showClotureModal, setShowClotureModal] = useState(false);
    const [cloturing, setCloturing] = useState(false);

    const handleClotureAudit = async () => {
        setCloturing(true);
        try {
            await updateAudit(id, { statut: 'termine' });
            const res = await getAuditById(id);
            setAudit(res.data.audit);
            toast.success('Audit clôturé avec succès');
        } catch {
            toast.error('Erreur lors de la clôture');
        } finally {
            setCloturing(false);
            setShowClotureModal(false);
        }
    };

    // Sauvegarde des informations de base de l'audit (nom, client, perimetre, dates)
    const handleUpdateAuditInfo = async (data) => {
        setSavingInfo(true);
        try {
            await updateAudit(id, data);
            const res = await getAuditById(id);
            setAudit(res.data.audit);
            toast.success("Informations de l'audit mises à jour");
        } catch {
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setSavingInfo(false);
        }
    };

    // Sauvegarde identification + indicateurs
    const handleSaveInfo = async (field, data) => {
        setSavingInfo(true);
        try {
            await updateAudit(id, { [field]: data });
            if (field === 'identification') setIdentification(data);
            if (field === 'indicateurs') setIndicateurs(data);
            toast.success('Informations sauvegardées');
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSavingInfo(false);
        }
    };

    // Calculs synthèse
    const computeSynthese = useCallback(() => {
        if (!referentiel) return [];
        return referentiel.domaines.map(domaine => {
            const mesures = domaine.objectifs.flatMap(o => o.mesures);
            const total = mesures.length;
            const evaluated = mesures.filter(m => localEvals[m.id]?.niveau_maturite !== null && localEvals[m.id]?.niveau_maturite !== undefined);
            const scores = evaluated.map(m => localEvals[m.id]?.niveau_maturite ?? 0);
            const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

            let conforme = 0, partiel = 0, non_conforme = 0, na = 0;
            mesures.forEach(m => {
                const c = calcConformite(localEvals[m.id]?.niveau_maturite ?? null);
                if (c === 'conforme') conforme++;
                else if (c === 'partiel') partiel++;
                else if (c === 'non_conforme') non_conforme++;
                else na++;
            });
            const applicables = total - na;
            const tauxConformite = applicables > 0 ? Math.round(((conforme + partiel * 0.5) / applicables) * 100) : 0;

            return {
                ...domaine,
                total,
                evaluated: evaluated.length,
                avgScore: Math.round(avgScore * 10) / 10,
                conforme, partiel, non_conforme, na,
                tauxConformite,
                progress: total > 0 ? Math.round((evaluated.length / total) * 100) : 0,
            };
        });
    }, [referentiel, localEvals]);

    const synthese = computeSynthese();

    const totalMesures = synthese.reduce((a, d) => a + d.total, 0);
    const totalEvaluated = synthese.reduce((a, d) => a + d.evaluated, 0);
    const totalConforme = synthese.reduce((a, d) => a + d.conforme, 0);
    const totalPartiel = synthese.reduce((a, d) => a + d.partiel, 0);
    const totalNC = synthese.reduce((a, d) => a + d.non_conforme, 0);
    const tauxGlobal = (totalMesures - synthese.reduce((a, d) => a + d.na, 0)) > 0
        ? Math.round(((totalConforme + totalPartiel * 0.5) / (totalMesures - synthese.reduce((a, d) => a + d.na, 0))) * 100)
        : 0;

    // ── Indicateurs de complétion par onglet (dot orange si non rempli) ──────────
    const identFilled     = Object.values(identification).some(v => v && String(v).trim());
    const isoEvalsDone    = Object.values(localEvals).some(e => e.niveau_maturite !== null && e.niveau_maturite !== undefined);
    const MANUAL_IND_KEYS = INDICATEURS_DEF.filter(i => !i.auto).map(i => i.key);
    const ISO_MANUAL_KEYS = ISO_INDICATEURS_DEF.filter(i => !i.auto).map(i => i.key);
    const tabStatus = {
        identification:  identFilled,
        evaluation:      totalEvaluated > 0,
        soa:             Object.keys(soaMap).length > 0,
        evaluation_iso:  isoEvalsDone,
        plans_actions:   planActions.length > 0,
        indicateurs:     MANUAL_IND_KEYS.some(k => indicateurs[k]),
        indicateurs_iso: ISO_MANUAL_KEYS.some(k => indicateurs[k]),
    };

    const allEvalsISO = (() => {
        if (!referentiel) return false;
        const applicableIds = Object.values(soaMap).filter(e => e.applicable).map(e => e.mesure_id);
        if (applicableIds.length === 0) return false;
        return applicableIds.every(mid => {
            const ev = localEvals[mid];
            return ev && ev.niveau_maturite !== null && ev.niveau_maturite !== undefined;
        });
    })();

    const _isISO = referentiel?.type === 'ISO27001';
    const auditComplete = _isISO
        ? identFilled && Object.keys(soaMap).length > 0 && allEvalsISO
        : identFilled && totalMesures > 0 && totalEvaluated === totalMesures;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
            </div>
        );
    }

    if (!audit) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Audit introuvable</p>
                <Link to="/audits" className="text-sm text-blue-600 mt-2 inline-block">Retour aux audits</Link>
            </div>
        );
    }

    const isISO = referentiel?.type === 'ISO27001';

    const isAssigned       = audit?.auditeurs?.some(a => a.id === user?.id) || audit?.createur?.id === user?.id;
    const canSeeGraphs     = user?.role !== 'auditeur_junior' || isAssigned;
    const isJunior         = user?.role === 'auditeur_junior';
    const isSeniorOrAdmin  = user?.role === 'admin' || user?.role === 'auditeur_senior';
    const canSoumettreAudit = isJunior && isAssigned && audit.statut_validation !== 'en_attente' && audit.statut_validation !== 'valide';
    const canValiderRejeter = isSeniorOrAdmin && audit.statut_validation === 'en_attente';
    const validationCfg     = VALIDATION_CONFIG[audit.statut_validation];

    const GRAPH_TABS = [
        'plans_actions',
        ...(isISO ? ['synthese_iso', 'nc'] : ['synthese_mat', 'synthese_conf', 'avancement']),
    ];
    const tabs = (isISO ? TABS_ISO : TABS_DNSSI).filter(t => canSeeGraphs || !GRAPH_TABS.includes(t.id));

    return (
        <div>
            {/* En-tête */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                    <Link to="/audits" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-semibold text-gray-900">{audit.nom}</h1>
                            <StatutBadge statut={audit.statut} />
                            {validationCfg && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${validationCfg.bg} ${validationCfg.text} ${validationCfg.border}`}>
                                    {validationCfg.label}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{audit.client} — {audit.referentiel?.nom}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{totalEvaluated}/{totalMesures} mesures évaluées</span>
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${totalMesures > 0 ? (totalEvaluated/totalMesures)*100 : 0}%`, backgroundColor: 'var(--brand-red)' }} />
                        </div>
                    </div>
                    {audit.statut !== 'termine' && audit.statut !== 'archive' && auditComplete && !isJunior && (
                        <button
                            onClick={() => setShowClotureModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition hover:opacity-90"
                            style={{ backgroundColor: '#16a34a' }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            Clôturer l'audit
                        </button>
                    )}
                    {canSoumettreAudit && (
                        <button onClick={handleSoumettreAudit} disabled={validating}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: '#d97706' }}>
                            {validating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                            }
                            Soumettre pour validation
                        </button>
                    )}
                    {canValiderRejeter && (
                        <>
                            <button onClick={handleValiderAudit} disabled={validating}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
                                style={{ backgroundColor: '#16a34a' }}>
                                {validating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                }
                                Valider
                            </button>
                            <button onClick={() => setShowRejeterAudit(true)} disabled={validating}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
                                style={{ backgroundColor: '#cc0000' }}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                Rejeter
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Bannière rejet */}
            {audit.statut_validation === 'rejete' && audit.commentaire_rejet && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <div>
                        <p className="text-xs font-semibold text-red-700">Audit rejeté — corrections requises</p>
                        <p className="text-xs text-red-600 mt-0.5">{audit.commentaire_rejet}</p>
                    </div>
                </div>
            )}

            {/* Onglets */}
            <TabNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} tabStatus={tabStatus} />

            {/* Contenu des onglets — communs */}
            {activeTab === 'description' && <TabDescription audit={audit} totalMesures={totalMesures} totalEvaluated={totalEvaluated} tauxGlobal={tauxGlobal} isISO={isISO} onSave={handleUpdateAuditInfo} saving={savingInfo} />}
            {activeTab === 'identification' && <TabIdentification identification={identification} setIdentification={setIdentification} onSave={() => handleSaveInfo('identification', identification)} saving={savingInfo} isISO={isISO} />}

            {/* Onglets DNSSI */}
            {!isISO && activeTab === 'evaluation' && (
                <TabEvaluation
                    referentiel={referentiel}
                    localEvals={localEvals}
                    setEval={setEval}
                    openDomaines={openDomaines}
                    setOpenDomaines={setOpenDomaines}
                    isDirty={isDirty}
                    saving={saving}
                    onSave={handleSaveEvals}
                />
            )}
            {!isISO && activeTab === 'synthese_mat' && canSeeGraphs && <TabSyntheseMaturite synthese={synthese} />}
            {!isISO && activeTab === 'synthese_conf' && canSeeGraphs && <TabSyntheseConformite synthese={synthese} totalConforme={totalConforme} totalPartiel={totalPartiel} totalNC={totalNC} tauxGlobal={tauxGlobal} />}
            {!isISO && activeTab === 'avancement' && canSeeGraphs && <TabAvancement referentiel={referentiel} localEvals={localEvals} synthese={synthese} />}
            {!isISO && activeTab === 'indicateurs' && (
                <TabIndicateurs
                    indicateurs={indicateurs}
                    setIndicateurs={setIndicateurs}
                    synthese={synthese}
                    onSave={() => handleSaveInfo('indicateurs', indicateurs)}
                    saving={savingInfo}
                />
            )}

            {/* Onglets ISO 27001 */}
            {isISO && activeTab === 'soa' && (
                <TabSoA
                    referentiel={referentiel}
                    soaMap={soaMap}
                    setSoaEntry={setSoaEntry}
                    soaDirty={soaDirty}
                    savingSoa={savingSoa}
                    onSave={handleSaveSoA}
                />
            )}
            {isISO && activeTab === 'evaluation_iso' && (
                <TabEvaluationISO
                    referentiel={referentiel}
                    soaMap={soaMap}
                    localEvals={localEvals}
                    setEval={setEval}
                    isDirty={isDirty}
                    saving={saving}
                    onSave={handleSaveEvals}
                />
            )}
            {isISO && activeTab === 'synthese_iso' && canSeeGraphs && <TabSyntheseISO referentiel={referentiel} soaMap={soaMap} localEvals={localEvals} />}
            {isISO && activeTab === 'nc' && canSeeGraphs && <TabNC referentiel={referentiel} soaMap={soaMap} localEvals={localEvals} />}
            {isISO && activeTab === 'indicateurs_iso' && <TabIndicateursISO referentiel={referentiel} soaMap={soaMap} localEvals={localEvals} indicateurs={indicateurs} setIndicateurs={setIndicateurs} onSave={() => handleSaveInfo('indicateurs', indicateurs)} saving={savingInfo} />}

            {/* Plan d'actions — commun DNSSI + ISO */}
            {activeTab === 'plans_actions' && canSeeGraphs && (
                <TabPlanActions
                    referentiel={referentiel}
                    planActions={planActions}
                    localEvals={localEvals}
                    soaMap={soaMap}
                    isISO={isISO}
                    user={user}
                    auditId={id}
                    onAdd={handleCreatePlanAction}
                    onUpdate={handleUpdatePlanAction}
                    onDelete={handleDeletePlanAction}
                    onSoumettre={handleSoumettrePlan}
                    onValider={handleValiderPlan}
                    onRejeter={(planId) => setRejetingPlanId(planId)}
                />
            )}

            <ConfirmModal
                isOpen={showClotureModal}
                title="Clôturer l'audit"
                message={`Êtes-vous sûr de vouloir clôturer l'audit "${audit.nom}" ? Cette action indique que l'audit est terminé. Vous pourrez encore consulter les données mais l'audit sera marqué comme terminé.`}
                confirmLabel={cloturing ? 'Clôture en cours…' : 'Confirmer la clôture'}
                cancelLabel="Annuler"
                danger={false}
                onConfirm={handleClotureAudit}
                onCancel={() => setShowClotureModal(false)}
            />

            {showRejeterAudit && (
                <RejeterModal
                    title="Rejeter l'audit"
                    onConfirm={handleRejeterAudit}
                    onCancel={() => setShowRejeterAudit(false)}
                />
            )}
            {rejetingPlanId && (
                <RejeterModal
                    title="Rejeter le plan d'action"
                    onConfirm={(commentaire) => handleRejeterPlan(rejetingPlanId, commentaire)}
                    onCancel={() => setRejetingPlanId(null)}
                />
            )}
        </div>
    );
};

// ─── Navigation onglets ───────────────────────────────────────────────────────

const TabNav = ({ activeTab, setActiveTab, tabs, tabStatus = {} }) => {
    const navRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft]   = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        const el = navRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    useEffect(() => {
        checkScroll();
        const el = navRef.current;
        if (!el) return;
        el.addEventListener('scroll', checkScroll, { passive: true });
        const ro = new ResizeObserver(checkScroll);
        ro.observe(el);
        return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
    }, []);

    const scroll = (dir) => {
        navRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
    };

    return (
        <div className="relative mb-6 flex items-end gap-1">
            {/* Bouton gauche */}
            <button
                onClick={() => scroll(-1)}
                disabled={!canScrollLeft}
                className="flex-shrink-0 mb-px p-1 rounded-md border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition disabled:opacity-0 disabled:pointer-events-none"
                aria-label="Défiler à gauche"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>

            {/* Fondu gauche */}
            {canScrollLeft && (
                <div className="absolute left-8 top-0 bottom-1 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none z-10" />
            )}

            {/* Liste des onglets */}
            <nav
                ref={navRef}
                className="flex-1 flex gap-1 border-b border-gray-200 overflow-x-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {tabs.map((tab, i) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                            activeTab === tab.id
                                ? 'border-current -mb-px'
                                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                        }`}
                        style={activeTab === tab.id ? { color: 'var(--brand-red)', borderColor: 'var(--brand-red)' } : {}}
                    >
                        <span className="relative flex-shrink-0">
                            <span
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                style={{ backgroundColor: activeTab === tab.id ? 'var(--brand-red)' : '#D1D5DB' }}
                            >
                                {i + 1}
                            </span>
                            {tabStatus[tab.id] === false && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-400 border border-white" />
                            )}
                        </span>
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Fondu droit */}
            {canScrollRight && (
                <div className="absolute right-8 top-0 bottom-1 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none z-10" />
            )}

            {/* Bouton droit */}
            <button
                onClick={() => scroll(1)}
                disabled={!canScrollRight}
                className="flex-shrink-0 mb-px p-1 rounded-md border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition disabled:opacity-0 disabled:pointer-events-none"
                aria-label="Défiler à droite"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        </div>
    );
};

// ─── TAB 1 : Description outil évaluation ────────────────────────────────────

const fmtISODate = (iso) => {
    if (!iso) return '—';
    const parts = (iso.split('T')[0]).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso;
};

const TabDescription = ({ audit, totalMesures, totalEvaluated, tauxGlobal, isISO, onSave, saving }) => {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        nom:        audit.nom || '',
        client:     audit.client || '',
        perimetre:  audit.perimetre || '',
        date_debut: audit.date_debut?.split('T')[0] || '',
        date_fin:   audit.date_fin?.split('T')[0] || '',
    });

    useEffect(() => {
        if (!editing) {
            setForm({
                nom:        audit.nom || '',
                client:     audit.client || '',
                perimetre:  audit.perimetre || '',
                date_debut: audit.date_debut?.split('T')[0] || '',
                date_fin:   audit.date_fin?.split('T')[0] || '',
            });
        }
    }, [audit, editing]);

    const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSave = async () => {
        await onSave(form);
        setEditing(false);
    };

    return (
        <div className="space-y-5">
            {/* Description statique */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--brand-red-light)' }}>
                        <svg className="w-4 h-4" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                    </div>
                    <h2 className="text-sm font-semibold text-gray-800">
                        {isISO ? "Description de l'audit ISO 27001:2022" : "Description de l'outil d'évaluation"}
                    </h2>
                </div>
                <div className="prose prose-sm max-w-none text-gray-600 space-y-2">
                    {isISO ? (
                        <p>
                            Cet outil permet d'évaluer le niveau de conformité d'un organisme par rapport aux exigences de la norme <strong>ISO/IEC 27001:2022</strong> (Sécurité de l'information, cybersécurité et protection de la vie privée). L'évaluation porte sur les contrôles de l'<strong>Annexe A</strong> classés en 4 thèmes : Organisationnel (A.5), Personnes (A.6), Physique (A.7) et Technologique (A.8).
                        </p>
                    ) : (
                        <>
                            <p>
                                Dans le cadre de l'implémentation de la DNSSI au sein des entités et des infrastructures d'importance vitale (IIV) concernées par ses dispositions, la <strong>DGSSI</strong> a réalisé cet outil dans l'objectif d'évaluer la conformité des entités et des IIV par rapport à la DNSSI et d'assurer un suivi pour l'état de mise en œuvre des règles de sécurité.
                            </p>
                            <p>L'évaluation se fait mesure par mesure selon une échelle de maturité à 6 niveaux (de 0 à 5) inspirée du modèle CMMI :</p>
                        </>
                    )}
                </div>
                {!isISO && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {NIVEAUX.filter(n => n.value !== null).map(n => (
                            <div key={n.value} className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <p className={`text-2xl font-bold ${n.color}`}>{n.value}</p>
                                <p className="text-xs text-gray-600 mt-1 font-medium">{n.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Référentiel', value: audit.referentiel?.type ?? '—', sub: audit.referentiel?.nom },
                    { label: 'Mesures évaluées', value: `${totalEvaluated} / ${totalMesures}`, sub: 'sur le référentiel' },
                    { label: 'Taux de conformité', value: `${tauxGlobal}%`, sub: 'global pondéré', accent: true },
                    { label: 'Statut', value: STATUT_CONFIG[audit.statut]?.label ?? '—', sub: audit.perimetre || 'Aucun périmètre défini' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4" style={s.accent ? { borderTopWidth: '3px', borderTopColor: 'var(--brand-red)' } : {}}>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
                        <p className="text-2xl font-bold mt-1" style={s.accent ? { color: 'var(--brand-red)' } : { color: '#111827' }}>{s.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Informations de l'audit — vue ou édition */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-800">Informations de l'audit</h3>
                    {!editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                            Modifier
                        </button>
                    )}
                </div>

                {editing ? (
                    <div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {[
                                { key: 'nom',      label: "Nom de l'audit" },
                                { key: 'client',   label: 'Client / Entité' },
                                { key: 'perimetre',label: 'Périmètre', span: true },
                            ].map(({ key, label, span }) => (
                                <div key={key} className={span ? 'col-span-2' : ''}>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                                    <input
                                        type="text"
                                        value={form[key]}
                                        onChange={e => setF(key, e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                    />
                                </div>
                            ))}
                            {[
                                { key: 'date_debut', label: 'Date de début' },
                                { key: 'date_fin',   label: 'Date de fin prévue' },
                            ].map(({ key, label }) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                                    <input
                                        type="date"
                                        value={form[key]}
                                        onChange={e => setF(key, e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                                Annuler
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                Enregistrer
                            </button>
                        </div>
                    </div>
                ) : (
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        {[
                            { label: 'Client / Entité',   value: audit.client || '—' },
                            { label: 'Périmètre',         value: audit.perimetre || '—' },
                            { label: 'Date de début',     value: fmtISODate(audit.date_debut) },
                            { label: 'Date de fin prévue',value: fmtISODate(audit.date_fin) },
                            { label: 'Créé par',          value: audit.createur ? `${audit.createur.prenom} ${audit.createur.nom}` : '—' },
                            { label: 'Auditeurs',         value: audit.auditeurs?.length > 0 ? audit.auditeurs.map(u => `${u.prenom} ${u.nom}`).join(', ') : '—' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                                <dd className="text-gray-800 mt-0.5">{value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </div>
        </div>
    );
};

// ─── TAB 2 : Identification entité ou IIV ────────────────────────────────────

const TabIdentification = ({ identification, setIdentification, onSave, saving, isISO }) => {
    const isEmpty = !Object.values(identification).some(v => v && String(v).trim());
    const [editing, setEditing] = useState(isEmpty);
    const set = (k, v) => setIdentification(prev => ({ ...prev, [k]: v }));

    const handleSave = () => {
        onSave();
        setEditing(false);
    };

    const infoText = isISO
        ? "Renseignez les informations relatives à l'organisme audité, à son RSSI et à l'auteur de l'évaluation ISO 27001."
        : "L'objectif de cette feuille est de renseigner la dénomination de l'entité ou de l'IIV, son adresse ainsi que les informations relatives au RSSI et à l'auteur de l'évaluation.";
    const sectionTitle = isISO ? "2. Identification de l'organisme" : "1. Identification de l'entité ou de l'IIV";
    const genLabel = isISO ? "Informations de l'organisme" : "Informations générales";

    // ── Vue carte (après remplissage) ─────────────────────────────────────────
    if (!editing) {
        const InfoRow = ({ label, value }) => !value ? null : (
            <div>
                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                <dd className="text-sm text-gray-800 mt-0.5">{value}</dd>
            </div>
        );
        return (
            <div className="space-y-5">
                <TabInfo text={infoText} />
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-semibold text-gray-800">{sectionTitle}</h2>
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                            Modifier
                        </button>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">{genLabel}</h3>
                            <dl className="grid grid-cols-2 gap-3">
                                <InfoRow label="Dénomination" value={identification.denomination} />
                                <InfoRow label="Département" value={identification.departement} />
                                <InfoRow label="Adresse" value={identification.adresse} />
                                <InfoRow label="Ville" value={identification.ville} />
                                <InfoRow label="Site web" value={identification.site_web} />
                            </dl>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">RSSI</h3>
                            <dl className="grid grid-cols-2 gap-3">
                                <InfoRow label="Nom et Prénom" value={identification.rssi_nom_prenom} />
                                <InfoRow label="Rattachement" value={identification.rssi_rattachement} />
                                <InfoRow label="E-mail" value={identification.rssi_email} />
                                <InfoRow label="Téléphone" value={identification.rssi_telephone} />
                            </dl>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Gestion du document</h3>
                            <dl className="grid grid-cols-2 gap-3">
                                <InfoRow label="Auteur de l'évaluation" value={identification.auteur_evaluation} />
                                <InfoRow label="Date de l'évaluation" value={identification.date_evaluation ? fmtISODate(identification.date_evaluation) : null} />
                                <InfoRow label="Validé par" value={identification.valide_par} />
                                <InfoRow label="Date de validation" value={identification.date_validation ? fmtISODate(identification.date_validation) : null} />
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Formulaire d'édition ──────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            <TabInfo text={infoText} />
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold text-gray-800">{sectionTitle}</h2>
                    {!isEmpty && (
                        <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700 underline">Annuler</button>
                    )}
                </div>

                {/* Informations générales */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">{genLabel}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { key: 'denomination',  label: 'Dénomination' },
                            { key: 'departement',   label: "Département d'appartenance" },
                            { key: 'adresse',       label: 'Adresse' },
                            { key: 'ville',         label: 'Ville' },
                            { key: 'site_web',      label: 'Adresse du site web' },
                        ].map(({ key, label }) => (
                            <div key={key} className={key === 'adresse' ? 'col-span-2' : ''}>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                                <input
                                    type="text"
                                    value={identification[key] || ''}
                                    onChange={e => set(key, e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* RSSI */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Responsable de la Sécurité des SI (RSSI)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { key: 'rssi_nom_prenom',   label: 'Nom et Prénom' },
                            { key: 'rssi_rattachement', label: 'Rattachement' },
                            { key: 'rssi_email',        label: 'E-mail', type: 'email' },
                            { key: 'rssi_telephone',    label: 'Téléphone', type: 'tel' },
                        ].map(({ key, label, type = 'text' }) => (
                            <div key={key}>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                                <input
                                    type={type}
                                    value={identification[key] || ''}
                                    onChange={e => set(key, e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gestion du document */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Gestion du document</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { key: 'auteur_evaluation', label: "Auteur de l'évaluation", isDate: false },
                            { key: 'date_evaluation',   label: "Date de l'évaluation",   isDate: true },
                            { key: 'valide_par',        label: 'Validé par',              isDate: false },
                            { key: 'date_validation',   label: 'Date de validation',      isDate: true },
                        ].map(({ key, label, isDate }) => (
                            <div key={key}>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    {label}
                                    {isDate && <span className="ml-1 text-gray-400 font-normal">(jj/mm/aaaa)</span>}
                                </label>
                                {isDate ? (
                                    <DateInput
                                        value={identification[key] || ''}
                                        onChange={v => set(key, v)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={identification[key] || ''}
                                        onChange={e => set(key, e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── TAB 3 : Évaluation MO DNSSI ─────────────────────────────────────────────

const TabEvaluation = ({ referentiel, localEvals, setEval, openDomaines, setOpenDomaines, isDirty, saving, onSave }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement du référentiel...</div>;

    const toggleDomaine = (id) => setOpenDomaines(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="space-y-3">
            <TabInfo text="L'objectif de cette feuille est d'évaluer le niveau de maturité atteint pour chacune des mesures de sécurité édictées par la DNSSI et ainsi en déduire le niveau de conformité. L'auteur de l'évaluation est invité à évaluer la mise en œuvre de chacune des règles selon l'échelle de maturité définie." />
            {/* Barre de sauvegarde */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3">
                <p className="text-sm text-gray-600">
                    <strong>2. Évaluation de la mise en œuvre des règles de la DNSSI</strong>
                    {isDirty && <span className="ml-2 text-xs text-orange-500">— modifications non sauvegardées</span>}
                </p>
                <button
                    onClick={onSave}
                    disabled={saving || !isDirty}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white rounded-lg transition disabled:opacity-50"
                    style={{ backgroundColor: 'var(--brand-red)' }}
                >
                    {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                    Sauvegarder
                </button>
            </div>

            {/* Légende niveaux */}
            <div className="flex flex-wrap gap-2 px-1">
                {NIVEAUX.map(n => (
                    <span key={String(n.value)} className={`text-xs font-medium ${n.color}`}>
                        {n.value === null ? 'N/A' : `${n.value} = ${n.label}`}
                    </span>
                ))}
            </div>

            {/* Domaines */}
            {referentiel.domaines?.map(domaine => {
                const mesures = domaine.objectifs?.flatMap(o => o.mesures) || [];
                const evCount = mesures.filter(m => localEvals[m.id]?.niveau_maturite !== null && localEvals[m.id]?.niveau_maturite !== undefined).length;
                const isOpen = openDomaines[domaine.id];

                return (
                    <div key={domaine.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {/* En-tête domaine */}
                        <button
                            onClick={() => toggleDomaine(domaine.id)}
                            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50/60 transition"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>
                                    {domaine.code}
                                </span>
                                <span className="text-sm font-semibold text-gray-800">{stripNumericPrefix(domaine.nom)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">{evCount}/{mesures.length} évaluées</span>
                                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${mesures.length > 0 ? (evCount/mesures.length)*100 : 0}%`, backgroundColor: 'var(--brand-red)' }} />
                                </div>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </button>

                        {isOpen && (
                            <div className="border-t border-gray-100">
                                {domaine.objectifs?.map(objectif => {
                                    const objDesc = stripObjectifPrefix(objectif.description || '');
                                    return (
                                    <div key={objectif.id} className="border-b border-gray-50 last:border-0">
                                        {/* En-tête objectif */}
                                        <div className="px-5 py-2.5 bg-gray-50/60">
                                            <p className="text-xs font-semibold text-gray-600">
                                                <span className="text-gray-400 mr-1">{objectif.code}</span>
                                                {objDesc}
                                            </p>
                                        </div>

                                        {/* Table des mesures */}
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    <th className="text-left px-5 py-2 font-semibold text-gray-400 uppercase tracking-wider w-28">Règle</th>
                                                    <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider w-44">Niveau maturité</th>
                                                    <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider w-28">Conformité</th>
                                                    <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider w-52">Commentaire</th>
                                                    <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider">Justificatif N/A</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {objectif.mesures?.map(mesure => {
                                                    const ev = localEvals[mesure.id] || {};
                                                    const niveau = ev.niveau_maturite ?? null;
                                                    const conformite = calcConformite(niveau);
                                                    const isNA = niveau === null;

                                                    return (
                                                        <tr key={mesure.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                                                            <td className="px-5 py-2">
                                                                <div className="relative group inline-flex items-center gap-1">
                                                                    <span className="font-mono text-gray-500 cursor-help underline decoration-dotted decoration-gray-400">
                                                                        {mesure.code}
                                                                    </span>
                                                                    <div className="absolute z-50 left-0 bottom-full mb-2 w-80 p-3 bg-gray-900 text-white rounded-lg shadow-2xl hidden group-hover:block pointer-events-none">
                                                                        <p className="font-semibold text-gray-100 mb-1.5">{mesure.code?.trim()}</p>
                                                                        {mesure.description && <p className="text-gray-300 leading-relaxed text-[11px]">{mesure.description}</p>}
                                                                        <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <select
                                                                    value={niveau === null ? 'na' : String(niveau)}
                                                                    onChange={e => {
                                                                        const v = e.target.value === 'na' ? null : parseInt(e.target.value);
                                                                        setEval(mesure.id, 'niveau_maturite', v);
                                                                    }}
                                                                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:border-transparent"
                                                                    style={{ '--tw-ring-color': 'var(--brand-red)' }}
                                                                >
                                                                    <option value="na">N/A</option>
                                                                    <option value="0">0 — Aucun</option>
                                                                    <option value="1">1 — Initial</option>
                                                                    <option value="2">2 — Reproductible</option>
                                                                    <option value="3">3 — Défini</option>
                                                                    <option value="4">4 — Maitrisé</option>
                                                                    <option value="5">5 — Optimisé</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <ConformiteBadge conformite={conformite} />
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <input
                                                                    type="text"
                                                                    value={ev.commentaire || ''}
                                                                    onChange={e => setEval(mesure.id, 'commentaire', e.target.value)}
                                                                    placeholder="Commentaire..."
                                                                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                {isNA && (
                                                                    <input
                                                                        type="text"
                                                                        value={ev.preuve || ''}
                                                                        onChange={e => setEval(mesure.id, 'preuve', e.target.value)}
                                                                        placeholder="Justifier la non-applicabilité..."
                                                                        className="w-full text-xs border border-orange-200 rounded-md px-2 py-1.5 bg-orange-50 focus:outline-none focus:ring-1"
                                                                    />
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ); })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Bouton flottant sauvegarde */}
            {isDirty && (
                <div className="sticky bottom-4 flex justify-end">
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl shadow-lg transition disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                        Sauvegarder les évaluations
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── TAB 4 : Synthèse niveau de maturité ─────────────────────────────────────

const TabSyntheseMaturite = ({ synthese }) => (
    <div className="space-y-4">
        <TabInfo text="Cette feuille a pour but de donner une synthèse du niveau de maturité selon les valeurs renseignées par l'entité ou de l'IIV. Elle permet de visualiser l'état de mise en œuvre des règles de la DNSSI par niveau de maturité et d'identifier les axes d'amélioration prioritaires." />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-5">3. Synthèse du niveau de maturité par domaine</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Domaine</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mesures</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Évaluées</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score moyen</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progression</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {synthese.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50/40">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{d.code}</span>
                                        <span className="text-gray-700 font-medium text-xs">{d.nom}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center text-gray-600">{d.total}</td>
                                <td className="px-4 py-3 text-center text-gray-600">{d.evaluated}</td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`text-lg font-bold ${d.avgScore >= 4 ? 'text-green-600' : d.avgScore >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                                            {d.evaluated > 0 ? d.avgScore.toFixed(1) : '—'}
                                        </span>
                                        {d.evaluated > 0 && <span className="text-xs text-gray-400">/ 5</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${d.total > 0 ? (d.avgScore / 5) * 100 : 0}%`,
                                                    backgroundColor: d.avgScore >= 4 ? '#16a34a' : d.avgScore >= 2 ? '#ca8a04' : '#dc2626',
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-400 w-8">{d.total > 0 ? Math.round((d.avgScore / 5) * 100) : 0}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

// ─── TAB 5 : Synthèse niveau de conformité ───────────────────────────────────

const TabSyntheseConformite = ({ synthese, totalConforme, totalPartiel, totalNC, tauxGlobal }) => (
    <div className="space-y-4">
        <TabInfo text="Cette feuille a pour but de donner une synthèse du niveau de conformité du SI par rapport aux règles de la DNSSI selon les valeurs renseignées par l'entité ou de l'IIV. La conformité est déduite du niveau de maturité : niveaux 0-1 → Non conforme, 2-3 → Partielle, 4-5 → Totale." />
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
            {[
                { label: 'Conforme (Totale)', value: totalConforme, color: '#16a34a', bg: '#f0fdf4' },
                { label: 'Partielle', value: totalPartiel, color: '#ca8a04', bg: '#fefce8' },
                { label: 'Non conforme', value: totalNC, color: '#dc2626', bg: '#fef2f2' },
                { label: 'Taux global', value: `${tauxGlobal}%`, color: 'var(--brand-red)', bg: 'var(--brand-red-light)', accent: true },
            ].map((k, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4" style={k.accent ? { borderTopWidth: '3px', borderTopColor: k.color } : {}}>
                    <p className="text-xs font-medium text-gray-500">{k.label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
                </div>
            ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-5">4. Synthèse du niveau de conformité par domaine</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Domaine</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-green-600 uppercase tracking-wider">Totale</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-yellow-600 uppercase tracking-wider">Partielle</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-red-600 uppercase tracking-wider">Non conforme</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">N/A</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Taux (%)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {synthese.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50/40">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{d.code}</span>
                                        <span className="text-gray-700 text-xs font-medium">{d.nom}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-green-700 font-semibold">{d.conforme}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-yellow-700 font-semibold">{d.partiel}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-red-700 font-semibold">{d.non_conforme}</span>
                                </td>
                                <td className="px-4 py-3 text-center text-gray-400">{d.na}</td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${d.tauxConformite}%`, backgroundColor: d.tauxConformite >= 75 ? '#16a34a' : d.tauxConformite >= 50 ? '#ca8a04' : '#dc2626' }} />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-700">{d.tauxConformite}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

// ─── TAB 6 : État d'avancement ───────────────────────────────────────────────

const TabAvancement = ({ referentiel, localEvals, synthese }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement...</div>;

    return (
        <div className="space-y-4">
            <TabInfo text="Cette feuille a pour but de renseigner les actions déjà entreprises ainsi que les actions qui seront implémentées pour la mise en conformité de l'entité ou de l'IIV avec la DNSSI. Cet aperçu sur l'état d'avancement tient en compte les mesures à court terme et les mesures atteignables à moyen terme." />
            <div className="bg-white rounded-xl border border-gray-200 p-6">
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
                <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80">
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100 w-72">Objectif</th>
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100 w-24">Règle</th>
                                <th className="text-center px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100 w-32">Conformité</th>
                                <th className="text-center px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100 w-32">Maturité</th>
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Commentaire</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referentiel.domaines?.map(domaine => (
                                <>
                                    {/* Ligne d'en-tête domaine */}
                                    <tr key={`dom-${domaine.id}`} className="bg-gray-100/70">
                                        <td colSpan={5} className="px-4 py-2 border-b border-gray-200">
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
                                            const conformite = calcConformite(niveau);
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
                                                    <td className="px-4 py-2.5 text-gray-500">{ev.commentaire || <span className="text-gray-300">—</span>}</td>
                                                </tr>
                                            );
                                        });
                                    })}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ─── TAB 7 : Indicateurs de la SSI ──────────────────────────────────────────

const TabIndicateurs = ({ indicateurs, setIndicateurs, synthese, onSave, saving }) => {
    const set = (k, v) => setIndicateurs(prev => ({ ...prev, [k]: v }));

    // Calcul automatique des indicateurs "auto"
    const getAutoValue = (key) => {
        if (key === 'taux_organisation_ssi') {
            const org = synthese.find(d => d.nom?.toLowerCase().includes('organisation') || d.code?.includes('ORG') || d.code === '2');
            return org ? `${org.tauxConformite}%` : '—';
        }
        if (key === 'taux_actifs_info') {
            const actif = synthese.find(d => d.nom?.toLowerCase().includes('actif') || d.code === '4');
            return actif ? `${actif.tauxConformite}%` : '—';
        }
        return null;
    };

    return (
        <div className="space-y-4">
            <TabInfo text="Les indicateurs de la SSI énumérés dans ce document sont donnés à titre indicatif. Ils peuvent être complétés par l'entité ou l'IIV. Ces indicateurs permettent aux responsables des entités et des IIV de définir les axes de progrès et de s'inscrire dans un processus d'amélioration continue." />
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-1">6. Indicateurs de la SSI</h2>
                <p className="text-xs text-gray-400 mb-5">Liste non exhaustive d'indicateurs de performance de la sécurité des SI</p>

                <div className="space-y-3">
                    {INDICATEURS_DEF.map(({ key, label, unit, auto }) => {
                        const autoVal = auto ? getAutoValue(key) : null;
                        return (
                            <div key={key} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">{label}</p>
                                    {auto && <p className="text-xs text-gray-400 mt-0.5">Calculé automatiquement depuis la synthèse</p>}
                                </div>
                                {auto ? (
                                    <div className="w-40 px-3 py-2 text-sm font-semibold text-center rounded-lg" style={{ backgroundColor: 'var(--brand-red-light)', color: 'var(--brand-red)' }}>
                                        {autoVal}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 w-48">
                                        <input
                                            type="number"
                                            value={indicateurs[key] || ''}
                                            onChange={e => set(key, e.target.value)}
                                            placeholder="—"
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 text-right"
                                        />
                                        {unit && <span className="text-xs text-gray-400 flex-shrink-0">{unit}</span>}
                                    </div>
                                )}
                                {!auto && (
                                    <div className="w-48 text-xs text-gray-400 pl-1">
                                        {indicateurs[key] ? (
                                            <span>{indicateurs[key]}{unit}</span>
                                        ) : (
                                            <span>À renseigner</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end mt-5">
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                        Enregistrer les indicateurs
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Constantes ISO évaluation ────────────────────────────────────────────────

const ISO_CONF_STATES = [
    { value: 5, label: 'Conforme',      activeCls: 'bg-green-600 text-white border-green-600',  inactiveCls: 'bg-white text-gray-500 border-gray-200 hover:border-green-400' },
    { value: 2, label: 'Partiel',       activeCls: 'bg-yellow-500 text-white border-yellow-500', inactiveCls: 'bg-white text-gray-500 border-gray-200 hover:border-yellow-400' },
    { value: 0, label: 'Non conforme',  activeCls: 'bg-red-600 text-white border-red-600',       inactiveCls: 'bg-white text-gray-500 border-gray-200 hover:border-red-400' },
];

const PRIORITE_CONFIG = {
    haute:   { label: 'Haute',   bg: 'bg-red-50',    text: 'text-red-700' },
    moyenne: { label: 'Moyenne', bg: 'bg-yellow-50',  text: 'text-yellow-700' },
    basse:   { label: 'Basse',   bg: 'bg-green-50',   text: 'text-green-700' },
};

const STATUT_PLAN_CONFIG = {
    a_faire:  { label: 'À faire',  bg: 'bg-gray-100',  text: 'text-gray-600' },
    en_cours: { label: 'En cours', bg: 'bg-blue-50',   text: 'text-blue-700' },
    cloture:  { label: 'Clôturé',  bg: 'bg-green-50',  text: 'text-green-700' },
};

// ─── TAB ISO 4 : Évaluation des contrôles ─────────────────────────────────────

const TabEvaluationISO = ({ referentiel, soaMap, localEvals, setEval, isDirty, saving, onSave }) => {
    const [openThemes, setOpenThemes] = useState({});

    useEffect(() => {
        if (referentiel?.domaines?.length > 0) {
            setOpenThemes({ [referentiel.domaines[0].id]: true });
        }
    }, [referentiel]);

    const toggleTheme = (id) => setOpenThemes(prev => ({ ...prev, [id]: !prev[id] }));

    const allApplicable = referentiel?.domaines?.flatMap(d =>
        d.objectifs?.flatMap(o => o.mesures?.filter(m => soaMap[m.id]?.applicable === true) ?? []) ?? []
    ) ?? [];

    if (allApplicable.length === 0) {
        return (
            <div className="space-y-4">
                <TabInfo text="Complétez d'abord la Déclaration d'Applicabilité pour définir les contrôles applicables avant d'évaluer." />
                <TabPlaceholder titre="Aucun contrôle applicable défini" texte="Retournez à l'onglet 'Déclaration d'Applicabilité' et marquez les contrôles applicables avant de commencer l'évaluation." />
            </div>
        );
    }

    const conforme    = allApplicable.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
    const partiel     = allApplicable.filter(m => localEvals[m.id]?.niveau_maturite === 2).length;
    const nonConforme = allApplicable.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
    const evaluated   = conforme + partiel + nonConforme;

    return (
        <div className="space-y-4">
            <TabInfo text="Évaluez la conformité de chaque contrôle ISO 27001:2022 applicable défini dans la SoA. Pour chaque contrôle, indiquez s'il est Conforme, Partiellement conforme ou Non conforme, puis ajoutez vos observations et références de preuves." />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Contrôles applicables', value: allApplicable.length, sub: `${evaluated} évalués`, color: '#111827' },
                    { label: 'Conformes',   value: conforme,    color: '#16a34a' },
                    { label: 'Partiels',    value: partiel,     color: '#d97706' },
                    { label: 'Non conformes', value: nonConforme, color: '#dc2626' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                        {kpi.sub && <p className="text-xs text-gray-400">{kpi.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Accordion par thème */}
            {referentiel?.domaines?.map(theme => {
                const isOpen = !!openThemes[theme.id];
                const themeMesures = theme.objectifs?.flatMap(o =>
                    o.mesures?.filter(m => soaMap[m.id]?.applicable === true) ?? []) ?? [];

                if (themeMesures.length === 0) return null;

                const themeEval = themeMesures.filter(m =>
                    localEvals[m.id]?.niveau_maturite !== null && localEvals[m.id]?.niveau_maturite !== undefined
                ).length;

                return (
                    <div key={theme.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <button onClick={() => toggleTheme(theme.id)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>
                                    {theme.code}
                                </span>
                                <span className="text-sm font-semibold text-gray-800">{theme.nom}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">{themeEval}/{themeMesures.length} évalués</span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </button>

                        {isOpen && (
                            <div className="border-t border-gray-100">
                                {theme.objectifs?.map(objectif => {
                                    const objApplicable = objectif.mesures?.filter(m => soaMap[m.id]?.applicable === true) ?? [];
                                    if (objApplicable.length === 0) return null;
                                    const objDesc = stripObjectifPrefix(objectif.description || '');
                                    return (
                                        <div key={objectif.id} className="border-b border-gray-50 last:border-0">
                                            <div className="px-5 py-2.5 bg-gray-50/60">
                                                <p className="text-xs font-semibold text-gray-600">
                                                    <span className="text-gray-400 mr-1">{objectif.code}</span>
                                                    {objDesc}
                                                </p>
                                            </div>
                                            {objApplicable.map(mesure => {
                                                const ev = localEvals[mesure.id] || {};
                                                const niveau = ev.niveau_maturite ?? null;
                                                return (
                                                    <div key={mesure.id} className="px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                                        <div className="flex items-start gap-4">
                                                            {/* Code + tooltip */}
                                                            <div className="relative group flex-shrink-0 w-20">
                                                                <span className="font-mono text-xs text-gray-600 cursor-help underline decoration-dotted decoration-gray-400">
                                                                    {mesure.code?.trim()}
                                                                </span>
                                                                <div className="absolute z-50 left-0 bottom-full mb-2 w-80 p-3 bg-gray-900 text-white rounded-lg shadow-2xl hidden group-hover:block pointer-events-none">
                                                                    <p className="font-semibold text-gray-100 mb-1.5 text-xs">{mesure.code?.trim()}</p>
                                                                    {mesure.description && <p className="text-gray-300 leading-relaxed text-[11px]">{mesure.description}</p>}
                                                                    <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                                                                </div>
                                                            </div>
                                                            {/* Description de la règle */}
                                                            <p className="flex-1 text-xs text-gray-700 leading-relaxed">{mesure.description || objDesc}</p>
                                                            {/* 3-state toggle */}
                                                            <div className="flex items-center flex-shrink-0">
                                                                {ISO_CONF_STATES.map((s, idx) => (
                                                                    <button key={s.value}
                                                                        onClick={() => setEval(mesure.id, 'niveau_maturite', niveau === s.value ? null : s.value)}
                                                                        className={`px-2.5 py-1 text-xs font-medium border transition
                                                                            ${idx === 0 ? 'rounded-l-md border-r-0' : ''}
                                                                            ${idx === ISO_CONF_STATES.length - 1 ? 'rounded-r-md' : ''}
                                                                            ${idx > 0 && idx < ISO_CONF_STATES.length - 1 ? 'border-r-0' : ''}
                                                                            ${niveau === s.value ? s.activeCls : s.inactiveCls}`}
                                                                    >
                                                                        {s.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {/* Commentaire + preuve si évalué */}
                                                        {niveau !== null && (
                                                            <div className="mt-2 ml-24 grid grid-cols-2 gap-3">
                                                                <input type="text" value={ev.commentaire || ''}
                                                                    onChange={e => setEval(mesure.id, 'commentaire', e.target.value)}
                                                                    placeholder="Observations..."
                                                                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none" />
                                                                <input type="text" value={ev.preuve || ''}
                                                                    onChange={e => setEval(mesure.id, 'preuve', e.target.value)}
                                                                    placeholder="Références / preuves..."
                                                                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Bouton flottant sauvegarde */}
            {isDirty && (
                <div className="sticky bottom-4 flex justify-end">
                    <button onClick={onSave} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl shadow-lg transition disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                        Sauvegarder l'évaluation
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── TAB Plan d'actions (DNSSI + ISO) ─────────────────────────────────────────

const emptyPlanForm = { mesure_id: '', description_nc: '', action_corrective: '', responsable: '', delai: '', priorite: 'moyenne', statut: 'a_faire', kpi: '' };

const PLAN_VALIDATION_CONFIG = {
    en_attente: { label: 'En attente', bg: 'bg-amber-50',  text: 'text-amber-700'  },
    valide:     { label: 'Validé',     bg: 'bg-green-50',  text: 'text-green-700'  },
    rejete:     { label: 'Rejeté',     bg: 'bg-red-50',    text: 'text-red-700'    },
};

const TabPlanActions = ({ referentiel, planActions, localEvals, soaMap, isISO, user, onAdd, onUpdate, onDelete, onSoumettre, onValider, onRejeter }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...emptyPlanForm });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

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

    // Mesures non conformes (pour mettre en évidence dans le dropdown)
    const nonConfIds = new Set(allMesures.filter(m => {
        const n = localEvals[m.id]?.niveau_maturite;
        return isISO ? (soaMap[m.id]?.applicable === true && n === 0) : (n !== null && n !== undefined && n <= 1);
    }).map(m => m.id));

    return (
        <div className="space-y-4">
            <TabInfo text="Définissez les actions correctives pour traiter les non-conformités identifiées lors de l'évaluation. Chaque action est associée à une mesure, un responsable, un délai et une priorité de traitement." />

            {/* Barre d'action */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{planActions.length} action(s) définie(s)</span>
                    {nonConfIds.size > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-50 text-red-700">
                            {nonConfIds.size} mesure(s) non conforme(s)
                        </span>
                    )}
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition"
                    style={{ backgroundColor: 'var(--brand-red)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Ajouter une action
                </button>
            </div>

            {/* Formulaire */}
            {showForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">
                        {editingId ? "Modifier l'action" : 'Nouvelle action corrective'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!editingId && (
                            <div>
                                <label className={`text-xs font-semibold uppercase tracking-wider ${errors.mesure_id ? 'text-red-500' : 'text-gray-500'}`}>
                                    Mesure / Contrôle *
                                </label>
                                <select value={form.mesure_id} onChange={e => setF('mesure_id', e.target.value)}
                                    className={`w-full mt-1 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 border ${errors.mesure_id ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`}>
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
                                className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1" />
                        </div>

                        <div>
                            <label className={`text-xs font-semibold uppercase tracking-wider ${errors.action_corrective ? 'text-red-500' : 'text-gray-500'}`}>
                                Action corrective *
                            </label>
                            <textarea value={form.action_corrective} onChange={e => setF('action_corrective', e.target.value)}
                                rows={2} placeholder="Décrivez l'action à mettre en place..."
                                className={`w-full mt-1 text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 border ${errors.action_corrective ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} />
                            {errors.action_corrective && <p className="mt-1 text-xs text-red-500">Ce champ est requis.</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className={`text-xs font-semibold uppercase tracking-wider ${errors.responsable ? 'text-red-500' : 'text-gray-500'}`}>
                                    Responsable *
                                </label>
                                <input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)}
                                    placeholder="Nom..."
                                    className={`w-full mt-1 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 border ${errors.responsable ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} />
                                {errors.responsable && <p className="mt-1 text-xs text-red-500">Requis.</p>}
                            </div>
                            <div>
                                <label className={`text-xs font-semibold uppercase tracking-wider ${errors.delai ? 'text-red-500' : 'text-gray-500'}`}>
                                    Délai *
                                </label>
                                <input type="date" value={form.delai} onChange={e => setF('delai', e.target.value)}
                                    className={`w-full mt-1 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 border ${errors.delai ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`} />
                                {errors.delai && <p className="mt-1 text-xs text-red-500">Requis.</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priorité</label>
                                <select value={form.priorite} onChange={e => setF('priorite', e.target.value)}
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1">
                                    <option value="basse">Basse</option>
                                    <option value="moyenne">Moyenne</option>
                                    <option value="haute">Haute</option>
                                </select>
                            </div>
                        </div>

                        {editingId && (
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</label>
                                <select value={form.statut} onChange={e => setF('statut', e.target.value)}
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1">
                                    <option value="a_faire">À faire</option>
                                    <option value="en_cours">En cours</option>
                                    <option value="cloture">Clôturé</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KPI de suivi (optionnel)</label>
                            <input type="text" value={form.kpi} onChange={e => setF('kpi', e.target.value)}
                                placeholder="Ex : Taux de couverture antivirus"
                                className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button type="submit" disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {editingId ? 'Enregistrer' : "Créer l'action"}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tableau */}
            {planActions.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-500">Aucune action corrective définie</p>
                    <p className="text-xs text-gray-400 mt-1">Ajoutez des actions pour traiter les non-conformités identifiées</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                            {planActions.map(plan => {
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
                                                        {isJuniorUser && plan.statut_validation !== 'en_attente' && plan.statut_validation !== 'valide' && (
                                                            <button onClick={() => onSoumettre(plan.id)}
                                                                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium">
                                                                Soumettre
                                                            </button>
                                                        )}
                                                        {isSeniorAdminUser && plan.statut_validation === 'en_attente' && (
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
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ─── TAB ISO 6 : Synthèse par thème ──────────────────────────────────────────

const TabSyntheseISO = ({ referentiel, soaMap, localEvals }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement...</div>;

    const themes = referentiel.domaines.map(theme => {
        const mesures = theme.objectifs.flatMap(o => o.mesures);
        const applicable = mesures.filter(m => soaMap[m.id]?.applicable === true);
        const conforme    = applicable.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
        const partiel     = applicable.filter(m => localEvals[m.id]?.niveau_maturite === 2).length;
        const nonConforme = applicable.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
        const evaluated   = conforme + partiel + nonConforme;
        const taux = evaluated > 0 ? Math.round(((conforme + partiel * 0.5) / evaluated) * 100) : 0;
        return { ...theme, total: mesures.length, applicable: applicable.length, conforme, partiel, nonConforme, evaluated, taux };
    });

    const totApp = themes.reduce((s, t) => s + t.applicable, 0);
    const totConf = themes.reduce((s, t) => s + t.conforme, 0);
    const totPart = themes.reduce((s, t) => s + t.partiel, 0);
    const totNC   = themes.reduce((s, t) => s + t.nonConforme, 0);
    const totEval = themes.reduce((s, t) => s + t.evaluated, 0);
    const tauxGlobal = totEval > 0 ? Math.round(((totConf + totPart * 0.5) / totEval) * 100) : 0;

    if (totApp === 0) {
        return (
            <div className="space-y-4">
                <TabInfo text="Complétez la Déclaration d'Applicabilité puis l'évaluation des contrôles pour voir la synthèse par thème." />
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                    <p className="text-sm text-gray-500">Aucun contrôle applicable défini.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <TabInfo text="Synthèse de la conformité ISO 27001:2022 regroupée par thème (A.5 Organisationnel, A.6 Personnes, A.7 Physique, A.8 Technologique). Seuls les contrôles applicables définis dans la SoA sont pris en compte." />

            {/* KPIs globaux */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Taux global', value: `${tauxGlobal}%`, color: tauxGlobal >= 75 ? '#16a34a' : tauxGlobal >= 50 ? '#d97706' : '#dc2626', accent: true },
                    { label: 'Conformes',      value: totConf, color: '#16a34a' },
                    { label: 'Partiels',       value: totPart, color: '#d97706' },
                    { label: 'Non conformes',  value: totNC,   color: '#dc2626' },
                ].map((k, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4" style={k.accent ? { borderTopWidth: '3px', borderTopColor: k.color } : {}}>
                        <p className="text-xs font-medium text-gray-500">{k.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Tableau par thème */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-5">Conformité par thème ISO 27001:2022</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thème</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Applicables</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-green-600">Conformes</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-yellow-600">Partiels</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-red-600">Non conformes</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Taux (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {themes.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50/40">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{t.code}</span>
                                            <span className="text-xs font-medium text-gray-700">{t.nom}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600 text-xs">{t.applicable}/{t.total}</td>
                                    <td className="px-4 py-3 text-center text-green-700 font-semibold text-xs">{t.conforme}</td>
                                    <td className="px-4 py-3 text-center text-yellow-700 font-semibold text-xs">{t.partiel}</td>
                                    <td className="px-4 py-3 text-center text-red-700 font-semibold text-xs">{t.nonConforme}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${t.taux}%`, backgroundColor: t.taux >= 75 ? '#16a34a' : t.taux >= 50 ? '#d97706' : '#dc2626' }} />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-700">{t.taux}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ─── TAB ISO 7 : Non-conformités ──────────────────────────────────────────────

const TabNC = ({ referentiel, soaMap, localEvals }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement...</div>;

    const ncList = referentiel.domaines.flatMap(theme =>
        theme.objectifs.flatMap(obj =>
            (obj.mesures || [])
                .filter(m => soaMap[m.id]?.applicable === true && localEvals[m.id]?.niveau_maturite === 0)
                .map(m => ({ ...m, theme, obj }))
        )
    );

    if (ncList.length === 0) {
        return (
            <div className="space-y-4">
                <TabInfo text="Ce registre liste tous les contrôles ISO 27001 applicables évalués comme Non conformes. Il sert de base pour définir les actions correctives dans le Plan d'actions." />
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Aucune non-conformité enregistrée</p>
                    <p className="text-xs text-gray-400 mt-1">Tous les contrôles applicables évalués sont conformes ou partiellement conformes.</p>
                </div>
            </div>
        );
    }

    // Grouper par thème
    const byTheme = {};
    ncList.forEach(m => {
        const key = m.theme.id;
        if (!byTheme[key]) byTheme[key] = { theme: m.theme, items: [] };
        byTheme[key].items.push(m);
    });

    return (
        <div className="space-y-4">
            <TabInfo text="Ce registre liste tous les contrôles ISO 27001 applicables évalués comme Non conformes. Utilisez le Plan d'actions pour définir les actions correctives associées." />

            {/* Compteur */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                    <span className="text-lg font-bold text-red-600">{ncList.length}</span>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">Non-conformité(s) identifiée(s)</p>
                    <p className="text-xs text-gray-500">Contrôles applicables évalués à « Non conforme »</p>
                </div>
            </div>

            {/* Liste par thème */}
            {Object.values(byTheme).map(({ theme, items }) => (
                <div key={theme.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{theme.code}</span>
                        <span className="text-sm font-semibold text-gray-700">{theme.nom}</span>
                        <span className="ml-auto text-xs text-red-600 font-medium">{items.length} NC</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {items.map(m => {
                            const ev = localEvals[m.id] || {};
                            return (
                                <div key={m.id} className="px-5 py-3 flex items-start gap-4">
                                    <span className="font-mono text-xs text-gray-600 flex-shrink-0 w-24 pt-0.5">{m.code?.trim()}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-700 leading-relaxed">{m.description || m.obj?.description || ''}</p>
                                        {ev.commentaire && <p className="text-xs text-gray-400 mt-1 italic">"{ev.commentaire}"</p>}
                                    </div>
                                    <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 font-medium">Non conforme</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── TAB ISO 8 : Indicateurs SMSI ────────────────────────────────────────────

const TabIndicateursISO = ({ referentiel, soaMap, localEvals, indicateurs, setIndicateurs, onSave, saving }) => {
    const set = (k, v) => setIndicateurs(prev => ({ ...prev, [k]: v }));

    const allMesures = referentiel?.domaines?.flatMap(d => d.objectifs?.flatMap(o => o.mesures ?? []) ?? []) ?? [];
    const applicable = allMesures.filter(m => soaMap[m.id]?.applicable === true);
    const ncCount    = applicable.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
    const confCount  = applicable.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
    const implCount  = allMesures.filter(m => ['implemente', 'partiel', 'planifie'].includes(soaMap[m.id]?.statut_implementation)).length;

    const getAutoValue = (key) => {
        if (!applicable.length) return '—';
        if (key === 'iso_taux_nc')   return `${Math.round(ncCount / applicable.length * 100)}%`;
        if (key === 'iso_taux_conf') return `${Math.round(confCount / applicable.length * 100)}%`;
        if (key === 'iso_taux_impl') return allMesures.length > 0 ? `${Math.round(implCount / allMesures.length * 100)}%` : '—';
        return '—';
    };

    return (
        <div className="space-y-4">
            <TabInfo text="Indicateurs de performance du Système de Management de la Sécurité de l'Information (SMSI) selon ISO 27001:2022. Les indicateurs marqués « Auto » sont calculés depuis l'évaluation et la SoA." />
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-1">Indicateurs SMSI</h2>
                <p className="text-xs text-gray-400 mb-5">Indicateurs de pilotage de la sécurité de l'information</p>

                <div className="space-y-3">
                    {ISO_INDICATEURS_DEF.map(({ key, label, unit, auto }) => {
                        const autoVal = auto ? getAutoValue(key) : null;
                        return (
                            <div key={key} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">{label}</p>
                                    {auto && <p className="text-xs text-gray-400 mt-0.5">Calculé automatiquement</p>}
                                </div>
                                {auto ? (
                                    <div className="w-40 px-3 py-2 text-sm font-semibold text-center rounded-lg" style={{ backgroundColor: 'var(--brand-red-light)', color: 'var(--brand-red)' }}>
                                        {autoVal}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 w-48">
                                        <input
                                            type="number"
                                            value={indicateurs[key] || ''}
                                            onChange={e => set(key, e.target.value)}
                                            placeholder="—"
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-right"
                                            style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                        />
                                        {unit && <span className="text-xs text-gray-400 flex-shrink-0">{unit}</span>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end mt-5">
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Enregistrer les indicateurs
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── TAB ISO : Placeholder ────────────────────────────────────────────────────

const TabPlaceholder = ({ titre, texte }) => (
    <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">{titre}</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">{texte}</p>
        </div>
    </div>
);

// ─── TAB ISO 3 : Déclaration d'Applicabilité (SoA) ───────────────────────────

const TabSoA = ({ referentiel, soaMap, setSoaEntry, soaDirty, savingSoa, onSave }) => {
    const [openThemes, setOpenThemes] = useState({});

    // Ouvrir le 1er thème par défaut
    useEffect(() => {
        if (referentiel?.domaines?.length > 0) {
            setOpenThemes({ [referentiel.domaines[0].id]: true });
        }
    }, [referentiel]);

    const toggleTheme = (id) => setOpenThemes(prev => ({ ...prev, [id]: !prev[id] }));

    // KPIs
    const allMesures = referentiel?.domaines?.flatMap(d => d.objectifs?.flatMap(o => o.mesures ?? []) ?? []) ?? [];
    const total = allMesures.length;
    const applicable = allMesures.filter(m => soaMap[m.id]?.applicable === true).length;
    const nonApplicable = allMesures.filter(m => soaMap[m.id]?.applicable === false).length;
    const undecided = total - applicable - nonApplicable;

    const toggleRaison = (mesureId, value) => {
        const current = soaMap[mesureId]?.raisons_inclusion ?? [];
        const next = current.includes(value)
            ? current.filter(r => r !== value)
            : [...current, value];
        setSoaEntry(mesureId, 'raisons_inclusion', next);
    };

    return (
        <div className="space-y-4">
            <TabInfo text="La Déclaration d'Applicabilité (SoA) est un document central de l'ISO 27001. Elle liste tous les contrôles de l'Annexe A et indique pour chacun s'il est applicable ou non, les raisons de son inclusion, son statut d'implémentation et les références documentaires associées." />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total contrôles', value: total, color: '#111827' },
                    { label: 'Applicables', value: applicable, color: '#16a34a' },
                    { label: 'Non applicables', value: nonApplicable, color: '#dc2626' },
                    { label: 'À décider', value: undecided, color: '#d97706' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Accordion par thème */}
            {referentiel?.domaines?.map(theme => {
                const isOpen = !!openThemes[theme.id];
                const themeMesures = theme.objectifs?.flatMap(o => o.mesures ?? []) ?? [];
                const themeApplicable = themeMesures.filter(m => soaMap[m.id]?.applicable === true).length;
                const themeTotal = themeMesures.length;

                return (
                    <div key={theme.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => toggleTheme(theme.id)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>
                                    {theme.code}
                                </span>
                                <span className="text-sm font-semibold text-gray-800">{theme.nom}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">{themeApplicable}/{themeTotal} applicables</span>
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${themeTotal > 0 ? (themeApplicable / themeTotal) * 100 : 0}%` }} />
                                </div>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </button>

                        {isOpen && (
                            <div className="border-t border-gray-100">
                                {theme.objectifs?.map(objectif => {
                                    const objDesc = stripObjectifPrefix(objectif.description || '');
                                    return (
                                    <div key={objectif.id} className="border-b border-gray-50 last:border-0">
                                        {/* En-tête objectif */}
                                        <div className="px-5 py-2.5 bg-gray-50/60">
                                            <p className="text-xs font-semibold text-gray-600">
                                                <span className="text-gray-400 mr-1">{objectif.code}</span>
                                                {objDesc}
                                            </p>
                                        </div>

                                        {/* Lignes contrôles */}
                                        {objectif.mesures?.map(mesure => {
                                            const entry = soaMap[mesure.id] || {};
                                            const isApplicable = entry.applicable;
                                            const raisons = entry.raisons_inclusion ?? [];

                                            return (
                                                <div key={mesure.id} className="px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                                    {/* Ligne principale */}
                                                    <div className="flex items-start gap-4">
                                                        {/* Code + tooltip */}
                                                        <div className="relative group flex-shrink-0 w-24">
                                                            <span className="font-mono text-xs text-gray-600 cursor-help underline decoration-dotted decoration-gray-400">
                                                                {mesure.code?.trim()}
                                                            </span>
                                                            <div className="absolute z-50 left-0 bottom-full mb-2 w-80 p-3 bg-gray-900 text-white rounded-lg shadow-2xl hidden group-hover:block pointer-events-none">
                                                                <p className="font-semibold text-gray-100 mb-1.5 text-xs">{mesure.code?.trim()}</p>
                                                                {mesure.description && <p className="text-gray-300 leading-relaxed text-[11px]">{mesure.description}</p>}
                                                                <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                                                            </div>
                                                        </div>

                                                        {/* Description de la règle */}
                                                        <p className="flex-1 text-xs text-gray-700 leading-relaxed">{mesure.description || objDesc}</p>

                                                        {/* Toggle applicable */}
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <button
                                                                onClick={() => setSoaEntry(mesure.id, 'applicable', isApplicable === true ? null : true)}
                                                                className={`px-2.5 py-1 text-xs font-medium rounded-l-md border transition ${isApplicable === true ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200 hover:border-green-400'}`}
                                                            >
                                                                Oui
                                                            </button>
                                                            <button
                                                                onClick={() => setSoaEntry(mesure.id, 'applicable', isApplicable === false ? null : false)}
                                                                className={`px-2.5 py-1 text-xs font-medium rounded-r-md border-t border-r border-b transition ${isApplicable === false ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-500 border-gray-200 hover:border-red-400'}`}
                                                            >
                                                                Non
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Détails si applicable = true */}
                                                    {isApplicable === true && (
                                                        <div className="mt-3 ml-28 space-y-3">
                                                            {/* Raisons d'inclusion */}
                                                            <div>
                                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Raisons d'inclusion</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {RAISONS_INCLUSION.map(r => (
                                                                        <label key={r.value} className="flex items-center gap-1.5 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={raisons.includes(r.value)}
                                                                                onChange={() => toggleRaison(mesure.id, r.value)}
                                                                                className="w-3 h-3 rounded accent-red-600"
                                                                            />
                                                                            <span className="text-xs text-gray-600">{r.label}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3">
                                                                {/* Statut implémentation */}
                                                                <div>
                                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Statut d'implémentation</p>
                                                                    <select
                                                                        value={entry.statut_implementation ?? ''}
                                                                        onChange={e => setSoaEntry(mesure.id, 'statut_implementation', e.target.value || null)}
                                                                        className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1"
                                                                    >
                                                                        <option value="">— Sélectionner —</option>
                                                                        {Object.entries(STATUT_IMPL_CONFIG).map(([k, v]) => (
                                                                            <option key={k} value={k}>{v.label}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                {/* Référence documentaire */}
                                                                <div>
                                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Référence documentaire</p>
                                                                    <input
                                                                        type="text"
                                                                        value={entry.reference_document ?? ''}
                                                                        onChange={e => setSoaEntry(mesure.id, 'reference_document', e.target.value || null)}
                                                                        placeholder="Ex : POL-SEC-001"
                                                                        className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Justification si non applicable */}
                                                    {isApplicable === false && (
                                                        <div className="mt-3 ml-28">
                                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Justification d'exclusion</p>
                                                            <textarea
                                                                value={entry.justification_exclusion ?? ''}
                                                                onChange={e => setSoaEntry(mesure.id, 'justification_exclusion', e.target.value || null)}
                                                                placeholder="Expliquer pourquoi ce contrôle n'est pas applicable..."
                                                                rows={2}
                                                                className="w-full text-xs border border-orange-200 rounded-md px-2 py-1.5 bg-orange-50 focus:outline-none focus:ring-1 resize-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ); })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Bouton flottant sauvegarde */}
            {soaDirty && (
                <div className="sticky bottom-4 flex justify-end">
                    <button
                        onClick={onSave}
                        disabled={savingSoa}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl shadow-lg transition disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        {savingSoa ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                        Sauvegarder la Déclaration d'Applicabilité
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuditDetailPage;
