import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    getAuditById, updateAudit,
    getEvaluations, saveEvaluations,
    getSoA, saveSoA,
    soumettreAudit, validerAudit, rejeterAudit, changerPhase,
    getDocuments, uploadDocuments, deleteDocument, downloadDocument, updateDocumentStatut, updateDocumentCommentaire,
    soumettreValidationRapport, annulerValidationRapport,
} from '../../services/endpoints/auditService';
import {
    getPlanActions, createPlanAction, updatePlanAction, deletePlanAction,
    soumettreValidationPlan, validerPlanAction, rejeterPlanAction,
} from '../../services/endpoints/planActionService';
import { getReferentielById } from '../../services/endpoints/referentielService';
import { getAllUsers } from '../../services/endpoints/userService';
import ConfirmModal from '../../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import { useAuth } from '../../store/auth/AuthContext';

// ─── Composants extraits ──────────────────────────────────────────────────────
import { PHASES_DEF, VALIDATION_CONFIG, TABS_DNSSI, TABS_ISO, INDICATEURS_DEF, ISO_INDICATEURS_DEF } from './components/auditConstants';
import { sortReferentiel, calcConformite } from './components/auditHelpers';
import PhasesStepper from './components/PhasesStepper';
import { StatutBadge } from './components/AuditBadges';
import RejeterModal from './components/RejeterModal';
import TabNav from './components/TabNav';
import PlanningAuditCard from './components/PlanningAuditCard';
import DepotDocuments from './components/DepotDocuments';
import RevueDocuments from './components/RevueDocuments';
import TabDescription from './components/TabDescription';
import TabCadrageComplet from './components/TabCadrageComplet';
import TabIdentification from './components/TabIdentification';
import TabEvaluation from './components/TabEvaluation';
import TabSyntheseMaturite from './components/TabSyntheseMaturite';
import TabSyntheseConformite from './components/TabSyntheseConformite';
import TabAvancement from './components/TabAvancement';
import TabIndicateurs from './components/TabIndicateurs';
import TabExigencesSMSI from './components/TabExigencesSMSI';
import TabSoA from './components/TabSoA';
import TabEvaluationISO from './components/TabEvaluationISO';
import TabSyntheseISO from './components/TabSyntheseISO';
import TabNC from './components/TabNC';
import TabIndicateursISO from './components/TabIndicateursISO';
import TabPlanActions from './components/TabPlanActions';

// ─── Page principale ───────────────────────────────────────────────────────────

const AuditDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('description');
    const [audit, setAudit] = useState(null);
    const [referentiel, setReferentiel] = useState(null);
    const [evalMap, setEvalMap] = useState({});
    const [localEvals, setLocalEvals] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [openDomaines, setOpenDomaines] = useState({});
    const [identification, setIdentification] = useState({});
    const [indicateurs, setIndicateurs] = useState({});
    const [savingInfo, setSavingInfo] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    // ISO 27001 — Déclaration d'Applicabilité
    const [soaMap, setSoaMap] = useState({});
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
    const [validatingClient, setValidatingClient] = useState(false);
    const [showClotureModal, setShowClotureModal] = useState(false);
    const [cloturing, setCloturing] = useState(false);

    // ── Chargement initial ────────────────────────────────────────────────────
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
                const ident = a.identification || {};
                setIdentification({
                    ...ident,
                    denomination: ident.denomination || a.client || '',
                    auteur_evaluation: ident.auteur_evaluation || (a.createur ? `${a.createur.prenom} ${a.createur.nom}` : ''),
                    date_evaluation: ident.date_evaluation || a.date_debut?.split('T')[0] || '',
                });
                setIndicateurs(a.indicateurs || {});
                setAllUsers(usersRes.data.users || []);

                const map = {};
                (evalsRes.data.evaluations || []).forEach(ev => { map[ev.mesure_id] = ev; });
                setEvalMap(map);
                setLocalEvals({ ...map });

                const refRes = await getReferentielById(a.referentiel_id);
                const sortedRef = sortReferentiel(refRes.data.referentiel);
                setReferentiel(sortedRef);

                if (sortedRef?.domaines?.length > 0) {
                    setOpenDomaines({ [sortedRef.domaines[0].id]: true });
                }

                if (a.referentiel?.type === 'ISO27001' || refRes.data.referentiel?.type === 'ISO27001') {
                    const soaRes = await getSoA(id);
                    const sm = {};
                    (soaRes.data.soa || []).forEach(e => { sm[e.mesure_id] = e; });
                    setSoaMap(sm);
                }

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

    // ── Chargement documents ──────────────────────────────────────────────────
    useEffect(() => {
        if (!audit?.phase) return;
        if (audit.phase === 'prerequis' || audit.phase === 'revue_documentaire') {
            getDocuments(id).then(r => setDocuments(r.data.documents || [])).catch(() => { });
        }
    }, [audit?.phase, id]);

    // ── Handlers documents ────────────────────────────────────────────────────
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

    const handleSaveCommentaire = async (docId, commentaire) => {
        try {
            await updateDocumentCommentaire(id, docId, commentaire);
            const res = await getDocuments(id);
            setDocuments(res.data.documents || []);
            toast.success('Commentaire sauvegardé.');
        } catch (err) {
            toast.error('Erreur lors de la sauvegarde du commentaire.');
        }
    };

    // ── Soumission rapport au client (senior/admin) ───────────────────────────
    const handleValidationClient = async (_type, action) => {
        setValidatingClient(true);
        try {
            const res = action === 'annuler'
                ? await annulerValidationRapport(id)
                : await soumettreValidationRapport(id);
            setAudit(prev => ({ ...prev, ...res.data.audit }));
            toast.success(action === 'annuler' ? 'Validation annulée.' : 'Rapport soumis au client pour validation.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur.');
        } finally {
            setValidatingClient(false);
        }
    };

    // ── Évaluations ───────────────────────────────────────────────────────────
    const setEval = (mesureId, field, value) => {
        setLocalEvals(prev => ({
            ...prev,
            [mesureId]: { ...(prev[mesureId] || { mesure_id: mesureId }), [field]: value },
        }));
        setIsDirty(true);
    };

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
            const res = await getAuditById(id);
            setAudit(res.data.audit);
            toast.success('Évaluations sauvegardées');
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    // ── Plans d'actions CRUD ──────────────────────────────────────────────────
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

    // ── SoA (ISO 27001) ───────────────────────────────────────────────────────
    const setSoaEntry = (mesureId, field, value) => {
        setSoaMap(prev => ({
            ...prev,
            [mesureId]: { ...(prev[mesureId] || { mesure_id: mesureId }), [field]: value },
        }));
        setSoaDirty(true);
    };

    const handleSaveSoA = async () => {
        setSavingSoa(true);
        try {
            const entries = Object.values(soaMap);
            await saveSoA(id, entries);
            setSoaDirty(false);
            const res = await getAuditById(id);
            setAudit(res.data.audit);
            toast.success("Déclaration d'applicabilité sauvegardée");
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSavingSoa(false);
        }
    };

    // ── Clôture / Réouverture ─────────────────────────────────────────────────
    const handleClotureAudit = async () => {
        setCloturing(true);
        try {
            await updateAudit(id, { statut: 'termine', phase: 'termine' });
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

    const handleRouvrirAudit = async () => {
        try {
            await updateAudit(id, { statut: 'en_cours', phase: 'realisation' });
            const res = await getAuditById(id);
            setAudit(res.data.audit);
            toast.success('Audit rouvert — statut en cours');
        } catch {
            toast.error('Erreur lors de la réouverture');
        }
    };

    // ── Sauvegarde infos audit ────────────────────────────────────────────────
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

    // ── Calculs synthèse ──────────────────────────────────────────────────────
    const computeSynthese = useCallback(() => {
        if (!referentiel) return [];
        return referentiel.domaines.map(domaine => {
            const mesures = domaine.objectifs.flatMap(o => o.mesures);
            const total = mesures.length;
            const evaluated = mesures.filter(m => { const n = localEvals[m.id]?.niveau_maturite; return n !== null && n !== undefined; });
            const scoredEvals = evaluated.filter(m => localEvals[m.id]?.niveau_maturite !== -1 && localEvals[m.id]?.niveau_maturite !== -2);
            const scores = scoredEvals.map(m => localEvals[m.id]?.niveau_maturite);
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

    // ── Indicateurs de complétion par onglet ──────────────────────────────────
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

    // ── États de chargement ───────────────────────────────────────────────────
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
    const isTermine = audit.statut === 'termine';
    const canSoumettreAudit = isJunior && isAssigned && audit.statut_validation !== 'en_attente' && audit.statut_validation !== 'valide';
    const canValiderRejeter = isSeniorOrAdmin && audit.statut_validation === 'en_attente';
    const validationCfg = VALIDATION_CONFIG[audit.statut_validation];

    const GRAPH_TABS = [
        'plans_actions',
        ...(isISO ? ['synthese_iso', 'nc'] : ['synthese_mat', 'synthese_conf', 'avancement']),
    ];
    const tabs = (isISO ? TABS_ISO : TABS_DNSSI).filter(t => canSeeGraphs || !GRAPH_TABS.includes(t.id));

    // ── Calcul nextConfig pour le stepper ─────────────────────────────────────
    let nextConfig = null;
    if (isSeniorOrAdmin && audit.statut !== 'termine') {
        if (audit.phase === 'cadrage') {
            nextConfig = {
                label: 'Passer aux Prérequis',
                disabled: changingPhase,
                title: '',
            };
        } else if (audit.phase === 'prerequis') {
            nextConfig = { label: 'Passer à la Revue doc', disabled: changingPhase, title: '' };
        } else if (audit.phase === 'revue_documentaire') {
            nextConfig = { label: 'Démarrer la Réalisation', disabled: changingPhase, title: '' };
        }
    }

    return (
        <div className="space-y-5">

            {/* ── En-tête ── */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <Link to="/audits" className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold text-gray-900">{audit.nom}</h1>
                            <StatutBadge statut={audit.statut} />
                            {validationCfg && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${validationCfg.bg} ${validationCfg.text} ${validationCfg.border}`}>
                                    {validationCfg.label}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">{audit.client} — {audit.referentiel?.nom}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {audit.statut !== 'termine' && audit.statut !== 'archive' && auditComplete && !isJunior && !isClient && (
                        <button
                            onClick={() => setShowClotureModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition hover:opacity-90"
                            style={{ backgroundColor: '#16a34a' }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            Clôturer l'audit
                        </button>
                    )}
                    {audit.statut === 'termine' && !isJunior && !isClient && (
                        <button
                            onClick={handleRouvrirAudit}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Rouvrir l'audit
                        </button>
                    )}
                    {canSoumettreAudit && !isClient && (
                        <button onClick={handleSoumettreAudit} disabled={validating}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: '#d97706' }}>
                            {validating
                                ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                            }
                            Soumettre pour validation
                        </button>
                    )}
                    {canValiderRejeter && !isClient && (
                        <>
                            <button onClick={handleValiderAudit} disabled={validating}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-60"
                                style={{ backgroundColor: '#16a34a' }}>
                                {validating
                                    ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                }
                                Valider
                            </button>
                            <button onClick={() => setShowRejeterAudit(true)} disabled={validating}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-60"
                                style={{ backgroundColor: '#cc0000' }}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                Rejeter
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── KPI — réalisation / terminé ── */}
            {(audit.phase === 'realisation' || audit.phase === 'termine') && (
                <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                        <p className="text-xs font-medium text-gray-400 mb-1">Mesures évaluées</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {totalEvaluated}<span className="text-sm font-normal text-gray-400 ml-1">/ {totalMesures}</span>
                        </p>
                        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${totalMesures > 0 ? (totalEvaluated / totalMesures) * 100 : 0}%`, backgroundColor: 'var(--brand-red)' }} />
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                        <p className="text-xs font-medium text-gray-400 mb-1">Taux de conformité</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {tauxGlobal}<span className="text-sm font-normal text-gray-400 ml-0.5">%</span>
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                        <p className="text-xs font-medium text-gray-400 mb-1">Non-conformités</p>
                        <p className="text-2xl font-bold text-gray-900">{totalNC}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                        <p className="text-xs font-medium text-gray-400 mb-1">Plans d'actions</p>
                        <p className="text-2xl font-bold text-gray-900">{planActions.length}</p>
                    </div>
                </div>
            )}

            {/* ── Bannière rejet ── */}
            {audit.statut_validation === 'rejete' && audit.commentaire_rejet && (
                <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <div>
                        <p className="text-xs font-semibold text-red-700">Audit rejeté — corrections requises</p>
                        <p className="text-xs text-red-600 mt-0.5">{audit.commentaire_rejet}</p>
                    </div>
                </div>
            )}

            {/* ── Bannière lecture seule client ── */}
            {isClient && audit.phase === 'realisation' && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200">
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-blue-700">
                        <strong>Mode lecture seule</strong> — Vous consultez les résultats de l'audit de votre entité.
                    </p>
                </div>
            )}

            {/* ── Stepper + onglets (sticky) ── */}
            <div className="sticky z-20 bg-white -mx-6 px-6 pt-3 pb-0 border-y border-gray-100 shadow-sm" style={{ top: '-1.5rem' }}>
                <PhasesStepper
                    phase={audit.phase || 'cadrage'}
                    statut={audit.statut}
                    canChange={isSeniorOrAdmin}
                    onPrev={() => handleChangerPhase(-1)}
                    onNext={() => handleChangerPhase(1)}
                    nextConfig={nextConfig}
                    changing={changingPhase}
                />
                {(audit.phase === 'realisation' || audit.phase === 'termine') && (
                    <TabNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} tabStatus={tabStatus} />
                )}
            </div>

            {/* ── Contenu principal ── */}
            <div>

                {/* Phase cadrage */}
                {audit.phase === 'cadrage' && (
                    <div className="space-y-5">
                        {isSeniorOrAdmin && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Phase de cadrage</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Complétez les informations de cadrage et le planning avant de passer à la phase suivante.</p>
                                </div>
                            </div>
                        )}
                        <TabCadrageComplet
                            audit={audit}
                            referentiel={referentiel}
                            identification={identification}
                            setIdentification={setIdentification}
                            onSave={() => handleSaveInfo('identification', identification)}
                            saving={savingInfo}
                            isISO={isISO}
                            readOnly={isClient}
                        />
                        <PlanningAuditCard
                            audit={audit}
                            identification={identification}
                            setIdentification={setIdentification}
                            onSave={() => handleSaveInfo('identification', identification)}
                            saving={savingInfo}
                            readOnly={isClient}
                        />
                    </div>
                )}

                {/* Phase prérequis */}
                {audit.phase === 'prerequis' && (
                    <div className="space-y-5">
                        {isClient ? (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-50 border border-orange-200">
                                <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                <div>
                                    <p className="text-sm font-semibold text-orange-900">Action requise — Dépôt des documents</p>
                                    <p className="text-xs text-orange-700 mt-0.5">Veuillez déposer tous les documents nécessaires à l'audit (politiques, procédures, rapports précédents…).</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Prérequis — collecte des documents</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{documents.length > 0 ? `${documents.length} fichier(s) reçu(s)` : 'En attente des documents du client'}</p>
                                </div>
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
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
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
                        <RevueDocuments
                            documents={documents}
                            isClient={isClient}
                            onDownload={handleDownloadDocument}
                            onFetchBlob={handleFetchDocBlob}
                            onSaveCommentaire={handleSaveCommentaire}
                        />
                    </div>
                )}

                {/* Soumission rapport client — phase terminé, senior/admin */}
                {audit.phase === 'termine' && isSeniorOrAdmin && (() => {
                    const vr = audit.validation_rapport;
                    const statut = vr?.statut;
                    return (
                        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-600">Rapport final — validation client</p>
                                {!vr && <p className="text-xs text-gray-400 mt-0.5">Non encore soumis au client</p>}
                                {statut === 'en_attente' && <p className="text-xs text-orange-600 mt-0.5">En attente de validation · {vr.date ? new Date(vr.date).toLocaleDateString('fr-FR') : ''}</p>}
                                {statut === 'valide' && <p className="text-xs text-green-600 mt-0.5 font-medium">Validé par le client ✓</p>}
                                {statut === 'modification_demandee' && (
                                    <div>
                                        <p className="text-xs text-red-600 mt-0.5">Modification demandée</p>
                                        {vr.commentaire && <p className="text-xs text-red-500 italic mt-0.5">"{vr.commentaire}"</p>}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {!vr && (
                                    <button
                                        onClick={() => handleValidationClient('rapport', 'soumettre')}
                                        disabled={validatingClient}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-xl disabled:opacity-50 transition hover:opacity-90"
                                        style={{ backgroundColor: 'var(--brand-red)' }}
                                    >
                                        {validatingClient ? 'Envoi…' : 'Soumettre au client'}
                                    </button>
                                )}
                                {statut === 'modification_demandee' && (
                                    <button
                                        onClick={() => handleValidationClient('rapport', 'soumettre')}
                                        disabled={validatingClient}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
                                    >
                                        {validatingClient ? 'Envoi…' : 'Resoumettre au client'}
                                    </button>
                                )}
                                {statut && statut !== 'valide' && (
                                    <button
                                        onClick={() => handleValidationClient('rapport', 'annuler')}
                                        disabled={validatingClient}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 border border-gray-200 rounded-xl hover:text-red-500 hover:border-red-200 hover:bg-red-50 disabled:opacity-50 transition"
                                    >
                                        Annuler
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Onglets — phases réalisation et terminé */}
                {(audit.phase === 'realisation' || audit.phase === 'termine') && (<>
                    {activeTab === 'description' && (
                        <TabDescription
                            audit={audit}
                            identification={identification}
                            totalMesures={totalMesures}
                            totalEvaluated={totalEvaluated}
                            tauxGlobal={tauxGlobal}
                            isISO={isISO}
                            onSave={handleUpdateAuditInfo}
                            saving={savingInfo}
                            readOnly={isClient || isJunior || isTermine}
                        />
                    )}
                    {activeTab === 'identification' && (
                        <TabIdentification
                            identification={identification}
                            setIdentification={setIdentification}
                            onSave={() => handleSaveInfo('identification', identification)}
                            saving={savingInfo}
                            isISO={isISO}
                            readOnly={isClient || isTermine}
                        />
                    )}
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
                            readOnly={isClient || isTermine}
                        />
                    )}
                    {!isISO && activeTab === 'synthese_mat' && canSeeGraphs && (
                        <TabSyntheseMaturite synthese={synthese} />
                    )}
                    {!isISO && activeTab === 'synthese_conf' && canSeeGraphs && (
                        <TabSyntheseConformite
                            synthese={synthese}
                            totalConforme={totalConforme}
                            totalPartiel={totalPartiel}
                            totalNC={totalNC}
                            tauxGlobal={tauxGlobal}
                        />
                    )}
                    {!isISO && activeTab === 'avancement' && canSeeGraphs && (
                        <TabAvancement referentiel={referentiel} localEvals={localEvals} synthese={synthese} />
                    )}
                    {!isISO && activeTab === 'indicateurs' && (
                        <TabIndicateurs
                            indicateurs={indicateurs}
                            setIndicateurs={setIndicateurs}
                            synthese={synthese}
                            onSave={() => handleSaveInfo('indicateurs', indicateurs)}
                            saving={savingInfo}
                            readOnly={isTermine}
                        />
                    )}
                    {isISO && activeTab === 'exigences_smsi' && (
                        <TabExigencesSMSI
                            referentiel={referentiel}
                            localEvals={localEvals}
                            setEval={setEval}
                            isDirty={isDirty}
                            saving={saving}
                            onSave={handleSaveEvals}
                            readOnly={isClient || isTermine}
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
                            readOnly={isClient || isTermine}
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
                            readOnly={isClient || isTermine}
                        />
                    )}
                    {isISO && activeTab === 'synthese_iso' && canSeeGraphs && (
                        <TabSyntheseISO referentiel={referentiel} soaMap={soaMap} localEvals={localEvals} />
                    )}
                    {isISO && activeTab === 'nc' && canSeeGraphs && (
                        <TabNC referentiel={referentiel} soaMap={soaMap} localEvals={localEvals} />
                    )}
                    {isISO && activeTab === 'indicateurs_iso' && (
                        <TabIndicateursISO
                            referentiel={referentiel}
                            soaMap={soaMap}
                            localEvals={localEvals}
                            indicateurs={indicateurs}
                            setIndicateurs={setIndicateurs}
                            onSave={() => handleSaveInfo('indicateurs', indicateurs)}
                            saving={savingInfo}
                            readOnly={isTermine}
                        />
                    )}
                    {activeTab === 'plans_actions' && canSeeGraphs && (
                        <TabPlanActions
                            referentiel={referentiel}
                            planActions={planActions}
                            localEvals={localEvals}
                            soaMap={soaMap}
                            isISO={isISO}
                            user={user}
                            onAdd={handleCreatePlanAction}
                            onBulkAdd={handleBulkCreatePlanAction}
                            onUpdate={handleUpdatePlanAction}
                            onDelete={handleDeletePlanAction}
                            onSoumettre={handleSoumettrePlan}
                            onValider={handleValiderPlan}
                            onRejeter={(planId) => setRejetingPlanId(planId)}
                            readOnly={isClient || isTermine}
                        />
                    )}
                </>)}

            </div>

            {/* ── Modales ── */}
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

export default AuditDetailPage;
