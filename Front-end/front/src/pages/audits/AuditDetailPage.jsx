import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAuditById, updateAudit, getEvaluations, saveEvaluations, getSoA, saveSoA, soumettreAudit, validerAudit, rejeterAudit, changerPhase, getDocuments, uploadDocuments, deleteDocument, downloadDocument, updateDocumentStatut, soumettreValidationPlanning, repondreValidationPlanning, soumettreValidationRapport, repondreValidationRapport } from '../../services/endpoints/auditService';
import { getPlanActions, createPlanAction, updatePlanAction, deletePlanAction, soumettreValidationPlan, validerPlanAction, rejeterPlanAction } from '../../services/endpoints/planActionService';
import { getReferentielById } from '../../services/endpoints/referentielService';
import { getAllUsers } from '../../services/endpoints/userService';
import DateInput from '../../components/common/DateInput';
import ConfirmModal from '../../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import { useAuth } from '../../store/auth/AuthContext';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const stripNumericPrefix = (str = '') => str.replace(/^\d+[\.\s\t]+/, '').trim();
const stripObjectifPrefix = (str = '') => str.replace(/^Objectif\s+\d+\s*:\s*/i, '').trim();

// ─── Constantes ────────────────────────────────────────────────────────────────

const PHASES_DEF = [
    { id: 'cadrage', label: 'Cadrage' },
    { id: 'prerequis', label: 'Prérequis' },
    { id: 'revue_documentaire', label: 'Revue doc.' },
    { id: 'realisation', label: 'Réalisation' },
    { id: 'termine', label: 'Terminé' },
];

const PhasesStepper = ({ phase, canChange, onPrev, changing }) => {
    const currentIdx = PHASES_DEF.findIndex(p => p.id === phase);
    const idx = currentIdx < 0 ? 0 : currentIdx;
    return (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center gap-1 flex-1 min-w-0">
                {PHASES_DEF.map((p, i) => {
                    const done = i < idx;
                    const current = i === idx;
                    return (
                        <div key={p.id} className="flex items-center gap-1">
                            {i > 0 && (
                                <div className="h-px w-4 flex-shrink-0" style={{ backgroundColor: i <= idx ? 'var(--brand-red)' : '#e5e7eb' }} />
                            )}
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition-all ${done ? 'bg-green-100 text-green-700' :
                                current ? 'text-white' :
                                    'bg-gray-100 text-gray-400'
                                }`} style={current ? { backgroundColor: 'var(--brand-red)' } : {}}>
                                {done ? '✓ ' : ''}{p.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            {canChange && idx > 0 && (
                <div className="ml-2 pl-2 border-l border-gray-100">
                    <button onClick={onPrev} disabled={changing}
                        className="px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50 transition">
                        ← Reculer
                    </button>
                </div>
            )}
        </div>
    );
};

const NIVEAUX = [
    { value: null, label: 'N/A', color: 'text-gray-400' },
    { value: 0, label: 'Aucun', color: 'text-red-600' },
    { value: 1, label: 'Initial', color: 'text-orange-500' },
    { value: 2, label: 'Reproductible', color: 'text-yellow-500' },
    { value: 3, label: 'Défini', color: 'text-blue-500' },
    { value: 4, label: 'Maitrisé', color: 'text-indigo-600' },
    { value: 5, label: 'Optimisé', color: 'text-green-600' },
];

const CONFORMITE_CONFIG = {
    conforme: { label: 'Totale', bg: 'bg-green-50', text: 'text-green-700' },
    partiel: { label: 'Partielle', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    non_conforme: { label: 'Non conforme', bg: 'bg-red-50', text: 'text-red-700' },
    nc_mineure: { label: 'NC mineure', bg: 'bg-orange-50', text: 'text-orange-700' },
    nc_majeure: { label: 'NC majeure', bg: 'bg-red-50', text: 'text-red-700' },
    na: { label: 'N/A', bg: 'bg-gray-100', text: 'text-gray-500' },
};

const STATUT_CONFIG = {
    brouillon: { label: 'Brouillon', bg: 'bg-gray-100', text: 'text-gray-600' },
    en_cours: { label: 'En cours', bg: 'bg-blue-50', text: 'text-blue-700' },
    termine: { label: 'Terminé', bg: 'bg-green-50', text: 'text-green-700' },
    archive: { label: 'Archivé', bg: 'bg-yellow-50', text: 'text-yellow-700' },
};

const TABS_DNSSI = [
    { id: 'description', label: 'Description outil évaluation' },
    { id: 'identification', label: 'Identification entité ou IIV' },
    { id: 'evaluation', label: 'Évaluation MO DNSSI' },
    { id: 'synthese_mat', label: 'Synthèse niveau de maturité' },
    { id: 'synthese_conf', label: 'Synthèse niveau de conformité' },
    { id: 'avancement', label: "État d'avancement" },
    { id: 'plans_actions', label: "Plan d'actions" },
    { id: 'indicateurs', label: 'Indicateurs de la SSI' },
];

const TABS_ISO = [
    { id: 'description', label: "Description de l'audit" },
    { id: 'identification', label: "Identification de l'organisme" },
    { id: 'exigences_smsi', label: 'Exigences SMSI (§4-10)' },
    { id: 'soa', label: "Déclaration d'Applicabilité" },
    { id: 'evaluation_iso', label: 'Évaluation Annexe A' },
    { id: 'plans_actions', label: "Plan d'actions" },
    { id: 'synthese_iso', label: 'Synthèse par thème' },
    { id: 'nc', label: 'Non-conformités' },
    { id: 'indicateurs_iso', label: 'Indicateurs SMSI' },
];

// Raisons d'inclusion ISO 27001
const RAISONS_INCLUSION = [
    { value: 'legal', label: 'Exigence légale / réglementaire' },
    { value: 'contractuel', label: 'Exigence contractuelle' },
    { value: 'risque', label: 'Résultat d\'appréciation des risques' },
    { value: 'bonne_pratique', label: 'Bonne pratique retenue' },
];

const STATUT_IMPL_CONFIG = {
    implemente: { label: 'Implémenté', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    partiel: { label: 'Partiellement impl.', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    planifie: { label: 'Planifié', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    non_implemente: { label: 'Non implémenté', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const INDICATEURS_DEF = [
    { key: 'taux_organisation_ssi', label: "Taux de conformité — Organisation SSI (Objectif 2)", auto: true },
    { key: 'taux_actifs_info', label: "Taux de conformité — Actifs informationnels (Objectif 7)", auto: true },
    { key: 'budget_ssi_ratio', label: "Taux de budget consacré aux projets SSI / budget SI", unit: '%' },
    { key: 'journaux_traites', label: "Taux de plateformes dont les journaux d'événements sont traités", unit: '%' },
    { key: 'incidents_indispo', label: "Nombre d'incidents induisant l'indisponibilité d'un service", unit: '/an' },
    { key: 'incidents_perte_donnees', label: "Nombre d'incidents de perte de données sensibles", unit: '/an' },
    { key: 'taux_patch', label: "Taux d'application de patch et mises à jour", unit: '%' },
    { key: 'freq_sauvegardes', label: "Fréquence de vérification des sauvegardes", unit: '/an' },
    { key: 'taux_pra', label: "Taux de systèmes critiques disposant d'un PRA", unit: '%' },
    { key: 'nb_audits', label: "Nombre d'audits effectués", unit: '/an' },
    { key: 'taux_sensibilisation', label: "Taux d'utilisateurs sensibilisés en SSI", unit: '%' },
    { key: 'taux_admins_formes', label: "Taux d'administrateurs formés en SSI", unit: '%' },
];

const ISO_INDICATEURS_DEF = [
    { key: 'iso_risques_traites', label: "Nombre de risques identifiés et traités", unit: '' },
    { key: 'iso_taux_nc', label: "Taux de non-conformités (contrôles NC / applicables)", auto: 'nc' },
    { key: 'iso_taux_conf', label: "Taux de contrôles conformes (Annexe A)", auto: 'conf' },
    { key: 'iso_taux_impl', label: "Taux de contrôles implémentés (SoA)", auto: 'impl' },
    { key: 'iso_incidents_smsi', label: "Nombre d'incidents de sécurité déclarés", unit: '/an' },
    { key: 'iso_audits_internes', label: "Nombre d'audits internes réalisés", unit: '/an' },
    { key: 'iso_rev_direction', label: "Nombre de revues de direction réalisées", unit: '/an' },
    { key: 'iso_taux_sensibilisation', label: "Taux de personnel sensibilisé ISO 27001", unit: '%' },
    { key: 'iso_actions_clot', label: "Nombre d'actions correctives clôturées", unit: '' },
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

const isoConformite = (niveau) => {
    if (niveau === null || niveau === undefined) return 'na';
    if (niveau === 5) return 'conforme';
    if (niveau === 2) return 'nc_mineure';
    return 'nc_majeure';
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
    en_attente: { label: 'En attente de validation', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    valide: { label: 'Validé', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    rejete: { label: 'Rejeté', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
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
    const [validating, setValidating] = useState(false);
    const [changingPhase, setChangingPhase] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showRejeterAudit, setShowRejeterAudit] = useState(false);
    const [rejetingPlanId, setRejetingPlanId] = useState(null);

    // Chargement initial
    useEffect(() => {
        const load = async () => {
            try {
                const canFetchUsers = ['admin', 'auditeur_senior'].includes(user?.role);
                const [auditRes, evalsRes, usersRes] = await Promise.all([
                    getAuditById(id),
                    getEvaluations(id),
                    canFetchUsers ? getAllUsers() : Promise.resolve({ data: { users: [] } }),
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

    // Chargement documents (prerequis + revue_documentaire)
    useEffect(() => {
        if (!audit?.phase) return;
        if (audit.phase === 'prerequis' || audit.phase === 'revue_documentaire') {
            getDocuments(id).then(r => setDocuments(r.data.documents || [])).catch(() => { });
        }
    }, [audit?.phase, id]);

    const handleUploadDocuments = async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const fd = new FormData();
            Array.from(files).forEach(f => fd.append('fichiers', f));
            const res = await uploadDocuments(id, fd);
            const refreshed = await getDocuments(id);
            setDocuments(refreshed.data.documents || []);
            toast.success(`${res.data.documents.length} fichier(s) déposé(s).`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur lors du dépôt.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (docId) => {
        try {
            await deleteDocument(id, docId);
            setDocuments(prev => prev.filter(d => d.id !== docId));
            toast.success('Document supprimé.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur lors de la suppression.');
        }
    };

    const handleDownloadDocument = async (docId, nomOriginal) => {
        try {
            const res = await downloadDocument(id, docId);
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url; a.download = nomOriginal; a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Erreur lors du téléchargement.');
        }
    };

    const handleFetchDocBlob = async (docId) => {
        const res = await downloadDocument(id, docId);
        return res.data;
    };

    const handleReplaceDocument = async (oldDocId, files) => {
        const fileArr = Array.isArray(files) ? files : Array.from(files);
        if (!fileArr || fileArr.length === 0) return;
        setUploading(true);
        try {
            await deleteDocument(id, oldDocId);
            const fd = new FormData();
            fileArr.forEach(f => fd.append('fichiers', f));
            fd.append('is_correction', 'true');
            await uploadDocuments(id, fd);
            const refreshed = await getDocuments(id);
            setDocuments(refreshed.data.documents || []);
            toast.success('Document corrigé et re-déposé.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors de la correction.');
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateDocStatut = async (docId, statut, constat) => {
        try {
            await updateDocumentStatut(id, docId, statut, constat);
            const res = await getDocuments(id);
            setDocuments(res.data.documents || []);
            toast.success(statut === 'valide' ? 'Document validé.' : 'Document refusé.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour du statut.');
        }
    };

    const [validatingClient, setValidatingClient] = useState(false);

    const handleValidationClient = async (type, action, commentaire) => {
        setValidatingClient(true);
        try {
            const fn = type === 'planning'
                ? (action === 'soumettre' ? soumettreValidationPlanning : repondreValidationPlanning)
                : (action === 'soumettre' ? soumettreValidationRapport : repondreValidationRapport);
            const res = action === 'soumettre'
                ? await fn(id)
                : await fn(id, action, commentaire);
            setAudit(prev => ({ ...prev, ...res.data.audit }));
            const msgs = {
                soumettre: 'Soumis au client pour validation.',
                valider: 'Planning validé.',
                demander_modification: 'Demande de modification envoyée.',
            };
            toast.success(msgs[action] || 'Mis à jour.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur.');
        } finally {
            setValidatingClient(false);
        }
    };

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
                recommandation: ev.recommandation || null,
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

    const handleBulkCreatePlanAction = async (dataList) => {
        try {
            const created = [];
            for (const data of dataList) {
                const res = await createPlanAction(id, data);
                created.push(res.data.plan_action);
            }
            setPlanActions(prev => [...created, ...prev]);
            toast.success(`${created.length} action(s) générée(s) depuis les recommandations.`);
        } catch {
            toast.error('Erreur lors de la génération automatique');
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

    const handleChangerPhase = async (direction) => {
        const phases = PHASES_DEF.map(p => p.id);
        const currentIdx = phases.indexOf(audit.phase || 'cadrage');
        const newPhase = phases[currentIdx + direction];
        if (!newPhase) return;
        setChangingPhase(true);
        try {
            await changerPhase(id, newPhase);
            const res = await getAuditById(id);
            setAudit(res.data.audit);
            toast.success(`Phase : ${PHASES_DEF[currentIdx + direction].label}`);
        } catch { toast.error('Erreur lors du changement de phase.'); }
        finally { setChangingPhase(false); }
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
            const evaluated = mesures.filter(m => localEvals[m.id] !== undefined);
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
    const identFilled = Object.values(identification).some(v => v && String(v).trim());
    const isoEvalsDone = Object.values(localEvals).some(e => e.niveau_maturite !== null && e.niveau_maturite !== undefined);
    const MANUAL_IND_KEYS = INDICATEURS_DEF.filter(i => !i.auto).map(i => i.key);
    const ISO_MANUAL_KEYS = ISO_INDICATEURS_DEF.filter(i => !i.auto).map(i => i.key);
    const tabStatus = {
        identification: identFilled,
        evaluation: totalEvaluated > 0,
        soa: Object.keys(soaMap).length > 0,
        evaluation_iso: isoEvalsDone,
        plans_actions: planActions.length > 0,
        indicateurs: MANUAL_IND_KEYS.some(k => indicateurs[k]),
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

    const isClient = user?.role === 'client';
    const isAssigned = audit?.auditeurs?.some(a => a.id === user?.id) || audit?.createur?.id === user?.id;
    const canSeeGraphs = user?.role !== 'auditeur_junior' || isAssigned || isClient;
    const isJunior = user?.role === 'auditeur_junior';
    const isSeniorOrAdmin = user?.role === 'admin' || user?.role === 'auditeur_senior';
    const canSoumettreAudit = isJunior && isAssigned && audit.statut_validation !== 'en_attente' && audit.statut_validation !== 'valide';
    const canValiderRejeter = isSeniorOrAdmin && audit.statut_validation === 'en_attente';
    const validationCfg = VALIDATION_CONFIG[audit.statut_validation];

    const GRAPH_TABS = [
        'plans_actions',
        ...(isISO ? ['synthese_iso', 'nc'] : ['synthese_mat', 'synthese_conf', 'avancement']),
    ];
    const tabs = (isISO ? TABS_ISO : TABS_DNSSI).filter(t => canSeeGraphs || !GRAPH_TABS.includes(t.id));

    return (
        <div className="-mx-6 -mt-6">
            {/* ── Bloc sticky : en-tête + bannières + onglets ── */}
            <div className="sticky z-20 bg-gray-50 px-6 pt-6 pb-3 shadow-sm" style={{ top: '-1.5rem' }}>
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
                        {(audit.phase === 'realisation' || audit.phase === 'termine') && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">{totalEvaluated}/{totalMesures} mesures évaluées</span>
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${totalMesures > 0 ? (totalEvaluated / totalMesures) * 100 : 0}%`, backgroundColor: 'var(--brand-red)' }} />
                                </div>
                            </div>
                        )}
                        {audit.statut !== 'termine' && audit.statut !== 'archive' && auditComplete && !isJunior && !isClient && (
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
                        {canSoumettreAudit && !isClient && (
                            <button onClick={handleSoumettreAudit} disabled={validating}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
                                style={{ backgroundColor: '#d97706' }}>
                                {validating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                                }
                                Soumettre pour validation
                            </button>
                        )}
                        {canValiderRejeter && !isClient && (
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

                {/* Bannière lecture seule client — uniquement en réalisation */}
                {isClient && audit.phase === 'realisation' && (
                    <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm text-blue-700">
                            <strong>Mode lecture seule</strong> — Vous consultez les résultats de l'audit de votre entité.
                        </p>
                    </div>
                )}

                {/* Stepper phases */}
                <PhasesStepper
                    phase={audit.phase || 'cadrage'}
                    canChange={isSeniorOrAdmin}
                    onPrev={() => handleChangerPhase(-1)}
                    changing={changingPhase}
                />

                {/* Onglets — uniquement en réalisation/terminé */}
                {(audit.phase === 'realisation' || audit.phase === 'termine') && (
                    <TabNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} tabStatus={tabStatus} />
                )}
            </div>{/* fin sticky */}

            <div className="px-6 pt-4 pb-6">

                {/* Phase cadrage */}
                {audit.phase === 'cadrage' && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                            <div className="flex items-start gap-3">
                                <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Phase de cadrage</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Définissez le périmètre, les objectifs et l'équipe.</p>
                                </div>
                            </div>
                            {isSeniorOrAdmin && (
                                <button onClick={() => handleChangerPhase(1)} disabled={changingPhase}
                                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
                                    style={{ backgroundColor: 'var(--brand-red)' }}>
                                    {changingPhase ? 'En cours…' : 'Passer aux Prérequis'}
                                    {!changingPhase && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>}
                                </button>
                            )}
                        </div>
                        <TabCadrage audit={audit} referentiel={referentiel} identification={identification} setIdentification={setIdentification} onSave={() => handleSaveInfo('identification', identification)} saving={savingInfo} readOnly={isClient} />
                        <TabIdentification identification={identification} setIdentification={setIdentification} onSave={() => handleSaveInfo('identification', identification)} saving={savingInfo} isISO={isISO} readOnly={isClient} />
                        <PlanningAuditCard
                            audit={audit}
                            identification={identification}
                            setIdentification={setIdentification}
                            onSave={() => handleSaveInfo('identification', identification)}
                            saving={savingInfo}
                            readOnly={isClient}
                        />
                        <ValidationClientCard
                            type="planning"
                            validation={audit.validation_planning}
                            isSeniorOrAdmin={isSeniorOrAdmin}
                            isClient={isClient}
                            onAction={handleValidationClient}
                            loading={validatingClient}
                        />
                    </div>
                )}

                {/* Phase prérequis */}
                {audit.phase === 'prerequis' && (
                    <div className="space-y-4">
                        {/* Bandeau rôle-spécifique */}
                        {isClient ? (
                            <div className="flex items-start gap-4 p-5 rounded-xl bg-orange-50 border border-orange-200">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-orange-900">Action requise — Dépôt des documents</p>
                                    <p className="text-xs text-orange-700 mt-1">Veuillez déposer tous les documents nécessaires à l'audit (politiques, procédures, rapports précédents…). L'équipe d'audit pourra ensuite les examiner.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Prérequis — collecte des documents</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {documents.length > 0 ? `${documents.length} fichier(s) reçu(s)` : 'En attente des documents du client'}
                                        </p>
                                    </div>
                                </div>
                                {isSeniorOrAdmin && (
                                    <button onClick={() => handleChangerPhase(1)} disabled={changingPhase}
                                        className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
                                        style={{ backgroundColor: 'var(--brand-red)' }}>
                                        {changingPhase ? 'En cours…' : 'Passer à la Revue doc'}
                                        {!changingPhase && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>}
                                    </button>
                                )}
                            </div>
                        )}
                        <DepotDocuments
                            documents={documents}
                            auditeursIds={(audit.auditeurs || []).map(a => a.id)}
                            uploading={uploading}
                            currentUserId={user?.id}
                            isSeniorOrAdmin={isSeniorOrAdmin}
                            isClient={isClient}
                            onUpload={handleUploadDocuments}
                            onDelete={handleDeleteDocument}
                            onDownload={handleDownloadDocument}
                            onFetchBlob={handleFetchDocBlob}
                            onReplace={handleReplaceDocument}
                        />
                    </div>
                )}

                {/* Phase revue documentaire */}
                {audit.phase === 'revue_documentaire' && (
                    <div className="space-y-4">
                        {/* Bandeau rôle-spécifique */}
                        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">
                                        {isClient ? 'Documents transmis — Revue en cours' : 'Revue documentaire — Analyse des fichiers'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {isClient
                                            ? "L'équipe d'audit examine vos documents. Vous serez notifié si une correction est requise."
                                            : `${documents.filter(d => d.uploader?.role === 'client').length} document(s) client à examiner`}
                                    </p>
                                </div>
                            </div>
                            {isSeniorOrAdmin && (
                                <button onClick={() => handleChangerPhase(1)} disabled={changingPhase}
                                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
                                    style={{ backgroundColor: 'var(--brand-red)' }}>
                                    {changingPhase ? 'En cours…' : 'Démarrer la Réalisation'}
                                    {!changingPhase && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>}
                                </button>
                            )}
                        </div>
                        <RevueDocuments
                            documents={documents}
                            isClient={isClient}
                            onDownload={handleDownloadDocument}
                            onFetchBlob={handleFetchDocBlob}
                            onUpdateStatut={handleUpdateDocStatut}
                            onReplace={isClient ? handleReplaceDocument : undefined}
                        />
                    </div>
                )}

                {/* Validation rapport final — phase terminé */}
                {audit.phase === 'termine' && (
                    <div className="mb-4">
                        <ValidationClientCard
                            type="rapport"
                            validation={audit.validation_rapport}
                            isSeniorOrAdmin={isSeniorOrAdmin}
                            isClient={isClient}
                            onAction={handleValidationClient}
                            loading={validatingClient}
                        />
                    </div>
                )}

                {/* Onglets — phases réalisation et terminé uniquement */}
                {(audit.phase === 'realisation' || audit.phase === 'termine') && (<>
                    {/* Contenu des onglets — communs */}
                    {activeTab === 'description' && <TabDescription audit={audit} totalMesures={totalMesures} totalEvaluated={totalEvaluated} tauxGlobal={tauxGlobal} isISO={isISO} onSave={handleUpdateAuditInfo} saving={savingInfo} readOnly={isClient || isJunior} />}
                    {activeTab === 'identification' && <TabIdentification identification={identification} setIdentification={setIdentification} onSave={() => handleSaveInfo('identification', identification)} saving={savingInfo} isISO={isISO} readOnly={isClient} />}

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
                            readOnly={isClient}
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
                            readOnly={isClient}
                        />
                    )}

                    {/* Onglets ISO 27001 */}
                    {isISO && activeTab === 'exigences_smsi' && (
                        <TabExigencesSMSI
                            referentiel={referentiel}
                            localEvals={localEvals}
                            setEval={setEval}
                            isDirty={isDirty}
                            saving={saving}
                            onSave={handleSaveEvals}
                            readOnly={isClient}
                        />
                    )}
                    {isISO && activeTab === 'soa' && (
                        <TabSoA
                            referentiel={referentiel}
                            soaMap={soaMap}
                            setSoaEntry={setSoaEntry}
                            soaDirty={soaDirty}
                            savingSoa={savingSoa}
                            onSave={handleSaveSoA}
                            readOnly={isClient}
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
                            readOnly={isClient}
                        />
                    )}
                    {isISO && activeTab === 'synthese_iso' && canSeeGraphs && <TabSyntheseISO referentiel={referentiel} soaMap={soaMap} localEvals={localEvals} />}
                    {isISO && activeTab === 'nc' && canSeeGraphs && <TabNC referentiel={referentiel} soaMap={soaMap} localEvals={localEvals} />}
                    {isISO && activeTab === 'indicateurs_iso' && <TabIndicateursISO referentiel={referentiel} soaMap={soaMap} localEvals={localEvals} indicateurs={indicateurs} setIndicateurs={setIndicateurs} onSave={() => handleSaveInfo('indicateurs', indicateurs)} saving={savingInfo} readOnly={isClient} />}

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
                            onBulkAdd={handleBulkCreatePlanAction}
                            onUpdate={handleUpdatePlanAction}
                            onDelete={handleDeletePlanAction}
                            onSoumettre={handleSoumettrePlan}
                            onValider={handleValiderPlan}
                            onRejeter={(planId) => setRejetingPlanId(planId)}
                            readOnly={isClient}
                        />
                    )}
                </>)}

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
            </div>{/* fin contenu */}
        </div>
    );
};

// ─── Navigation onglets ───────────────────────────────────────────────────────

const TabNav = ({ activeTab, setActiveTab, tabs, tabStatus = {} }) => {
    const navRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
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
                        className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id
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

const TabDescription = ({ audit, totalMesures, totalEvaluated, tauxGlobal, isISO, onSave, saving, readOnly }) => {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        nom: audit.nom || '',
        client: audit.client || '',
        perimetre: audit.perimetre || '',
        date_debut: audit.date_debut?.split('T')[0] || '',
        date_fin: audit.date_fin?.split('T')[0] || '',
    });

    useEffect(() => {
        if (!editing) {
            setForm({
                nom: audit.nom || '',
                client: audit.client || '',
                perimetre: audit.perimetre || '',
                date_debut: audit.date_debut?.split('T')[0] || '',
                date_fin: audit.date_fin?.split('T')[0] || '',
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
                    {!editing && !readOnly && (
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

                {editing && !readOnly ? (
                    <div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {[
                                { key: 'nom', label: "Nom de l'audit" },
                                { key: 'client', label: 'Client / Entité' },
                                { key: 'perimetre', label: 'Périmètre', span: true },
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
                                { key: 'date_fin', label: 'Date de fin prévue' },
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
                            { label: 'Client / Entité', value: audit.client || '—' },
                            { label: 'Périmètre', value: audit.perimetre || '—' },
                            { label: 'Date de début', value: fmtISODate(audit.date_debut) },
                            { label: 'Date de fin prévue', value: fmtISODate(audit.date_fin) },
                            { label: 'Créé par', value: audit.createur ? `${audit.createur.prenom} ${audit.createur.nom}` : '—' },
                            { label: 'Auditeurs', value: audit.auditeurs?.length > 0 ? audit.auditeurs.map(u => `${u.prenom} ${u.nom}`).join(', ') : '—' },
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

// ─── Planning de l'audit ─────────────────────────────────────────────────────

const ETAPES_DEF = [
    'Cadrage',
    'Prérequis / Collecte documents',
    'Revue documentaire',
    'Réalisation',
    'Rendu du rapport',
];

const PlanningAuditCard = ({ audit, identification, setIdentification, onSave, saving, readOnly }) => {
    const planning = identification.planning || {};
    const hasData = !!(planning.objectifs || planning.methodes || planning.documents_attendus || (planning.etapes || []).some(e => e.date_debut || e.date_fin));

    const [editing, setEditing] = useState(!readOnly && !hasData);

    const setP = (key, val) => setIdentification(prev => ({
        ...prev,
        planning: { ...(prev.planning || {}), [key]: val },
    }));

    const setEtape = (idx, field, val) => {
        const etapes = [...(planning.etapes || ETAPES_DEF.map(nom => ({ nom, date_debut: '', date_fin: '' })))];
        etapes[idx] = { ...etapes[idx], [field]: val };
        setP('etapes', etapes);
    };

    const etapes = planning.etapes || ETAPES_DEF.map(nom => ({ nom, date_debut: '', date_fin: '' }));

    const handleSave = () => { onSave(); setEditing(false); };

    const fmt = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('fr-FR') : '—';

    const InfoBlock = ({ label, value }) => !value ? null : (
        <div>
            <dt className="text-xs font-medium text-gray-500 mb-0.5">{label}</dt>
            <dd className="text-sm text-gray-800 whitespace-pre-wrap">{value}</dd>
        </div>
    );

    if (!editing) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-800">Planning de l'audit</h2>
                    {!readOnly && (
                        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                            Modifier
                        </button>
                    )}
                </div>

                {!hasData ? (
                    <p className="text-xs text-gray-400 italic">Planning non encore défini.</p>
                ) : (
                    <>
                        <dl className="space-y-4">
                            <InfoBlock label="Objectifs de l'audit" value={planning.objectifs} />
                            <InfoBlock label="Méthodes d'audit" value={planning.methodes} />
                            <InfoBlock label="Documents attendus du client" value={planning.documents_attendus} />
                        </dl>

                        {/* Équipe */}
                        {audit.auditeurs?.length > 0 && (
                            <div>
                                <dt className="text-xs font-medium text-gray-500 mb-1.5">Équipe d'audit</dt>
                                <div className="flex flex-wrap gap-2">
                                    {audit.auditeurs.map(a => (
                                        <span key={a.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                                            <span className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold">{(a.prenom?.[0] || '?').toUpperCase()}</span>
                                            {a.prenom} {a.nom}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Calendrier */}
                        <div>
                            <dt className="text-xs font-medium text-gray-500 mb-2">Calendrier prévisionnel</dt>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Étape</th>
                                        <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Début</th>
                                        <th className="text-left text-xs font-medium text-gray-500 pb-2">Fin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {etapes.map((e, i) => (
                                        <tr key={i} className="border-b border-gray-50">
                                            <td className="py-1.5 pr-4 text-gray-700 font-medium">{e.nom}</td>
                                            <td className="py-1.5 pr-4 text-gray-600">{fmt(e.date_debut)}</td>
                                            <td className="py-1.5 text-gray-600">{fmt(e.date_fin)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        );
    }
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Planning de l'audit</h2>
                {hasData && <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700 underline">Annuler</button>}
            </div>

            {/* Objectifs */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Objectifs de l'audit</h3>
                <textarea
                    rows={3}
                    value={planning.objectifs || ''}
                    onChange={e => setP('objectifs', e.target.value)}
                    placeholder="Décrire les objectifs de l'audit…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 resize-none"
                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                />
            </div>

            {/* Calendrier */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Calendrier prévisionnel</h3>
                <div className="space-y-2">
                    {etapes.map((e, i) => (
                        <div key={i} className="grid grid-cols-[1fr_160px_160px] gap-3 items-center">
                            <span className="text-sm font-medium text-gray-700">{e.nom}</span>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Début</label>
                                <input type="date" value={e.date_debut || ''} onChange={ev => setEtape(i, 'date_debut', ev.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Fin</label>
                                <input type="date" value={e.date_fin || ''} onChange={ev => setEtape(i, 'date_fin', ev.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Équipe */}
            {audit.auditeurs?.length > 0 && (
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Équipe d'audit</h3>
                    <div className="flex flex-wrap gap-2">
                        {audit.auditeurs.map(a => (
                            <span key={a.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                                {a.prenom} {a.nom}
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Auditeurs assignés à cet audit.</p>
                </div>
            )}

            {/* Méthodes */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Méthodes d'audit</h3>
                <textarea
                    rows={2}
                    value={planning.methodes || ''}
                    onChange={e => setP('methodes', e.target.value)}
                    placeholder="Entretiens, revue documentaire, tests techniques, observations terrain…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 resize-none"
                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                />
            </div>

            {/* Documents attendus */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Documents attendus du client</h3>
                <textarea
                    rows={3}
                    value={planning.documents_attendus || ''}
                    onChange={e => setP('documents_attendus', e.target.value)}
                    placeholder="Politique de sécurité, procédures internes, schémas réseau, contrats prestataires…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 resize-none"
                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                />
            </div>

            <div className="flex justify-end pt-1">
                <button onClick={handleSave} disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition">
                    {saving ? 'Enregistrement…' : 'Enregistrer le planning'}
                </button>
            </div>
        </div>
    );
};

// ─── Validation client ────────────────────────────────────────────────────────

const ValidationClientCard = ({ type, validation, isSeniorOrAdmin, isClient, onAction, loading }) => {
    const [commentaire, setCommentaire] = useState('');
    const [showModifForm, setShowModifForm] = useState(false);

    const titles = { planning: "Validation du planning par le client", rapport: "Validation du rapport final par le client" };
    const submitLabels = { planning: "Soumettre le planning au client", rapport: "Soumettre le rapport au client" };

    const statusConfig = {
        en_attente: { label: 'En attente de validation client', color: 'text-orange-700 bg-orange-50 border-orange-200' },
        valide: { label: 'Validé par le client', color: 'text-green-700 bg-green-50 border-green-200' },
        modification_demandee: { label: 'Modification demandée', color: 'text-red-700 bg-red-50 border-red-200' },
    };

    const statut = validation?.statut;
    const cfg = statut ? statusConfig[statut] : null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">{titles[type]}</h3>

            {/* Pas encore soumis */}
            {!validation && isSeniorOrAdmin && (
                <button
                    onClick={() => onAction(type, 'soumettre')}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                    {loading ? 'Envoi…' : submitLabels[type]}
                </button>
            )}
            {!validation && !isSeniorOrAdmin && (
                <p className="text-xs text-gray-400 italic">Non encore soumis au client.</p>
            )}

            {/* Badge statut */}
            {cfg && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${cfg.color}`}>
                    <span>{cfg.label}</span>
                    {validation.date && <span className="ml-auto opacity-70">{new Date(validation.date).toLocaleDateString('fr-FR')}</span>}
                </div>
            )}

            {/* Commentaire modification demandée */}
            {statut === 'modification_demandee' && validation.commentaire && (
                <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                    <span className="font-medium">Motif : </span>{validation.commentaire}
                </div>
            )}

            {/* Client peut répondre si en_attente */}
            {statut === 'en_attente' && isClient && (
                <div className="flex flex-col gap-3">
                    {!showModifForm ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onAction(type, 'valider')}
                                disabled={loading}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                Valider
                            </button>
                            <button
                                onClick={() => setShowModifForm(true)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                                Demander des modifications
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                rows={3}
                                value={commentaire}
                                onChange={e => setCommentaire(e.target.value)}
                                placeholder="Décrivez les modifications souhaitées…"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 resize-none"
                                style={{ color: '#111827' }}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { onAction(type, 'demander_modification', commentaire); setShowModifForm(false); setCommentaire(''); }}
                                    disabled={loading || !commentaire.trim()}
                                    className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition"
                                >
                                    {loading ? 'Envoi…' : 'Envoyer la demande'}
                                </button>
                                <button onClick={() => setShowModifForm(false)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Annuler</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Senior/admin peut resoumettre si modification demandée ou déjà soumis */}
            {(statut === 'modification_demandee') && isSeniorOrAdmin && (
                <button
                    onClick={() => onAction(type, 'soumettre')}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
                >
                    {loading ? 'Envoi…' : 'Resoumettre au client'}
                </button>
            )}
        </div>
    );
};

// ─── Documents client ─────────────────────────────────────────────────────────

const FILE_ICONS = {
    'application/pdf': '📄',
    'application/msword': '📝',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'image/jpeg': '🖼️',
    'image/png': '🖼️',
};
const fileIcon = (mime) => FILE_ICONS[mime] || '📎';
const fmtSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const PREVIEWABLE = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain'];

const DocumentPreviewModal = ({ doc, onClose, onFetchBlob, onDownload }) => {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const canPreview = PREVIEWABLE.includes(doc.mime);
    const isImage = doc.mime?.startsWith('image/');

    useEffect(() => {
        let url = null;
        if (!canPreview) { setLoading(false); return; }
        onFetchBlob(doc.id)
            .then(blob => {
                url = URL.createObjectURL(new Blob([blob], { type: doc.mime }));
                setBlobUrl(url);
            })
            .catch(() => setFetchError(true))
            .finally(() => setLoading(false));
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [doc.id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden" style={{ height: '85vh' }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{fileIcon(doc.mime)}</span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{doc.nom}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{fmtSize(doc.taille)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <button onClick={() => onDownload(doc.id, doc.nom)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            Télécharger
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
                {/* Body */}
                <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
                    {loading && <p className="text-gray-400 text-sm animate-pulse">Chargement…</p>}
                    {!loading && fetchError && (
                        <div className="text-center">
                            <svg className="w-12 h-12 text-red-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                            <p className="text-gray-700 font-medium mb-1">Impossible de charger l'aperçu</p>
                            <p className="text-gray-400 text-sm mb-5">Le fichier est peut-être indisponible sur le serveur.</p>
                            <button onClick={() => onDownload(doc.id, doc.nom)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                Télécharger quand même
                            </button>
                        </div>
                    )}
                    {!loading && !fetchError && blobUrl && isImage && (
                        <img src={blobUrl} alt={doc.nom} className="max-w-full max-h-full object-contain rounded shadow" />
                    )}
                    {!loading && !fetchError && blobUrl && !isImage && (
                        <iframe src={blobUrl} title={doc.nom} className="w-full h-full rounded" style={{ border: 'none', minHeight: '400px' }} />
                    )}
                    {!loading && !fetchError && !canPreview && (
                        <div className="text-center">
                            <span className="text-6xl block mb-5">{fileIcon(doc.mime)}</span>
                            <p className="text-gray-700 font-medium mb-2">{doc.nom}</p>
                            <p className="text-gray-400 text-sm mb-6">Aperçu non disponible pour ce format.</p>
                            <button onClick={() => onDownload(doc.id, doc.nom)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                Télécharger
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Sous-liste documents partagée ─────────────────────────────────────────────
const DocSubList = ({ docs, canUpload, uploading, currentUserId, isSeniorOrAdmin, onUpload, onDelete, onDownload, onReplace, setPreview, accentColor }) => {
    const inputRef  = useRef(null);
    const replaceRef = useRef(null);
    const [replacingId, setReplacingId] = useState(null);
    const [dragging, setDragging] = useState(false);
    const colors = {
        orange: { border: 'border-orange-300', bg: 'bg-orange-50', hover: 'hover:border-orange-300 hover:bg-orange-50/40', text: 'text-orange-500', pulse: 'text-orange-600' },
        blue:   { border: 'border-blue-300',   bg: 'bg-blue-50',   hover: 'hover:border-blue-300 hover:bg-blue-50/40',   text: 'text-blue-500',   pulse: 'text-blue-600'   },
    };
    const c = colors[accentColor] || colors.blue;
    return (
        <div className="space-y-2">
            {canUpload && (
                <>
                <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); onUpload(e.dataTransfer.files); }}
                    onClick={() => !uploading && inputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? `${c.border} ${c.bg}` : `border-gray-200 ${c.hover}`}`}
                >
                    {uploading ? <p className={`text-sm font-medium animate-pulse ${c.pulse}`}>Dépôt en cours…</p> : (
                        <>
                        <svg className={`w-8 h-8 mx-auto mb-2 ${c.text} opacity-60`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                        <p className="text-sm font-semibold text-gray-700">Glissez vos fichiers ici</p>
                        <p className={`text-xs mt-1 ${c.text} font-medium`}>ou cliquez pour sélectionner</p>
                        <p className="text-xs text-gray-300 mt-2">PDF · Word · Excel · Image — 10 Mo max</p>
                        </>
                    )}
                </div>
                <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                    className="hidden" onChange={e => { onUpload(e.target.files); e.target.value = ''; }} />
                </>
            )}
            {docs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Aucun document déposé.</p>
            ) : (
                <>
                <input ref={replaceRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                    className="hidden" onChange={e => { if (replacingId) { onReplace(replacingId, e.target.files); setReplacingId(null); } e.target.value = ''; }} />
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {docs.map(doc => {
                        const canDelete = isSeniorOrAdmin || doc.uploaded_by === currentUserId;
                        const isRefused = doc.statut === 'refuse';
                        return (
                            <div key={doc.id} className={`px-4 py-3 ${isRefused ? 'bg-red-50/40' : ''}`}>
                                {/* Constat refus visible pour le client */}
                                {isRefused && doc.constat && (
                                    <div className="flex items-start gap-1.5 mb-2 p-2 rounded-lg bg-red-50 border border-red-100">
                                        <svg className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                        <div>
                                            <p className="text-xs font-semibold text-red-700">Document refusé</p>
                                            <p className="text-xs text-red-600 mt-0.5">{doc.constat}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <span className="text-lg flex-shrink-0">{fileIcon(doc.type_mime)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{doc.nom_original}</p>
                                        <p className="text-xs text-gray-400">{fmtSize(doc.taille)} · {new Date(doc.createdAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {isRefused && onReplace && (
                                            <button
                                                onClick={() => { setReplacingId(doc.id); replaceRef.current?.click(); }}
                                                disabled={uploading}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition"
                                                title="Déposer une correction"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                                Corriger
                                            </button>
                                        )}
                                        <button onClick={() => PREVIEWABLE.includes(doc.type_mime) ? setPreview({ id: doc.id, nom: doc.nom_original, mime: doc.type_mime, taille: doc.taille }) : onDownload(doc.id, doc.nom_original)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title={PREVIEWABLE.includes(doc.type_mime) ? 'Visualiser' : 'Télécharger'}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </button>
                                        <button onClick={() => onDownload(doc.id, doc.nom_original)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Télécharger">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                        </button>
                                        {canDelete && onDelete && !isRefused && (
                                            <button onClick={() => onDelete(doc.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                </>
            )}
        </div>
    );
};

// ── Zone de dépôt — deux sections : client / auditeurs (prérequis) ────────────
const DepotDocuments = ({ documents, auditeursIds = [], uploading, currentUserId, isSeniorOrAdmin, isClient, onUpload, onDelete, onDownload, onFetchBlob, onReplace }) => {
    const [preview, setPreview] = useState(null);

    const docsClient    = documents.filter(d => d.uploader?.role === 'client');
    const docsAuditeurs = documents.filter(d => d.uploader?.role !== 'client');

    return (
        <>
        {preview && <DocumentPreviewModal doc={preview} onClose={() => setPreview(null)} onFetchBlob={onFetchBlob} onDownload={onDownload} />}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Section client */}
            <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border-b border-orange-100">
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    <span className="text-sm font-semibold text-orange-800">Documents du client</span>
                    {docsClient.length > 0 && <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-orange-200 text-orange-700">{docsClient.length}</span>}
                </div>
                <div className="p-4">
                    <DocSubList
                        docs={docsClient}
                        canUpload={isClient}
                        uploading={uploading}
                        currentUserId={currentUserId}
                        isSeniorOrAdmin={isSeniorOrAdmin}
                        onUpload={onUpload}
                        onDelete={onDelete}
                        onDownload={onDownload}
                        onReplace={isClient ? onReplace : null}
                        setPreview={setPreview}
                        accentColor="orange"
                    />
                </div>
            </div>

            {/* Section auditeurs */}
            <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border-b border-blue-100">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                    <span className="text-sm font-semibold text-blue-800">Documents des auditeurs</span>
                    {docsAuditeurs.length > 0 && <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-200 text-blue-700">{docsAuditeurs.length}</span>}
                </div>
                <div className="p-4">
                    <DocSubList
                        docs={docsAuditeurs}
                        canUpload={!isClient}
                        uploading={uploading}
                        currentUserId={currentUserId}
                        isSeniorOrAdmin={isSeniorOrAdmin}
                        onUpload={onUpload}
                        onDelete={onDelete}
                        onDownload={onDownload}
                        setPreview={setPreview}
                        accentColor="blue"
                    />
                </div>
            </div>
        </div>
        </>
    );
};

// ── Grille de consultation — revue documentaire (auditeur valide/refuse) ───────
const STATUT_BADGE = {
    en_attente:  { label: 'En attente',  cls: 'bg-gray-100 text-gray-500' },
    valide:      { label: 'Validé',      cls: 'bg-green-100 text-green-700' },
    refuse:      { label: 'Refusé',      cls: 'bg-red-100 text-red-700' },
};

const RevueDocuments = ({ documents, isClient, onDownload, onFetchBlob, onUpdateStatut, onReplace }) => {
    const [preview, setPreview]       = useState(null);
    const [examined, setExamined]     = useState(new Set());
    const [refuseId, setRefuseId]     = useState(null);
    const [constatMap, setConstatMap] = useState({});
    const [saving, setSaving]         = useState(false);
    const [refOpen, setRefOpen]       = useState(false);
    const [docTab, setDocTab]         = useState(isClient ? 'auditeur' : 'client');
    const replaceRef                  = useRef(null);
    const [replacingId, setReplacingId] = useState(null);

    const docsClient    = documents.filter(d => d.uploader?.role === 'client');
    const docsAuditeurs = documents.filter(d => d.uploader?.role !== 'client');

    const handleConsulter = (doc) => {
        setExamined(prev => new Set([...prev, doc.id]));
        if (PREVIEWABLE.includes(doc.type_mime)) {
            setPreview({ id: doc.id, nom: doc.nom_original, mime: doc.type_mime, taille: doc.taille });
        } else {
            onDownload(doc.id, doc.nom_original);
        }
    };

    const handleValider = async (doc) => {
        setSaving(true);
        await onUpdateStatut(doc.id, 'valide', null);
        setSaving(false);
    };

    const handleRefuser = async (doc) => {
        const constat = (constatMap[doc.id] || '').trim();
        if (!constat) return;
        setSaving(true);
        await onUpdateStatut(doc.id, 'refuse', constat);
        setRefuseId(null);
        setSaving(false);
    };

    const validatedCount = docsClient.filter(d => d.statut === 'valide').length;
    const total = docsClient.length;
    const pct = total > 0 ? Math.round((validatedCount / total) * 100) : 0;
    const allDone = total > 0 && docsClient.every(d => d.statut !== 'en_attente');

    return (
        <>
        {preview && <DocumentPreviewModal doc={preview} onClose={() => setPreview(null)} onFetchBlob={onFetchBlob} onDownload={onDownload} />}
        {onReplace && (
            <input ref={replaceRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                className="hidden" onChange={e => { if (replacingId) { const files = Array.from(e.target.files); e.target.value = ''; onReplace(replacingId, files); setReplacingId(null); } else { e.target.value = ''; } }} />
        )}

        {/* ── Onglets navigation ── */}
        <div className="flex border-b border-gray-200">
            {(isClient
                ? [
                    { id: 'auditeur', label: "Documents auditeur", docs: docsAuditeurs },
                    { id: 'client',   label: 'Mes documents',      docs: docsClient    },
                ]
                : [
                    { id: 'client',   label: 'Documents client',   docs: docsClient    },
                    { id: 'auditeur', label: 'Mes dépôts',         docs: docsAuditeurs },
                ]
            ).map(tab => {
                const refused = tab.docs.filter(d => d.statut === 'refuse').length;
                const pending = tab.docs.filter(d => d.statut === 'en_attente').length;
                const active  = docTab === tab.id;
                const badgeCls = refused > 0 ? 'bg-red-100 text-red-600' : pending > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500';
                return (
                    <button key={tab.id} onClick={() => setDocTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${active ? 'border-current' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        style={active ? { color: 'var(--brand-red)', borderColor: 'var(--brand-red)' } : {}}>
                        {tab.label}
                        {tab.docs.length > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeCls}`}>{tab.docs.length}</span>}
                    </button>
                );
            })}
        </div>

        {/* ── Documents client à valider ─────────────────────────── */}
        {docTab === 'client' && (docsClient.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                </div>
                <p className="text-sm font-medium text-gray-500">Aucun document transmis par le client</p>
                <p className="text-xs text-gray-400 mt-1">Les documents apparaîtront ici une fois déposés dans la phase Prérequis</p>
            </div>
        ) : (
            <>
            {/* ── Header progression ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Validation des documents</p>
                        <p className="text-xs text-gray-400 mt-0.5">{total} document{total > 1 ? 's' : ''} à examiner</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-extrabold tracking-tight" style={{ color: allDone ? '#16a34a' : 'var(--brand-red)' }}>{pct}%</p>
                        <p className="text-xs text-gray-400">{validatedCount}/{total} traité{validatedCount > 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: allDone ? '#16a34a' : 'var(--brand-red)' }} />
                </div>
                {allDone && (
                    <div className="flex items-center gap-1.5 mt-2.5">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-xs font-semibold text-green-600">Tous les documents ont été examinés</p>
                    </div>
                )}
            </div>

            {/* ── Liste documents ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {docsClient.map((doc, idx) => {
                    const badge      = STATUT_BADGE[doc.statut] || STATUT_BADGE.en_attente;
                    const isRefusing = refuseId === doc.id;
                    const examined_  = examined.has(doc.id);
                    const accent     = doc.statut === 'valide' ? '#16a34a'
                                     : doc.statut === 'refuse' ? '#dc2626'
                                     : doc.is_correction       ? '#ea580c'
                                     : '#e5e7eb';
                    return (
                        <div key={doc.id} className={idx > 0 ? 'border-t border-gray-100' : ''}>
                            {/* Ligne principale */}
                            <div className="flex items-center gap-3 px-4 py-3" style={{ borderLeft: `3px solid ${accent}` }}>
                                <span className="text-base flex-shrink-0">{fileIcon(doc.type_mime)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{doc.nom_original}</p>
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
                                        {doc.is_correction && doc.statut === 'en_attente' && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex-shrink-0">
                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                                Corrigé
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {fmtSize(doc.taille)} · {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {examined_ && <span className="ml-1.5 text-gray-300">· Consulté</span>}
                                    </p>
                                </div>

                                {/* Actions — une seule rangée */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={() => handleConsulter(doc)} title={examined_ ? 'Revoir' : 'Consulter'}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${examined_ ? 'text-gray-500 hover:bg-gray-50 border border-gray-200' : 'text-white hover:opacity-90'}`}
                                        style={examined_ ? {} : { backgroundColor: 'var(--brand-red)' }}>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {examined_ ? 'Revoir' : 'Consulter'}
                                    </button>

                                    {!isClient && (
                                        <>
                                        <button onClick={() => handleValider(doc)} disabled={saving || doc.statut === 'valide'}
                                            title="Valider" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-30 transition">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                        </button>
                                        <button onClick={() => setRefuseId(isRefusing ? null : doc.id)} disabled={saving || doc.statut === 'refuse'}
                                            title="Refuser" className={`p-1.5 rounded-lg transition disabled:opacity-30 ${isRefusing ? 'bg-red-50 text-red-600' : 'text-red-400 hover:bg-red-50 hover:text-red-600'}`}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                        </>
                                    )}

                                    {isClient && doc.statut === 'refuse' && onReplace && (
                                        <button onClick={() => { setReplacingId(doc.id); replaceRef.current?.click(); }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                            Corriger
                                        </button>
                                    )}

                                    <button onClick={() => onDownload(doc.id, doc.nom_original)} title="Télécharger"
                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Constat refus — expansion inline */}
                            {doc.statut === 'refuse' && doc.constat && (
                                <div className="px-4 pb-3" style={{ borderLeft: '3px solid #dc2626' }}>
                                    <div className="ml-7 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Constat · </span>
                                        <span className="text-xs text-red-700">{doc.constat}</span>
                                    </div>
                                </div>
                            )}

                            {/* Formulaire de refus — expansion inline */}
                            {isRefusing && !isClient && (
                                <div className="px-4 pb-3" style={{ borderLeft: '3px solid #dc2626' }}>
                                    <div className="ml-7 space-y-2">
                                        <textarea rows={2}
                                            value={constatMap[doc.id] || ''}
                                            onChange={e => setConstatMap(m => ({ ...m, [doc.id]: e.target.value }))}
                                            placeholder="Décrivez les modifications à apporter…"
                                            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleRefuser(doc)} disabled={saving || !(constatMap[doc.id] || '').trim()}
                                                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition">
                                                Confirmer le refus
                                            </button>
                                            <button onClick={() => setRefuseId(null)}
                                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition">
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            </>
        ))}

        {/* ── Onglet : documents auditeurs ─────────────────────────── */}
        {docTab === 'auditeur' && (<>
        {isClient && docsAuditeurs.length === 0 && (
            <div className="py-10 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm font-medium text-gray-500">Aucun document déposé par l'auditeur</p>
                <p className="text-xs text-gray-400 mt-1">Les documents apparaîtront ici une fois déposés</p>
            </div>
        )}
        {isClient && docsAuditeurs.length > 0 && (
            <>
            {/* Header progression */}
            {(() => {
                const clientTotal     = docsAuditeurs.length;
                const clientValidated = docsAuditeurs.filter(d => d.statut === 'valide').length;
                const clientPct       = Math.round((clientValidated / clientTotal) * 100);
                const clientAllDone   = docsAuditeurs.every(d => d.statut !== 'en_attente');
                return (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Documents déposés par l'auditeur</p>
                                <p className="text-xs text-gray-400 mt-0.5">{clientTotal} document{clientTotal > 1 ? 's' : ''} à valider</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-extrabold tracking-tight" style={{ color: clientAllDone ? '#16a34a' : 'var(--brand-red)' }}>{clientPct}%</p>
                                <p className="text-xs text-gray-400">{clientValidated}/{clientTotal} traité{clientValidated > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all duration-700"
                                style={{ width: `${clientPct}%`, backgroundColor: clientAllDone ? '#16a34a' : 'var(--brand-red)' }} />
                        </div>
                    </div>
                );
            })()}

            {/* Liste docs auditeurs — validation symétrique */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {docsAuditeurs.map((doc, idx) => {
                    const badge      = STATUT_BADGE[doc.statut] || STATUT_BADGE.en_attente;
                    const isRefusing = refuseId === doc.id;
                    const examined_  = examined.has(doc.id);
                    const accent     = doc.statut === 'valide' ? '#16a34a'
                                     : doc.statut === 'refuse' ? '#dc2626'
                                     : '#e5e7eb';
                    return (
                        <div key={doc.id} className={idx > 0 ? 'border-t border-gray-100' : ''}>
                            <div className="flex items-center gap-3 px-4 py-3" style={{ borderLeft: `3px solid ${accent}` }}>
                                <span className="text-base flex-shrink-0">{fileIcon(doc.type_mime)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{doc.nom_original}</p>
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {fmtSize(doc.taille)} · {doc.uploader?.prenom} {doc.uploader?.nom}
                                        {examined_ && <span className="ml-1.5 text-gray-300">· Consulté</span>}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={() => handleConsulter(doc)} title={examined_ ? 'Revoir' : 'Consulter'}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${examined_ ? 'text-gray-500 hover:bg-gray-50 border border-gray-200' : 'text-white hover:opacity-90'}`}
                                        style={examined_ ? {} : { backgroundColor: 'var(--brand-red)' }}>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {examined_ ? 'Revoir' : 'Consulter'}
                                    </button>
                                    <button onClick={() => handleValider(doc)} disabled={saving || doc.statut === 'valide'}
                                        title="Valider" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-30 transition">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                    </button>
                                    <button onClick={() => setRefuseId(isRefusing ? null : doc.id)} disabled={saving || doc.statut === 'refuse'}
                                        title="Demander une modification" className={`p-1.5 rounded-lg transition disabled:opacity-30 ${isRefusing ? 'bg-red-50 text-red-600' : 'text-red-400 hover:bg-red-50 hover:text-red-600'}`}>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    <button onClick={() => onDownload(doc.id, doc.nom_original)} title="Télécharger"
                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                    </button>
                                </div>
                            </div>
                            {doc.statut === 'refuse' && doc.constat && (
                                <div className="px-4 pb-3" style={{ borderLeft: '3px solid #dc2626' }}>
                                    <div className="ml-7 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Constat · </span>
                                        <span className="text-xs text-red-700">{doc.constat}</span>
                                    </div>
                                </div>
                            )}
                            {isRefusing && (
                                <div className="px-4 pb-3" style={{ borderLeft: '3px solid #dc2626' }}>
                                    <div className="ml-7 space-y-2">
                                        <textarea rows={2}
                                            value={constatMap[doc.id] || ''}
                                            onChange={e => setConstatMap(m => ({ ...m, [doc.id]: e.target.value }))}
                                            placeholder="Précisez les modifications demandées…"
                                            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleRefuser(doc)} disabled={saving || !(constatMap[doc.id] || '').trim()}
                                                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition">
                                                Confirmer
                                            </button>
                                            <button onClick={() => setRefuseId(null)}
                                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition">
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            </>
        )}

        {/* ── Vue AUDITEUR : docs auditeurs en lecture seule + statut client ── */}
        {!isClient && docsAuditeurs.length === 0 && (
            <div className="py-10 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm font-medium text-gray-500">Aucun document déposé pour le moment</p>
                <p className="text-xs text-gray-400 mt-1">Vos dépôts apparaîtront ici avec la décision du client</p>
            </div>
        )}
        {!isClient && docsAuditeurs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {docsAuditeurs.map(doc => {
                    const badge = STATUT_BADGE[doc.statut] || STATUT_BADGE.en_attente;
                    return (
                        <div key={doc.id}>
                            <div className="flex items-center gap-3 px-5 py-3"
                                style={{ borderLeft: `3px solid ${doc.statut === 'valide' ? '#16a34a' : doc.statut === 'refuse' ? '#dc2626' : '#e5e7eb'}` }}>
                                <span className="text-base flex-shrink-0">{fileIcon(doc.type_mime)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{doc.nom_original}</p>
                                    <p className="text-xs text-gray-400">{fmtSize(doc.taille)} · {doc.uploader?.prenom} {doc.uploader?.nom}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                                    <button onClick={() => handleConsulter(doc)} title="Visualiser"
                                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </button>
                                    <button onClick={() => onDownload(doc.id, doc.nom_original)} title="Télécharger"
                                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                    </button>
                                </div>
                            </div>
                            {doc.statut === 'refuse' && doc.constat && (
                                <div className="px-5 pb-3" style={{ borderLeft: '3px solid #dc2626' }}>
                                    <div className="ml-7 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Constat client · </span>
                                        <span className="text-xs text-red-700">{doc.constat}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
        </>)}
        </>
    );
};

// ─── TAB CADRAGE : Périmètre & Planification ─────────────────────────────────

const TYPE_AUDIT_OPTIONS = [
    { value: 'diagnostique', label: 'Audit diagnostique' },
    { value: 'a_blanc', label: 'Audit à blanc' },
    { value: 'conformite', label: 'Audit de conformité' },
];

const TabCadrage = ({ audit, referentiel, identification, setIdentification, onSave, saving, readOnly }) => {
    const hasData = !!(identification.type_audit || identification.perimetre_physique || identification.perimetre_logique || identification.perimetre_organisationnel);
    const [editing, setEditing] = useState(!readOnly && !hasData);
    const set = (k, v) => setIdentification(prev => ({ ...prev, [k]: v }));

    const typeLabel = TYPE_AUDIT_OPTIONS.find(t => t.value === identification.type_audit)?.label;

    const handleSave = () => { onSave(); setEditing(false); };

    const SectionTitle = ({ children }) => (
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">{children}</h3>
    );
    const InfoRow = ({ label, value }) => !value ? null : (
        <div>
            <dt className="text-xs font-medium text-gray-500">{label}</dt>
            <dd className="text-sm text-gray-800 mt-0.5">{value}</dd>
        </div>
    );

    if (!editing) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-800">Cadrage de l'audit</h2>
                    {!readOnly && (
                        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                            Modifier
                        </button>
                    )}
                </div>
                <div>
                    <SectionTitle>Informations générales</SectionTitle>
                    <dl className="grid grid-cols-2 gap-3">
                        <InfoRow label="Nom de l'audit" value={audit.nom} />
                        <InfoRow label="Client" value={audit.client} />
                        <InfoRow label="Référentiel" value={referentiel?.nom} />
                        <InfoRow label="Type d'audit" value={typeLabel || '—'} />
                        <InfoRow label="Date début" value={audit.date_debut} />
                        <InfoRow label="Date fin" value={audit.date_fin} />
                    </dl>
                </div>
                <div>
                    <SectionTitle>Périmètre</SectionTitle>
                    <dl className="space-y-3">
                        <InfoRow label="Périmètre physique" value={identification.perimetre_physique} />
                        <InfoRow label="Périmètre logique" value={identification.perimetre_logique} />
                        <InfoRow label="Périmètre organisationnel" value={identification.perimetre_organisationnel} />
                    </dl>
                    {!identification.perimetre_physique && !identification.perimetre_logique && !identification.perimetre_organisationnel && (
                        <p className="text-xs text-gray-400 italic">Périmètre non encore défini.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Cadrage de l'audit</h2>
                {hasData && (
                    <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700 underline">Annuler</button>
                )}
            </div>

            {/* Infos générales (lecture seule) */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Informations générales</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs font-medium text-gray-500">Nom</dt><dd className="text-gray-800 mt-0.5">{audit.nom}</dd></div>
                    <div><dt className="text-xs font-medium text-gray-500">Client</dt><dd className="text-gray-800 mt-0.5">{audit.client}</dd></div>
                    <div><dt className="text-xs font-medium text-gray-500">Référentiel</dt><dd className="text-gray-800 mt-0.5">{referentiel?.nom || '—'}</dd></div>
                    <div><dt className="text-xs font-medium text-gray-500">Dates</dt><dd className="text-gray-800 mt-0.5">{audit.date_debut || '—'} → {audit.date_fin || '—'}</dd></div>
                </dl>
            </div>

            {/* Type d'audit */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Type d'audit</h3>
                <div className="grid grid-cols-3 gap-3">
                    {TYPE_AUDIT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => set('type_audit', opt.value)}
                            className={`px-4 py-3 rounded-lg border text-sm font-medium transition text-left ${identification.type_audit === opt.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Périmètre */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Périmètre</h3>
                <div className="space-y-4">
                    {[
                        { key: 'perimetre_physique', label: 'Périmètre physique', placeholder: 'Sites, bâtiments, équipements physiques concernés…' },
                        { key: 'perimetre_logique', label: 'Périmètre logique', placeholder: 'Systèmes, réseaux, applications, bases de données…' },
                        { key: 'perimetre_organisationnel', label: 'Périmètre organisationnel', placeholder: 'Entités, directions, processus métier concernés…' },
                    ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                            <textarea
                                rows={3}
                                value={identification[key] || ''}
                                onChange={e => set(key, e.target.value)}
                                placeholder={placeholder}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 resize-none"
                                style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-1">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition"
                >
                    {saving ? 'Enregistrement…' : 'Enregistrer le cadrage'}
                </button>
            </div>
        </div>
    );
};

// ─── TAB 2 : Identification entité ou IIV ────────────────────────────────────

const TabIdentification = ({ identification, setIdentification, onSave, saving, isISO, readOnly }) => {
    const isEmpty = !Object.values(identification).some(v => v && String(v).trim());
    const [editing, setEditing] = useState(!readOnly && isEmpty);
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
                        {!readOnly && (
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
                            { key: 'denomination', label: 'Dénomination' },
                            { key: 'departement', label: "Département d'appartenance" },
                            { key: 'adresse', label: 'Adresse' },
                            { key: 'ville', label: 'Ville' },
                            { key: 'site_web', label: 'Adresse du site web' },
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
                            { key: 'rssi_nom_prenom', label: 'Nom et Prénom' },
                            { key: 'rssi_rattachement', label: 'Rattachement' },
                            { key: 'rssi_email', label: 'E-mail', type: 'email' },
                            { key: 'rssi_telephone', label: 'Téléphone', type: 'tel' },
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
                            { key: 'date_evaluation', label: "Date de l'évaluation", isDate: true },
                            { key: 'valide_par', label: 'Validé par', isDate: false },
                            { key: 'date_validation', label: 'Date de validation', isDate: true },
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

const TabEvaluation = ({ referentiel, localEvals, setEval, openDomaines, setOpenDomaines, isDirty, saving, onSave, readOnly }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement du référentiel...</div>;

    const toggleDomaine = (id) => setOpenDomaines(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="space-y-3">
            <TabInfo text="L'objectif de cette feuille est d'évaluer le niveau de maturité atteint pour chacune des mesures de sécurité édictées par la DNSSI et ainsi en déduire le niveau de conformité. L'auteur de l'évaluation est invité à évaluer la mise en œuvre de chacune des règles selon l'échelle de maturité définie." />
            {/* Barre de sauvegarde */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3">
                <p className="text-sm text-gray-600">
                    <strong>2. Évaluation de la mise en œuvre des règles de la DNSSI</strong>
                    {isDirty && !readOnly && <span className="ml-2 text-xs text-orange-500">— modifications non sauvegardées</span>}
                </p>
                {!readOnly && (
                    <button
                        onClick={onSave}
                        disabled={saving || !isDirty}
                        className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white rounded-lg transition disabled:opacity-50"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                        Sauvegarder
                    </button>
                )}
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
                                    <div className="h-full rounded-full" style={{ width: `${mesures.length > 0 ? (evCount / mesures.length) * 100 : 0}%`, backgroundColor: 'var(--brand-red)' }} />
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
                                                        <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider w-44">Constat</th>
                                                        <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider w-44">Recommandation</th>
                                                        <th className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wider">Preuves / Références</th>
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
                                                                            if (readOnly) return;
                                                                            const v = e.target.value === 'na' ? null : parseInt(e.target.value);
                                                                            setEval(mesure.id, 'niveau_maturite', v);
                                                                        }}
                                                                        disabled={readOnly}
                                                                        className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-default"
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
                                                                    <textarea
                                                                        value={ev.commentaire || ''}
                                                                        onChange={e => !readOnly && setEval(mesure.id, 'commentaire', e.target.value)}
                                                                        readOnly={readOnly}
                                                                        rows={2}
                                                                        placeholder={readOnly ? '—' : 'Constat...'}
                                                                        className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 read-only:bg-gray-50 read-only:text-gray-600 read-only:cursor-default resize-none"
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <textarea
                                                                        value={ev.recommandation || ''}
                                                                        onChange={e => !readOnly && setEval(mesure.id, 'recommandation', e.target.value)}
                                                                        readOnly={readOnly}
                                                                        rows={2}
                                                                        placeholder={readOnly ? '—' : 'Recommandation...'}
                                                                        className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 read-only:bg-gray-50 read-only:text-gray-600 read-only:cursor-default resize-none"
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <input
                                                                        type="text"
                                                                        value={ev.preuve || ''}
                                                                        onChange={e => !readOnly && setEval(mesure.id, 'preuve', e.target.value)}
                                                                        readOnly={readOnly}
                                                                        placeholder={readOnly ? '—' : isNA ? 'Justifier la non-applicabilité...' : 'Références / preuves...'}
                                                                        className={`w-full text-xs border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 read-only:cursor-default ${isNA && !readOnly
                                                                            ? 'border-orange-200 bg-orange-50 read-only:bg-gray-50'
                                                                            : 'border-gray-200 read-only:bg-gray-50 read-only:text-gray-600'
                                                                            }`}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
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
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-100">Constat</th>
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Recommandation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referentiel.domaines?.map(domaine => (
                                <>
                                    {/* Ligne d'en-tête domaine */}
                                    <tr key={`dom-${domaine.id}`} className="bg-gray-100/70">
                                        <td colSpan={6} className="px-4 py-2 border-b border-gray-200">
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
                                            const conformite = isoConformite(niveau);
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
                                                    <td className="px-4 py-2.5 text-gray-500 border-r border-gray-100">{ev.commentaire || <span className="text-gray-300">—</span>}</td>
                                                    <td className="px-4 py-2.5 text-gray-500">{ev.recommandation || <span className="text-gray-300">—</span>}</td>
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

const TabIndicateurs = ({ indicateurs, setIndicateurs, synthese, onSave, saving, readOnly }) => {
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
                                            onChange={e => !readOnly && set(key, e.target.value)}
                                            readOnly={readOnly}
                                            placeholder="—"
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 text-right read-only:bg-gray-50 read-only:text-gray-600"
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

                {!readOnly && (
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
                )}
            </div>
        </div>
    );
};

// ─── Constantes ISO évaluation ────────────────────────────────────────────────

const ISO_CONF_STATES = [
    { value: 5, label: 'Conforme', activeCls: 'bg-green-600 text-white border-green-600', inactiveCls: 'bg-white text-gray-500 border-gray-200 hover:border-green-400' },
    { value: 2, label: 'NC mineure', activeCls: 'bg-orange-500 text-white border-orange-500', inactiveCls: 'bg-white text-gray-500 border-gray-200 hover:border-orange-400' },
    { value: 0, label: 'NC majeure', activeCls: 'bg-red-600 text-white border-red-600', inactiveCls: 'bg-white text-gray-500 border-gray-200 hover:border-red-400' },
];

const PRIORITE_CONFIG = {
    haute: { label: 'Haute', bg: 'bg-red-50', text: 'text-red-700' },
    moyenne: { label: 'Moyenne', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    basse: { label: 'Basse', bg: 'bg-green-50', text: 'text-green-700' },
};

const STATUT_PLAN_CONFIG = {
    a_faire: { label: 'À faire', bg: 'bg-gray-100', text: 'text-gray-600' },
    en_cours: { label: 'En cours', bg: 'bg-blue-50', text: 'text-blue-700' },
    cloture: { label: 'Clôturé', bg: 'bg-green-50', text: 'text-green-700' },
};

// ─── TAB ISO : Exigences SMSI §4-10 ──────────────────────────────────────────

const TabExigencesSMSI = ({ referentiel, localEvals, setEval, isDirty, saving, onSave, readOnly }) => {
    const [openSections, setOpenSections] = useState({});

    useEffect(() => {
        const mainBody = referentiel?.domaines?.filter(d => !d.code.startsWith('A.')) ?? [];
        if (mainBody.length > 0) setOpenSections({ [mainBody[0].id]: true });
    }, [referentiel]);

    const toggleSection = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

    const mainBodyDomaines = referentiel?.domaines?.filter(d => !d.code.startsWith('A.')) ?? [];
    const allMesures = mainBodyDomaines.flatMap(d => d.objectifs?.flatMap(o => o.mesures ?? []) ?? []);

    const conforme = allMesures.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
    const ncMineure = allMesures.filter(m => localEvals[m.id]?.niveau_maturite === 2).length;
    const ncMajeure = allMesures.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
    const evaluated = conforme + ncMineure + ncMajeure;

    if (mainBodyDomaines.length === 0) {
        return (
            <div className="space-y-4">
                <TabInfo text="Les exigences SMSI §4-10 ne sont pas encore chargées. Veuillez relancer le seed ISO 27001:2022." />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <TabInfo text="Évaluez la conformité de l'organisme aux exigences obligatoires du corps principal ISO 27001:2022 (§4 à §10). Ces exigences s'appliquent à toutes les organisations certifiées — aucune exclusion n'est permise." />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Exigences totales', value: allMesures.length, sub: `${evaluated} évaluées`, color: '#111827' },
                    { label: 'Conformes', value: conforme, color: '#16a34a' },
                    { label: 'NC mineures', value: ncMineure, color: '#ea580c' },
                    { label: 'NC majeures', value: ncMajeure, color: '#dc2626' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                        {kpi.sub && <p className="text-xs text-gray-400">{kpi.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Accordion par section §4-10 */}
            {mainBodyDomaines.map(section => {
                const isOpen = !!openSections[section.id];
                const sectionMesures = section.objectifs?.flatMap(o => o.mesures ?? []) ?? [];
                const sectionEval = sectionMesures.filter(m =>
                    localEvals[m.id]?.niveau_maturite !== null && localEvals[m.id]?.niveau_maturite !== undefined
                ).length;

                return (
                    <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <button onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>
                                    §{section.code}
                                </span>
                                <span className="text-sm font-semibold text-gray-800">{section.nom}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">{sectionEval}/{sectionMesures.length} évaluées</span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </button>

                        {isOpen && (
                            <div className="border-t border-gray-100 divide-y divide-gray-50">
                                {section.objectifs?.map(obj => (
                                    <div key={obj.id} className="px-5 py-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{obj.description}</p>
                                        <div className="space-y-3">
                                            {obj.mesures?.map(mesure => {
                                                const ev = localEvals[mesure.id] || {};
                                                const niveau = ev.niveau_maturite ?? null;
                                                return (
                                                    <div key={mesure.id} className="rounded-lg border border-gray-100 bg-gray-50/40 p-3">
                                                        <div className="flex items-start gap-3">
                                                            <span className="font-mono text-[11px] text-gray-400 flex-shrink-0 w-16 pt-0.5">{mesure.code}</span>
                                                            <p className="flex-1 text-xs text-gray-700 leading-relaxed">{mesure.description}</p>
                                                            <div className="flex items-center flex-shrink-0">
                                                                {ISO_CONF_STATES.map((s, idx) => (
                                                                    <button key={s.value}
                                                                        onClick={() => !readOnly && setEval(mesure.id, 'niveau_maturite', niveau === s.value ? null : s.value)}
                                                                        disabled={readOnly}
                                                                        className={`px-2.5 py-1 text-xs font-medium border transition
                                                                            ${idx === 0 ? 'rounded-l-md border-r-0' : ''}
                                                                            ${idx === ISO_CONF_STATES.length - 1 ? 'rounded-r-md' : ''}
                                                                            ${idx > 0 && idx < ISO_CONF_STATES.length - 1 ? 'border-r-0' : ''}
                                                                            ${readOnly ? 'cursor-default' : ''}
                                                                            ${niveau === s.value ? s.activeCls : s.inactiveCls}`}
                                                                    >
                                                                        {s.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {niveau !== null && (
                                                            <div className="mt-2 ml-[76px] grid grid-cols-3 gap-3">
                                                                <textarea value={ev.commentaire || ''}
                                                                    onChange={e => !readOnly && setEval(mesure.id, 'commentaire', e.target.value)}
                                                                    readOnly={readOnly}
                                                                    rows={2}
                                                                    placeholder={readOnly ? '—' : 'Constat...'}
                                                                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none read-only:bg-gray-50 read-only:text-gray-600 resize-none" />
                                                                <textarea value={ev.recommandation || ''}
                                                                    onChange={e => !readOnly && setEval(mesure.id, 'recommandation', e.target.value)}
                                                                    readOnly={readOnly}
                                                                    rows={2}
                                                                    placeholder={readOnly ? '—' : 'Recommandation...'}
                                                                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none read-only:bg-gray-50 read-only:text-gray-600 resize-none" />
                                                                <input type="text" value={ev.preuve || ''}
                                                                    onChange={e => !readOnly && setEval(mesure.id, 'preuve', e.target.value)}
                                                                    readOnly={readOnly}
                                                                    placeholder={readOnly ? '—' : 'Références / preuves...'}
                                                                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none read-only:bg-gray-50 read-only:text-gray-600" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Bouton flottant sauvegarde */}
            {isDirty && !readOnly && (
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

// ─── TAB ISO 4 : Évaluation des contrôles ─────────────────────────────────────

const TabEvaluationISO = ({ referentiel, soaMap, localEvals, setEval, isDirty, saving, onSave, readOnly }) => {
    const [openThemes, setOpenThemes] = useState({});

    useEffect(() => {
        if (referentiel?.domaines?.length > 0) {
            setOpenThemes({ [referentiel.domaines[0].id]: true });
        }
    }, [referentiel]);

    const toggleTheme = (id) => setOpenThemes(prev => ({ ...prev, [id]: !prev[id] }));

    const annexeDomaines = referentiel?.domaines?.filter(d => d.code.startsWith('A.')) ?? [];

    const allApplicable = annexeDomaines.flatMap(d =>
        d.objectifs?.flatMap(o => o.mesures?.filter(m => soaMap[m.id]?.applicable === true) ?? []) ?? []
    );

    if (allApplicable.length === 0) {
        return (
            <div className="space-y-4">
                <TabInfo text="Complétez d'abord la Déclaration d'Applicabilité pour définir les contrôles applicables avant d'évaluer." />
                <TabPlaceholder titre="Aucun contrôle applicable défini" texte="Retournez à l'onglet 'Déclaration d'Applicabilité' et marquez les contrôles applicables avant de commencer l'évaluation." />
            </div>
        );
    }

    const conforme = allApplicable.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
    const ncMineure = allApplicable.filter(m => localEvals[m.id]?.niveau_maturite === 2).length;
    const ncMajeure = allApplicable.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
    const evaluated = conforme + ncMineure + ncMajeure;

    return (
        <div className="space-y-4">
            <TabInfo text="Évaluez la conformité de chaque contrôle ISO 27001:2022 applicable défini dans la SoA. Pour chaque contrôle, indiquez s'il est Conforme, NC mineure ou NC majeure, puis ajoutez votre constat et vos recommandations." />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Contrôles applicables', value: allApplicable.length, sub: `${evaluated} évalués`, color: '#111827' },
                    { label: 'Conformes', value: conforme, color: '#16a34a' },
                    { label: 'NC mineures', value: ncMineure, color: '#ea580c' },
                    { label: 'NC majeures', value: ncMajeure, color: '#dc2626' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                        {kpi.sub && <p className="text-xs text-gray-400">{kpi.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Accordion par thème — Annexe A uniquement */}
            {annexeDomaines.map(theme => {
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
                                                                        onClick={() => !readOnly && setEval(mesure.id, 'niveau_maturite', niveau === s.value ? null : s.value)}
                                                                        disabled={readOnly}
                                                                        className={`px-2.5 py-1 text-xs font-medium border transition
                                                                            ${idx === 0 ? 'rounded-l-md border-r-0' : ''}
                                                                            ${idx === ISO_CONF_STATES.length - 1 ? 'rounded-r-md' : ''}
                                                                            ${idx > 0 && idx < ISO_CONF_STATES.length - 1 ? 'border-r-0' : ''}
                                                                            ${readOnly ? 'cursor-default' : ''}
                                                                            ${niveau === s.value ? s.activeCls : s.inactiveCls}`}
                                                                    >
                                                                        {s.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {/* Constat + recommandation + preuve si évalué */}
                                                        {niveau !== null && (
                                                            <div className="mt-2 ml-24 grid grid-cols-3 gap-3">
                                                                <textarea value={ev.commentaire || ''}
                                                                    onChange={e => !readOnly && setEval(mesure.id, 'commentaire', e.target.value)}
                                                                    readOnly={readOnly}
                                                                    rows={2}
                                                                    placeholder={readOnly ? '—' : 'Constat...'}
                                                                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none read-only:bg-gray-50 read-only:text-gray-600 resize-none" />
                                                                <textarea value={ev.recommandation || ''}
                                                                    onChange={e => !readOnly && setEval(mesure.id, 'recommandation', e.target.value)}
                                                                    readOnly={readOnly}
                                                                    rows={2}
                                                                    placeholder={readOnly ? '—' : 'Recommandation...'}
                                                                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none read-only:bg-gray-50 read-only:text-gray-600 resize-none" />
                                                                <input type="text" value={ev.preuve || ''}
                                                                    onChange={e => !readOnly && setEval(mesure.id, 'preuve', e.target.value)}
                                                                    readOnly={readOnly}
                                                                    placeholder={readOnly ? '—' : 'Références / preuves...'}
                                                                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none read-only:bg-gray-50 read-only:text-gray-600" />
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
            {isDirty && !readOnly && (
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
    en_attente: { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700' },
    valide: { label: 'Validé', bg: 'bg-green-50', text: 'text-green-700' },
    rejete: { label: 'Rejeté', bg: 'bg-red-50', text: 'text-red-700' },
};

const TabPlanActions = ({ referentiel, planActions, localEvals, soaMap, isISO, user, onAdd, onBulkAdd, onUpdate, onDelete, onSoumettre, onValider, onRejeter, readOnly }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...emptyPlanForm });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [generating, setGenerating] = useState(false);
    const [showGenConfirm, setShowGenConfirm] = useState(false);
    const [viewingPlan, setViewingPlan] = useState(null);
    const [filterPriorite, setFilterPriorite] = useState('all');

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
                                className={`px-2.5 py-0.5 rounded text-xs font-medium transition ${
                                    filterPriorite === key
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
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 transition disabled:opacity-60"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                                Générer depuis les recommandations ({toGenerate.length})
                            </button>
                        )}
                        <button onClick={() => { resetForm(); setShowForm(true); setShowGenConfirm(false); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition"
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
                    <div className="max-h-40 overflow-y-auto space-y-1.5 border border-orange-200 rounded-lg bg-white p-2">
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
                            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition"
                            style={{ backgroundColor: '#d97706' }}>
                            {generating && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Confirmer la génération
                        </button>
                        <button onClick={() => setShowGenConfirm(false)}
                            className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
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
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
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

                            {/* Footer */}
                            <div className="flex gap-2 pt-2 border-t border-gray-100">
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
            ) : filteredPlans.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-sm text-gray-500">Aucune action avec cette priorité</p>
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
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                {viewingPlan.description_nc && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description de la non-conformité</p>
                                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{viewingPlan.description_nc}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Action corrective</p>
                                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{viewingPlan.action_corrective || '—'}</p>
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

// ─── TAB ISO 6 : Synthèse par thème ──────────────────────────────────────────

const SyntheseTable = ({ rows, caption }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-5">{caption}</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Évaluées</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-green-600">Conformes</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-orange-600">NC mineures</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-red-600">NC majeures</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Taux (%)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {rows.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50/40">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red)' }}>{t.code}</span>
                                    <span className="text-xs font-medium text-gray-700">{t.nom}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600 text-xs">{t.evaluated}/{t.total}</td>
                            <td className="px-4 py-3 text-center text-green-700 font-semibold text-xs">{t.conforme}</td>
                            <td className="px-4 py-3 text-center text-orange-600 font-semibold text-xs">{t.ncMineure}</td>
                            <td className="px-4 py-3 text-center text-red-700 font-semibold text-xs">{t.ncMajeure}</td>
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
);

const TabSyntheseISO = ({ referentiel, soaMap, localEvals }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement...</div>;

    const mainBodyDomaines = referentiel.domaines.filter(d => !d.code.startsWith('A.'));
    const annexeDomaines = referentiel.domaines.filter(d => d.code.startsWith('A.'));

    // §4-10 : toutes les mesures (pas de SoA)
    const smsiRows = mainBodyDomaines.map(d => {
        const mesures = d.objectifs.flatMap(o => o.mesures);
        const conforme = mesures.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
        const ncMineure = mesures.filter(m => localEvals[m.id]?.niveau_maturite === 2).length;
        const ncMajeure = mesures.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
        const evaluated = conforme + ncMineure + ncMajeure;
        const taux = evaluated > 0 ? Math.round(((conforme + ncMineure * 0.5) / evaluated) * 100) : 0;
        return { ...d, total: mesures.length, evaluated, conforme, ncMineure, ncMajeure, taux };
    });

    // Annexe A : filtrée par SoA
    const annexeRows = annexeDomaines.map(d => {
        const mesures = d.objectifs.flatMap(o => o.mesures).filter(m => soaMap[m.id]?.applicable === true);
        const conforme = mesures.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
        const ncMineure = mesures.filter(m => localEvals[m.id]?.niveau_maturite === 2).length;
        const ncMajeure = mesures.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
        const evaluated = conforme + ncMineure + ncMajeure;
        const taux = evaluated > 0 ? Math.round(((conforme + ncMineure * 0.5) / evaluated) * 100) : 0;
        return { ...d, total: mesures.length, evaluated, conforme, ncMineure, ncMajeure, taux };
    });

    const allRows = [...smsiRows, ...annexeRows];
    const totConf = allRows.reduce((s, t) => s + t.conforme, 0);
    const totMin = allRows.reduce((s, t) => s + t.ncMineure, 0);
    const totMaj = allRows.reduce((s, t) => s + t.ncMajeure, 0);
    const totEval = allRows.reduce((s, t) => s + t.evaluated, 0);
    const tauxGlobal = totEval > 0 ? Math.round(((totConf + totMin * 0.5) / totEval) * 100) : 0;

    const hasAnySoA = annexeRows.some(t => t.total > 0);

    return (
        <div className="space-y-4">
            <TabInfo text="Synthèse globale de la conformité ISO 27001:2022 — exigences du corps principal (§4-10) et contrôles de l'Annexe A (SoA)." />

            {/* KPIs globaux */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Taux global', value: `${tauxGlobal}%`, color: tauxGlobal >= 75 ? '#16a34a' : tauxGlobal >= 50 ? '#d97706' : '#dc2626', accent: true },
                    { label: 'Conformes', value: totConf, color: '#16a34a' },
                    { label: 'NC mineures', value: totMin, color: '#ea580c' },
                    { label: 'NC majeures', value: totMaj, color: '#dc2626' },
                ].map((k, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4" style={k.accent ? { borderTopWidth: '3px', borderTopColor: k.color } : {}}>
                        <p className="text-xs font-medium text-gray-500">{k.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* §4-10 */}
            {smsiRows.length > 0 && (
                <SyntheseTable rows={smsiRows} caption="Exigences SMSI — Corps principal §4-10 (toutes applicables)" />
            )}
            {smsiRows.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Exigences SMSI — Corps principal §4-10</p>
                    <p className="text-xs text-gray-400">Non disponible — lancez le seed ISO 27001:2022 pour ajouter les exigences §4-10.</p>
                </div>
            )}

            {/* Annexe A */}
            {hasAnySoA ? (
                <SyntheseTable rows={annexeRows.filter(t => t.total > 0)} caption="Annexe A — Contrôles applicables (SoA)" />
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Annexe A — Contrôles</p>
                    <p className="text-xs text-gray-400">Complétez la Déclaration d'Applicabilité pour voir la synthèse Annexe A.</p>
                </div>
            )}
        </div>
    );
};

// ─── TAB ISO 7 : Non-conformités ──────────────────────────────────────────────

const TabNC = ({ referentiel, soaMap, localEvals }) => {
    if (!referentiel) return <div className="text-gray-400 text-sm">Chargement...</div>;

    const ncList = referentiel.domaines.flatMap(theme =>
        theme.objectifs.flatMap(obj =>
            (obj.mesures || [])
                .filter(m => {
                    const n = localEvals[m.id]?.niveau_maturite;
                    const isNC = n === 0 || n === 2;
                    if (!isNC) return false;
                    // §4-10 : toujours applicables ; Annexe A : filtrée par SoA
                    return theme.code.startsWith('A.') ? soaMap[m.id]?.applicable === true : true;
                })
                .map(m => ({ ...m, theme, obj, ncType: localEvals[m.id]?.niveau_maturite === 0 ? 'majeure' : 'mineure' }))
        )
    );

    if (ncList.length === 0) {
        return (
            <div className="space-y-4">
                <TabInfo text="Ce registre liste tous les contrôles ISO 27001 applicables évalués comme NC mineure ou NC majeure. Il sert de base pour définir les actions correctives dans le Plan d'actions." />
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Aucune non-conformité enregistrée</p>
                    <p className="text-xs text-gray-400 mt-1">Tous les contrôles applicables évalués sont conformes.</p>
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
            <TabInfo text="Ce registre liste tous les contrôles ISO 27001 applicables évalués comme NC mineure ou NC majeure. Utilisez le Plan d'actions pour définir les actions correctives associées." />

            {/* Compteur */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                        <span className="text-lg font-bold text-red-600">{ncList.length}</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">Non-conformité(s) identifiée(s)</p>
                        <p className="text-xs text-gray-500">NC mineures + NC majeures</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 font-medium">
                        {ncList.filter(m => m.ncType === 'mineure').length} NC mineures
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-medium">
                        {ncList.filter(m => m.ncType === 'majeure').length} NC majeures
                    </span>
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
                                        {ev.recommandation && <p className="text-xs text-blue-500 mt-1">↳ {ev.recommandation}</p>}
                                    </div>
                                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-medium ${m.ncType === 'majeure' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                                        {m.ncType === 'majeure' ? 'NC majeure' : 'NC mineure'}
                                    </span>
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

const TabIndicateursISO = ({ referentiel, soaMap, localEvals, indicateurs, setIndicateurs, onSave, saving, readOnly }) => {
    const set = (k, v) => setIndicateurs(prev => ({ ...prev, [k]: v }));

    const allMesures = referentiel?.domaines?.flatMap(d => d.objectifs?.flatMap(o => o.mesures ?? []) ?? []) ?? [];
    const applicable = allMesures.filter(m => soaMap[m.id]?.applicable === true);
    const ncCount = applicable.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
    const confCount = applicable.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
    const implCount = allMesures.filter(m => ['implemente', 'partiel', 'planifie'].includes(soaMap[m.id]?.statut_implementation)).length;

    const getAutoValue = (key) => {
        if (!applicable.length) return '—';
        if (key === 'iso_taux_nc') return `${Math.round(ncCount / applicable.length * 100)}%`;
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
                                            onChange={e => !readOnly && set(key, e.target.value)}
                                            readOnly={readOnly}
                                            placeholder="—"
                                            className={`w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-right ${readOnly ? 'bg-gray-50 text-gray-600 cursor-default' : ''}`}
                                            style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                        />
                                        {unit && <span className="text-xs text-gray-400 flex-shrink-0">{unit}</span>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {!readOnly && (
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
                )}
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

const TabSoA = ({ referentiel, soaMap, setSoaEntry, soaDirty, savingSoa, onSave, readOnly }) => {
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
                                    if (!objectif.mesures?.length) return null;
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
                                                                    onClick={() => !readOnly && setSoaEntry(mesure.id, 'applicable', isApplicable === true ? null : true)}
                                                                    disabled={readOnly}
                                                                    className={`px-2.5 py-1 text-xs font-medium rounded-l-md border transition ${isApplicable === true ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200 hover:border-green-400'} ${readOnly ? 'cursor-default' : ''}`}
                                                                >
                                                                    Oui
                                                                </button>
                                                                <button
                                                                    onClick={() => !readOnly && setSoaEntry(mesure.id, 'applicable', isApplicable === false ? null : false)}
                                                                    disabled={readOnly}
                                                                    className={`px-2.5 py-1 text-xs font-medium rounded-r-md border-t border-r border-b transition ${isApplicable === false ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-500 border-gray-200 hover:border-red-400'} ${readOnly ? 'cursor-default' : ''}`}
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
                                                                            <label key={r.value} className={`flex items-center gap-1.5 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={raisons.includes(r.value)}
                                                                                    onChange={() => !readOnly && toggleRaison(mesure.id, r.value)}
                                                                                    disabled={readOnly}
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
                                                                            disabled={readOnly}
                                                                            className={`w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 ${readOnly ? 'bg-gray-50 text-gray-500 cursor-default' : 'bg-white'}`}
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
                                                                            readOnly={readOnly}
                                                                            placeholder="Ex : POL-SEC-001"
                                                                            className={`w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 ${readOnly ? 'bg-gray-50 text-gray-600 cursor-default' : ''}`}
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
                                                                    readOnly={readOnly}
                                                                    placeholder="Expliquer pourquoi ce contrôle n'est pas applicable..."
                                                                    rows={2}
                                                                    className={`w-full text-xs border border-orange-200 rounded-md px-2 py-1.5 bg-orange-50 focus:outline-none focus:ring-1 resize-none ${readOnly ? 'text-gray-600 cursor-default' : ''}`}
                                                                />
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
            {soaDirty && !readOnly && (
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
