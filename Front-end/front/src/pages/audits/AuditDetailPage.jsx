import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAuditById, updateAudit, getEvaluations, saveEvaluations } from '../../services/endpoints/auditService';
import { getReferentielById } from '../../services/endpoints/referentielService';
import { getAllUsers } from '../../services/endpoints/userService';
import DateInput from '../../components/common/DateInput';
import { toast } from 'react-toastify';

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

const TABS = [
    { id: 'description',    label: 'Description outil évaluation' },
    { id: 'identification', label: 'Identification entité ou IIV' },
    { id: 'evaluation',     label: 'Évaluation MO DNSSI' },
    { id: 'synthese_mat',   label: 'Synthèse niveau de maturité' },
    { id: 'synthese_conf',  label: 'Synthèse niveau de conformité' },
    { id: 'avancement',     label: "État d'avancement" },
    { id: 'indicateurs',    label: 'Indicateurs de la SSI' },
];

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

// ─── Page principale ───────────────────────────────────────────────────────────

const AuditDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
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

    // Chargement initial
    useEffect(() => {
        const load = async () => {
            try {
                const [auditRes, evalsRes, usersRes] = await Promise.all([
                    getAuditById(id),
                    getEvaluations(id),
                    getAllUsers(),
                ]);
                const a = auditRes.data.audit;
                setAudit(a);
                setIdentification(a.identification || {});
                setIndicateurs(a.indicateurs || {});
                setAllUsers(usersRes.data.users || []);

                // Map des évaluations existantes
                const map = {};
                (evalsRes.data.evaluations || []).forEach(ev => {
                    map[ev.mesure_id] = ev;
                });
                setEvalMap(map);
                setLocalEvals({ ...map });

                // Chargement du référentiel complet (trié par id)
                const refRes = await getReferentielById(a.referentiel_id);
                setReferentiel(sortReferentiel(refRes.data.referentiel));

                // Ouvrir le 1er domaine par défaut
                if (refRes.data.referentiel?.domaines?.length > 0) {
                    setOpenDomaines({ [refRes.data.referentiel.domaines[0].id]: true });
                }
            } catch {
                toast.error('Erreur lors du chargement de l\'audit');
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
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold text-gray-900">{audit.nom}</h1>
                            <StatutBadge statut={audit.statut} />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{audit.client} — {audit.referentiel?.nom}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">{totalEvaluated}/{totalMesures} mesures évaluées</span>
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${totalMesures > 0 ? (totalEvaluated/totalMesures)*100 : 0}%`, backgroundColor: 'var(--brand-red)' }} />
                    </div>
                </div>
            </div>

            {/* Onglets */}
            <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Contenu des onglets */}
            {activeTab === 'description' && <TabDescription audit={audit} totalMesures={totalMesures} totalEvaluated={totalEvaluated} tauxGlobal={tauxGlobal} />}
            {activeTab === 'identification' && <TabIdentification identification={identification} setIdentification={setIdentification} onSave={() => handleSaveInfo('identification', identification)} saving={savingInfo} />}
            {activeTab === 'evaluation' && (
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
            {activeTab === 'synthese_mat' && <TabSyntheseMaturite synthese={synthese} />}
            {activeTab === 'synthese_conf' && <TabSyntheseConformite synthese={synthese} totalConforme={totalConforme} totalPartiel={totalPartiel} totalNC={totalNC} tauxGlobal={tauxGlobal} />}
            {activeTab === 'avancement' && <TabAvancement referentiel={referentiel} localEvals={localEvals} synthese={synthese} />}
            {activeTab === 'indicateurs' && (
                <TabIndicateurs
                    indicateurs={indicateurs}
                    setIndicateurs={setIndicateurs}
                    synthese={synthese}
                    onSave={() => handleSaveInfo('indicateurs', indicateurs)}
                    saving={savingInfo}
                />
            )}
        </div>
    );
};

// ─── Navigation onglets ───────────────────────────────────────────────────────

const TabNav = ({ activeTab, setActiveTab }) => {
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
                {TABS.map((tab, i) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                            activeTab === tab.id
                                ? 'border-current -mb-px'
                                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                        }`}
                        style={activeTab === tab.id ? { color: 'var(--brand-red)', borderColor: 'var(--brand-red)' } : {}}
                    >
                        <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: activeTab === tab.id ? 'var(--brand-red)' : '#D1D5DB' }}
                        >
                            {i + 1}
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

const TabDescription = ({ audit, totalMesures, totalEvaluated, tauxGlobal }) => (
    <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--brand-red-light)' }}>
                    <svg className="w-4 h-4" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                </div>
                <h2 className="text-sm font-semibold text-gray-800">Description de l'outil d'évaluation</h2>
            </div>
            <div className="prose prose-sm max-w-none text-gray-600 space-y-2">
                <p>
                    Dans le cadre de l'implémentation de la DNSSI au sein des entités et des infrastructures d'importance vitale (IIV) concernées par ses dispositions, la <strong>DGSSI</strong> a réalisé cet outil dans l'objectif d'évaluer la conformité des entités et des IIV par rapport à la DNSSI et d'assurer un suivi pour l'état de mise en œuvre des règles de sécurité.
                </p>
                <p>
                    L'évaluation se fait mesure par mesure selon une échelle de maturité à 6 niveaux (de 0 à 5) inspirée du modèle CMMI :
                </p>
            </div>
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
                {NIVEAUX.filter(n => n.value !== null).map(n => (
                    <div key={n.value} className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <p className={`text-2xl font-bold ${n.color}`}>{n.value}</p>
                        <p className="text-xs text-gray-600 mt-1 font-medium">{n.label}</p>
                    </div>
                ))}
            </div>
        </div>

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

        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Informations de l'audit</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
                {[
                    { label: 'Client / Entité', value: audit.client },
                    { label: 'Périmètre', value: audit.perimetre || '—' },
                    { label: 'Date de début', value: audit.date_debut ? new Date(audit.date_debut).toLocaleDateString('fr-FR') : '—' },
                    { label: 'Date de fin prévue', value: audit.date_fin ? new Date(audit.date_fin).toLocaleDateString('fr-FR') : '—' },
                    { label: 'Créé par', value: audit.createur ? `${audit.createur.prenom} ${audit.createur.nom}` : '—' },
                    { label: 'Auditeurs', value: audit.auditeurs?.length > 0 ? audit.auditeurs.map(u => `${u.prenom} ${u.nom}`).join(', ') : '—' },
                ].map(({ label, value }) => (
                    <div key={label}>
                        <dt className="text-xs font-medium text-gray-500">{label}</dt>
                        <dd className="text-gray-800 mt-0.5">{value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    </div>
);

// ─── TAB 2 : Identification entité ou IIV ────────────────────────────────────

const TabIdentification = ({ identification, setIdentification, onSave, saving }) => {
    const set = (k, v) => setIdentification(prev => ({ ...prev, [k]: v }));

    return (
        <div className="space-y-5">
            <TabInfo text="L'objectif de cette feuille est de renseigner la dénomination de l'entité ou de l'IIV, son adresse ainsi que les informations relatives au RSSI et à l'auteur de l'évaluation." />
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-5">1. Identification de l'entité ou de l'IIV</h2>

                {/* Informations générales */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Informations générales</h3>
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
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                            { key: 'rssi_nom_prenom',    label: 'Nom et Prénom' },
                            { key: 'rssi_rattachement',  label: 'Rattachement' },
                            { key: 'rssi_email',         label: 'e-mail', type: 'email' },
                            { key: 'rssi_telephone',     label: 'Téléphone', type: 'tel' },
                        ].map(({ key, label, type = 'text' }) => (
                            <div key={key}>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                                <input
                                    type={type}
                                    value={identification[key] || ''}
                                    onChange={e => set(key, e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={identification[key] || ''}
                                        onChange={e => set(key, e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
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
                                <span className="text-sm font-semibold text-gray-800">{domaine.nom}</span>
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
                                {domaine.objectifs?.map(objectif => (
                                    <div key={objectif.id} className="border-b border-gray-50 last:border-0">
                                        {/* En-tête objectif */}
                                        <div className="px-5 py-2.5 bg-gray-50/60">
                                            <p className="text-xs font-semibold text-gray-600">
                                                <span className="text-gray-400 mr-1">{objectif.code}</span>
                                                {objectif.description}
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
                                                                        <p className="font-semibold text-gray-100 mb-1.5">{mesure.code}</p>
                                                                        <p className="text-gray-300 leading-relaxed text-[11px]">{mesure.description}</p>
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
                                ))}
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

export default AuditDetailPage;
