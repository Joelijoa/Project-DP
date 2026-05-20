import { useEffect, useState } from 'react';
import { getAllReferentiels, getReferentielById, getReferentielStats } from '../../services/endpoints/referentielService';

const TYPE_CONFIG = {
    ISO27001: { label: 'ISO 27001:2022', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
    DNSSI:    { label: 'DNSSI',          color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
};

// Icônes chevron
const ChevronRight = () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);
const ChevronDown = () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

// ─── Objectifs ISO 27002:2022 par mesure individuelle ────────────────────────
// Clé = mesure.code (ex: 'A.5.1'), Valeur = texte "Objectif" de la mesure dans le PDF
const ISO_MESURE_OBJECTIVES = {
    // Contrôles organisationnels — A.5
    'A.5.1':  "Assurer de manière continue la pertinence, l'adéquation, l'efficacité des orientations de la direction et de son soutien à la sécurité de l'information selon les exigences métier, légales, statutaires, réglementaires et contractuelles.",
    'A.5.2':  "Établir une structure définie, approuvée et comprise pour la mise en œuvre, le fonctionnement et la gestion de la sécurité de l'information au sein de l'organisation.",
    'A.5.3':  "Réduire le risque de fraude, d'erreur et de contournement des mesures de sécurité de l'information.",
    'A.5.4':  "S'assurer que la direction comprend son rôle en matière de sécurité de l'information et qu'elle entreprend des actions visant à garantir que tout le personnel est conscient de ses responsabilités liées à la sécurité de l'information et qu'il les mène à bien.",
    'A.5.5':  "Assurer la circulation adéquate de l'information en matière de sécurité de l'information, entre l'organisation et les autorités légales, réglementaires et de surveillance pertinentes.",
    'A.5.6':  "Assurer la circulation adéquate de l'information en matière de sécurité de l'information.",
    'A.5.7':  "Apporter une connaissance de l'environnement des menaces de l'organisation afin que les mesures d'atténuation appropriées puissent être prises.",
    'A.5.8':  "S'assurer que la sécurité de l'information est intégrée dans la gestion de projet.",
    'A.5.9':  "Identifier les informations et autres actifs associés de l'organisation afin de préserver leur sécurité et d'attribuer les responsabilités appropriées.",
    'A.5.10': "Assurer que les informations et autres actifs associés sont protégés, utilisés et traités de manière appropriée selon la classification établie.",
    'A.5.11': "Protéger les actifs de l'organisation dans le cadre du processus du changement ou de la fin de leur emploi ou contrat.",
    'A.5.12': "Assurer l'identification et la compréhension des besoins de protection de l'information en fonction de son importance pour l'organisation.",
    'A.5.13': "Faciliter la communication de la classification de l'information et appuyer l'automatisation de la gestion et du traitement de l'information.",
    'A.5.14': "Maintenir la sécurité de l'information transférée au sein de l'organisation et vers toute partie intéressée externe.",
    'A.5.15': "Assurer l'accès autorisé et empêcher l'accès non autorisé aux informations et autres actifs associés.",
    'A.5.16': "Gérer l'ensemble du cycle de vie des identités.",
    'A.5.17': "Assurer l'authentification correcte de l'entité et éviter les défaillances des processus d'authentification.",
    'A.5.18': "Assurer que l'accès aux informations et autres actifs associés est défini et autorisé conformément aux exigences métier.",
    'A.5.19': "Maintenir le niveau de sécurité de l'information convenu dans les relations avec les fournisseurs.",
    'A.5.20': "Maintenir le niveau de sécurité de l'information convenu dans les accords conclus avec les fournisseurs.",
    'A.5.21': "Maintenir le niveau de sécurité de l'information convenu tout au long de la chaîne d'approvisionnement TIC.",
    'A.5.22': "Maintenir un niveau convenu de sécurité de l'information et de prestation de services, conformément aux accords conclus avec les fournisseurs.",
    'A.5.23': "Maintenir un niveau convenu de sécurité de l'information pour l'utilisation des services en nuage.",
    'A.5.24': "Assurer une réponse rapide, efficace, cohérente et ordonnée aux incidents de sécurité de l'information.",
    'A.5.25': "Assurer une gestion et une déclaration cohérentes et efficaces des événements de sécurité de l'information.",
    'A.5.26': "Assurer une réponse efficace et effective aux incidents de sécurité de l'information.",
    'A.5.27': "Réduire la probabilité ou les conséquences des incidents futurs.",
    'A.5.28': "Assurer une gestion cohérente et efficace des preuves relatives aux incidents de sécurité de l'information.",
    'A.5.29': "Protéger les informations et autres actifs associés pendant une perturbation.",
    'A.5.30': "Assurer la disponibilité des informations et autres actifs associés de l'organisation pendant une perturbation.",
    'A.5.31': "Assurer la conformité aux exigences légales, statutaires, réglementaires et contractuelles relatives à la sécurité de l'information.",
    'A.5.32': "Assurer la conformité aux exigences légales, statutaires, réglementaires et contractuelles relatives aux droits de propriété intellectuelle.",
    'A.5.33': "Protéger les enregistrements contre la perte, la destruction, la falsification, les accès et divulgations non autorisés.",
    'A.5.34': "Assurer la conformité aux exigences légales, statutaires, réglementaires et contractuelles relatives à la protection des données à caractère personnel.",
    'A.5.35': "S'assurer que l'approche de l'organisation pour gérer la sécurité de l'information est continuellement revue et améliorée.",
    'A.5.36': "S'assurer que la sécurité de l'information est mise en œuvre et fonctionne conformément à la politique de sécurité de l'information.",
    'A.5.37': "S'assurer du fonctionnement correct et sécurisé des moyens de traitement de l'information.",
    // Contrôles liés aux personnes — A.6
    'A.6.1':  "S'assurer que tous les membres du personnel sont éligibles et adéquats pour remplir les fonctions pour lesquelles ils sont candidats, et qu'ils le restent tout au long de leur emploi.",
    'A.6.2':  "S'assurer que le personnel comprend ses responsabilités en termes de sécurité de l'information dans le cadre de leur emploi.",
    'A.6.3':  "S'assurer que le personnel et les parties intéressées pertinentes connaissent et remplissent leurs obligations en matière de sécurité de l'information.",
    'A.6.4':  "S'assurer que le personnel est conscient des conséquences d'un manquement aux règles de sécurité de l'information.",
    'A.6.5':  "Protéger les intérêts de l'organisation dans le cadre du processus de changement ou de fin d'un emploi.",
    'A.6.6':  "Assurer la confidentialité des informations accessibles par le personnel ou des parties externes.",
    'A.6.7':  "Assurer la sécurité des informations lorsque le personnel travaille à distance.",
    'A.6.8':  "Assurer un signalement et une réponse rapides et cohérents aux incidents de sécurité de l'information.",
    // Contrôles physiques — A.7
    'A.7.1':  "Empêcher l'accès physique non autorisé, les dommages ou interférences portant sur les informations et autres actifs associés de l'organisation.",
    'A.7.2':  "Assurer que seul l'accès physique autorisé aux informations et autres actifs associés de l'organisation est accordé.",
    'A.7.3':  "Empêcher l'accès physique non autorisé, les dommages et les interférences impactant les informations et autres actifs associés dans les bureaux, salles et installations.",
    'A.7.4':  "Détecter et dissuader l'accès physique non autorisé.",
    'A.7.5':  "Prévenir ou réduire les conséquences des événements issus des menaces physiques ou environnementales.",
    'A.7.6':  "Protéger les informations et autres actifs associés dans les zones sécurisées contre tout dommage et interférence.",
    'A.7.7':  "Réduire les risques d'accès non autorisé, de perte et d'endommagement des informations sur les bureaux et écrans.",
    'A.7.8':  "Protéger le matériel contre les risques liés aux menaces physiques et environnementales.",
    'A.7.9':  "Protéger les actifs hors des locaux contre la perte, l'endommagement, le vol ou la compromission.",
    'A.7.10': "Assurer que seuls la divulgation, la modification, le retrait ou la destruction autorisés des informations sur supports sont effectués.",
    'A.7.11': "Empêcher la perte, l'endommagement ou la compromission des informations causés par les défaillances des services d'infrastructure.",
    'A.7.12': "Empêcher la perte, l'endommagement, le vol ou la compromission des câblages.",
    'A.7.13': "Empêcher la perte, l'endommagement, le vol ou la compromission des équipements.",
    'A.7.14': "Éviter la fuite d'informations à partir de matériel à éliminer ou à réutiliser.",
    // Contrôles technologiques — A.8
    'A.8.1':  "Protéger les informations contre les risques liés à l'utilisation de terminaux finaux des utilisateurs.",
    'A.8.2':  "S'assurer que seuls les utilisateurs, composants logiciels et services autorisés sont dotés de droits d'accès privilégiés.",
    'A.8.3':  "Assurer les accès autorisés seulement et empêcher les accès non autorisés aux informations et autres actifs associés.",
    'A.8.4':  "Empêcher l'introduction d'une fonctionnalité non autorisée, éviter les modifications non intentionnelles ou malveillantes et préserver la confidentialité de la propriété intellectuelle importante.",
    'A.8.5':  "S'assurer qu'un utilisateur ou une entité est authentifié de façon sécurisée lorsque l'accès aux systèmes, applications et services lui est accordé.",
    'A.8.6':  "Assurer les besoins en termes de moyens de traitement de l'information, de ressources humaines, de bureaux et autres installations.",
    'A.8.7':  "S'assurer que les informations et autres actifs associés sont protégés contre les programmes malveillants.",
    'A.8.8':  "Empêcher l'exploitation des vulnérabilités techniques.",
    'A.8.9':  "S'assurer que le matériel, les logiciels, les services et les réseaux fonctionnent correctement avec les paramètres de sécurité requis, et que la configuration n'est pas altérée par des changements non autorisés.",
    'A.8.10': "Empêcher l'exposition inutile des informations sensibles et se conformer aux exigences légales, statutaires, réglementaires et contractuelles.",
    'A.8.11': "Limiter l'exposition des données sensibles, y compris les DCP, et se conformer aux exigences légales, statutaires, réglementaires et contractuelles.",
    'A.8.12': "Détecter et empêcher la divulgation et l'extraction non autorisées d'informations.",
    'A.8.13': "Assurer la récupération des informations stockées sur des supports de stockage.",
    'A.8.14': "S'assurer du fonctionnement continu des moyens de traitement de l'information.",
    'A.8.15': "Enregistrer les événements, générer des preuves et assurer l'intégrité des informations de journalisation.",
    'A.8.16': "Détecter les comportements anormaux et les éventuels incidents de sécurité de l'information.",
    'A.8.17': "Permettre la corrélation et l'analyse d'événements de sécurité et autres données enregistrées.",
    'A.8.18': "S'assurer que l'utilisation de programmes utilitaires ne nuise pas aux mesures de sécurité de l'information.",
    'A.8.19': "Assurer l'intégrité des systèmes opérationnels et empêcher l'exploitation des vulnérabilités techniques.",
    'A.8.20': "Protéger les informations dans les réseaux et les moyens de traitement de l'information support contre les compromissions via le réseau.",
    'A.8.21': "Assurer la sécurité des services réseau au sein de l'organisation et à l'extérieur.",
    'A.8.22': "Diviser le réseau en périmètres de sécurité et contrôler le trafic entre eux en fonction des besoins métiers.",
    'A.8.23': "Protéger les systèmes contre la compromission par des programmes malveillants et empêcher l'accès aux ressources web malveillantes.",
    'A.8.24': "Assurer l'utilisation correcte et efficace de la cryptographie afin de protéger la confidentialité, l'authenticité ou l'intégrité des informations.",
    'A.8.25': "S'assurer que la sécurité de l'information est conçue et mise en œuvre au cours du cycle de vie de développement des systèmes.",
    'A.8.26': "S'assurer que toutes les exigences de sécurité de l'information sont identifiées et traitées lors du développement ou de l'acquisition des applications.",
    'A.8.27': "S'assurer que les systèmes d'information sont conçus, mis en œuvre et exploités de manière sécurisée.",
    'A.8.28': "Assurer que les codes relatifs à la sécurité sont écrits de manière sécurisée, réduisant ainsi le nombre de vulnérabilités potentielles dans les logiciels.",
    'A.8.29': "Valider le respect des exigences de sécurité de l'information lorsque des applications ou des codes sont déployés en production.",
    'A.8.30': "S'assurer que les mesures de sécurité de l'information requises par l'organisation sont mises en œuvre dans les environnements de développement externalisés.",
    'A.8.31': "Protéger l'intégrité des environnements en séparant les environnements de développement, de test et de production.",
    'A.8.32': "Préserver la sécurité de l'information lors de l'exécution des changements.",
    'A.8.33': "Assurer que les informations utilisées pour les tests sont sélectionnées, protégées et gérées de manière appropriée.",
    'A.8.34': "Minimiser l'impact des activités d'audit et autres activités d'assurance sur les systèmes opérationnels et les processus métier.",
};

// Tri naturel sur code (ex: A.5.2 < A.5.10 < A.5.9 → A.5.2 < A.5.9 < A.5.10)
const naturalCompare = (a, b) => {
    const segA = (a.code || '').split(/(\d+)/).filter(Boolean);
    const segB = (b.code || '').split(/(\d+)/).filter(Boolean);
    for (let i = 0; i < Math.max(segA.length, segB.length); i++) {
        const sA = segA[i] ?? '';
        const sB = segB[i] ?? '';
        const nA = parseInt(sA, 10);
        const nB = parseInt(sB, 10);
        const cmp = (!isNaN(nA) && !isNaN(nB)) ? nA - nB : sA.localeCompare(sB);
        if (cmp !== 0) return cmp;
    }
    return 0;
};

// Supprime le préfixe numérique d'un libellé  ex: "1. POLITIQUE..." → "POLITIQUE..."
const stripNumericPrefix = (str = '') =>
    str.replace(/^\d+[\.\s\t]+/, '').trim();

// Supprime "Objectif N : " / "X.X — " en début de chaîne
const stripObjectifPrefix = (str = '') =>
    str.replace(/^Objectif\s+\d+\s*:\s*/i, '').replace(/^[\d.]+\s*[—\-–]\s*/, '').trim();

// Tooltip générique (haut, largeur fixe)
const Tooltip = ({ title, body }) => (
    <div className="absolute left-0 bottom-full mb-2 z-50 hidden group-hover:block w-[420px] bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-xl pointer-events-none">
        {title && <p className="font-semibold mb-1 text-gray-200">{title}</p>}
        <p className="text-gray-300 leading-relaxed">{body}</p>
        <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
    </div>
);

// Ligne mesure — texte complet, tooltip = objectif individuel ISO 27002 (par mesure.code)
const MesureRow = ({ mesure }) => {
    const objectif = ISO_MESURE_OBJECTIVES[mesure.code?.trim()];
    return (
        <div className="relative group flex items-start gap-2 py-1.5 px-3 rounded hover:bg-gray-50 ml-1">
            <span className="font-mono text-xs font-semibold text-gray-500 mt-0.5 w-24 shrink-0">{mesure.code?.trim()}</span>
            <span className="text-xs text-gray-700 flex-1">{mesure.description || '—'}</span>
            {objectif && (
                <Tooltip title={`Objectif ${mesure.code?.trim()}`} body={objectif} />
            )}
        </div>
    );
};

// Objectif accordéon — texte complet, tooltip = description du groupe (DB)
const ObjectifRow = ({ objectif, domaineDesc }) => {
    const [open, setOpen] = useState(false);
    const desc = stripObjectifPrefix(objectif.description || '');
    const tooltipText = domaineDesc || '';
    return (
        <div className="ml-4">
            <div className="relative group">
                <button
                    onClick={() => setOpen(o => !o)}
                    className="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 text-left"
                >
                    <span className="text-gray-400">{open ? <ChevronDown /> : <ChevronRight />}</span>
                    <span className="font-mono text-xs font-medium text-gray-500 w-8 shrink-0">{objectif.code}</span>
                    <span className="text-xs text-gray-700 flex-1">{desc}</span>
                    <span className="text-xs text-gray-400 shrink-0">{objectif.mesures?.length || 0} mesure(s)</span>
                </button>
                {tooltipText && (
                    <Tooltip title={objectif.code} body={tooltipText} />
                )}
            </div>
            {open && objectif.mesures?.length > 0 && (
                <div className="ml-6 mt-1 mb-1 border-l-2 border-gray-100 pl-2">
                    {[...(objectif.mesures)].sort(naturalCompare).map(m => <MesureRow key={m.id} mesure={m} />)}
                </div>
            )}
        </div>
    );
};

// Domaine accordéon — §4-10 corps principal ISO 27001
const DomaineRow = ({ domaine }) => {
    const [open, setOpen] = useState(false);
    const totalMesures = domaine.objectifs?.reduce((acc, o) => acc + (o.mesures?.length || 0), 0) || 0;
    const nomPropre = stripNumericPrefix(domaine.nom || '');
    const domaineDesc = domaine.description || '';
    return (
        <div className="border border-gray-100 rounded-xl mb-2">
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left ${open ? 'rounded-t-xl' : 'rounded-xl'}`}
            >
                <span className="text-gray-500">{open ? <ChevronDown /> : <ChevronRight />}</span>
                <span className="font-mono text-xs font-bold text-gray-600 w-8 shrink-0">{domaine.code}</span>
                <span className="text-sm font-medium text-gray-800 flex-1">{nomPropre}</span>
                <span className="text-xs text-gray-400 shrink-0">
                    {domaine.objectifs?.length || 0} obj. · {totalMesures} mesures
                </span>
            </button>
            {open && (
                <div className="px-2 py-2">
                    {[...(domaine.objectifs || [])].sort(naturalCompare).map(o => <ObjectifRow key={o.id} objectif={o} domaineDesc={domaineDesc} />)}
                </div>
            )}
        </div>
    );
};

// Annexe A — rendu plat : chapitre (5/6/7/8) → liste directe des contrôles individuels
const AnnexeAChapitreRow = ({ domaine }) => {
    const [open, setOpen] = useState(false);
    const shortCode = domaine.code.replace(/^A\./, '');   // "A.5" → "5"
    const allMesures = (domaine.objectifs || [])
        .flatMap(o => o.mesures || [])
        .sort(naturalCompare);
    return (
        <div className="border border-gray-100 rounded-xl mb-2">
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left ${open ? 'rounded-t-xl' : 'rounded-xl'}`}
            >
                <span className="text-gray-500">{open ? <ChevronDown /> : <ChevronRight />}</span>
                <span className="font-mono text-xs font-bold text-gray-600 w-6 shrink-0">{shortCode}</span>
                <span className="text-sm font-medium text-gray-800 flex-1">{domaine.nom || ''}</span>
                <span className="text-xs text-gray-400 shrink-0">{allMesures.length} mesures</span>
            </button>
            {open && (
                <div className="px-2 py-2">
                    {allMesures.map(m => {
                        const code = m.code?.trim().replace(/^A\./, '');   // "A.5.1" → "5.1"
                        const rawDesc = m.description || '—';
                        const dashIdx = rawDesc.indexOf(' — ');
                        const title = dashIdx !== -1 ? rawDesc.slice(0, dashIdx) : rawDesc;
                        const body  = dashIdx !== -1 ? rawDesc.slice(dashIdx + 3) : '';
                        const objectif = ISO_MESURE_OBJECTIVES[m.code?.trim()];
                        return (
                            <div key={m.id} className="relative group flex items-start gap-2 py-1.5 px-3 rounded hover:bg-gray-50 ml-1">
                                <span className="font-mono text-xs font-semibold text-gray-500 mt-0.5 w-10 shrink-0">{code}</span>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-semibold text-gray-800">{title}</span>
                                    {body && <span className="text-xs text-gray-500"> — {body}</span>}
                                </div>
                                {objectif && (
                                    <Tooltip title={`Objectif ${code}`} body={objectif} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const ReferentielsPage = () => {
    const [referentiels, setReferentiels] = useState([]);
    const [stats, setStats] = useState({});
    const [selected, setSelected] = useState(null);
    const [tree, setTree] = useState(null);
    const [loadingTree, setLoadingTree] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getAllReferentiels();
                const list = res.data.referentiels || [];
                setReferentiels(list);
                // Charger les stats pour chaque référentiel
                const statsMap = {};
                await Promise.all(list.map(async (r) => {
                    try {
                        const s = await getReferentielStats(r.id);
                        statsMap[r.id] = s.data.stats;
                    } catch {}
                }));
                setStats(statsMap);
            } catch {}
            finally { setLoadingList(false); }
        };
        load();
    }, []);

    const selectReferentiel = async (ref) => {
        if (selected?.id === ref.id) { setSelected(null); setTree(null); return; }
        setSelected(ref);
        setTree(null);
        setLoadingTree(true);
        try {
            const res = await getReferentielById(ref.id);
            setTree(res.data.referentiel);
        } catch {}
        finally { setLoadingTree(false); }
    };

    // Tri naturel : "1","2","10","11" au lieu de "1","10","11","2"
    const naturalSort = (a, b) =>
        a.code?.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }) ?? 0;

    const sortedDomaines = tree?.domaines
        ?.map(d => ({
            ...d,
            objectifs: d.objectifs
                ?.map(o => ({ ...o, mesures: [...(o.mesures || [])].sort(naturalSort) }))
                .sort(naturalSort),
        }))
        .sort(naturalSort) || [];

    // Filtrer les domaines selon la recherche
    const filteredDomaines = sortedDomaines.filter(d => {
        if (!search) return true;
        const q = search.toLowerCase();
        if (d.code?.toLowerCase().includes(q) || d.nom?.toLowerCase().includes(q)) return true;
        return d.objectifs?.some(o =>
            o.code?.toLowerCase().includes(q) ||
            o.nom?.toLowerCase().includes(q) ||
            o.mesures?.some(m => m.code?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q))
        );
    }) || [];

    return (
        <div>
            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Référentiels</h1>
                <p className="text-sm text-gray-500 mt-0.5">Vue arborescente des référentiels de contrôle</p>
            </div>

            {/* Cartes de sélection */}
            {loadingList ? (
                <div className="flex justify-center py-12">
                    <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {referentiels.map(ref => {
                        const cfg = TYPE_CONFIG[ref.type] || TYPE_CONFIG.DNSSI;
                        const s = stats[ref.id];
                        const isActive = selected?.id === ref.id;
                        return (
                            <button
                                key={ref.id}
                                onClick={() => selectReferentiel(ref)}
                                className="text-left rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg"
                                style={{
                                    borderColor: isActive ? cfg.color : '#E5E7EB',
                                    boxShadow: isActive ? `0 0 0 3px ${cfg.bg}, 0 0 0 4px ${cfg.border}` : undefined,
                                }}
                            >
                                <div className="p-5" style={{ backgroundColor: isActive ? cfg.bg : '#fff' }}>
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex-1 min-w-0">
                                            <span
                                                className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md mb-2 tracking-wide uppercase"
                                                style={{ backgroundColor: cfg.bg, color: cfg.color }}
                                            >
                                                {cfg.label}
                                            </span>
                                            <h3 className="text-sm font-semibold text-gray-900 leading-snug">{ref.nom}</h3>
                                            {ref.version && (
                                                <p className="text-xs text-gray-400 mt-0.5">Version {ref.version}</p>
                                            )}
                                            {ref.description && (
                                                <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{ref.description}</p>
                                            )}
                                        </div>
                                        {/* Icône cadenas/shield */}
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.bg }}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: cfg.color }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-2 mb-4">
                                        {s ? (
                                            <>
                                                {[
                                                    { val: s.domaines,  lbl: 'domaines'  },
                                                    { val: s.objectifs, lbl: 'objectifs' },
                                                    { val: s.mesures,   lbl: 'mesures'   },
                                                ].map(({ val, lbl }) => (
                                                    <div key={lbl} className="flex-1 text-center py-2 rounded-xl" style={{ backgroundColor: isActive ? '#fff' : cfg.bg }}>
                                                        <p className="text-base font-bold leading-none" style={{ color: cfg.color }}>{val}</p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">{lbl}</p>
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <div className="w-3.5 h-3.5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: cfg.color }} />
                                                Chargement des stats...
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer toggle */}
                                    <div className="flex items-center gap-1.5 text-xs font-semibold pt-3 border-t" style={{ color: cfg.color, borderColor: isActive ? cfg.border : '#F3F4F6' }}>
                                        {isActive ? <ChevronDown /> : <ChevronRight />}
                                        <span>{isActive ? "Masquer l'arborescence" : "Voir l'arborescence"}</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Vue arborescente */}
            {selected && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">{selected.nom}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {TYPE_CONFIG[selected.type]?.label} · {tree?.domaines?.length || '—'} domaines
                            </p>
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher un code ou mot-clé..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 w-64 focus:outline-none focus:ring-1"
                        />
                    </div>

                    <div className="p-4">
                        {loadingTree ? (
                            <div className="flex justify-center py-12">
                                <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                            </div>
                        ) : filteredDomaines.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">
                                {search ? 'Aucun résultat pour cette recherche' : 'Aucun domaine trouvé'}
                            </p>
                        ) : (
                            filteredDomaines.map((d, i, arr) => {
                                const isAnnexe = d.code.startsWith('A.');
                                const prevIsAnnexe = i > 0 && arr[i - 1].code.startsWith('A.');
                                return (
                                    <div key={d.id}>
                                        {isAnnexe && !prevIsAnnexe && (
                                            <div className="flex items-center gap-3 my-4">
                                                <div className="flex-1 h-px bg-gray-200" />
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Annexe A</span>
                                                <div className="flex-1 h-px bg-gray-200" />
                                            </div>
                                        )}
                                        {isAnnexe
                                            ? <AnnexeAChapitreRow domaine={d} />
                                            : <DomaineRow domaine={d} />
                                        }
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReferentielsPage;
