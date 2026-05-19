// ─── Constantes partagées AuditDetailPage ────────────────────────────────────

export const PHASES_DEF = [
    { id: 'cadrage', label: 'Cadrage' },
    { id: 'prerequis', label: 'Prérequis' },
    { id: 'revue_documentaire', label: 'Revue doc.' },
    { id: 'realisation', label: 'Réalisation' },
    { id: 'termine', label: 'Terminé' },
];

export const NIVEAUX = [
    { value: -2, label: 'N/A', color: 'text-gray-400' },
    { value: 0, label: 'Aucun', color: 'text-red-600' },
    { value: 1, label: 'Initial', color: 'text-orange-500' },
    { value: 2, label: 'Reproductible', color: 'text-yellow-500' },
    { value: 3, label: 'Défini', color: 'text-blue-500' },
    { value: 4, label: 'Maitrisé', color: 'text-indigo-600' },
    { value: 5, label: 'Optimisé', color: 'text-green-600' },
];

export const CONFORMITE_CONFIG = {
    conforme: { label: 'Totale', bg: 'bg-green-50', text: 'text-green-700' },
    partiel: { label: 'Partielle', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    non_conforme: { label: 'Non conforme', bg: 'bg-red-50', text: 'text-red-700' },
    nc_mineure: { label: 'NC mineure', bg: 'bg-orange-50', text: 'text-orange-700' },
    nc_majeure: { label: 'NC majeure', bg: 'bg-red-50', text: 'text-red-700' },
    na: { label: 'N/A', bg: 'bg-gray-100', text: 'text-gray-500' },
};

export const STATUT_CONFIG = {
    brouillon: { label: 'Brouillon', bg: 'bg-gray-100', text: 'text-gray-600' },
    en_cours: { label: 'En cours', bg: 'bg-blue-50', text: 'text-blue-700' },
    termine: { label: 'Terminé', bg: 'bg-green-50', text: 'text-green-700' },
    archive: { label: 'Archivé', bg: 'bg-yellow-50', text: 'text-yellow-700' },
};

export const TABS_DNSSI = [
    { id: 'description', label: 'Description outil évaluation' },
    { id: 'identification', label: 'Identification entité ou IIV' },
    { id: 'evaluation', label: 'Évaluation MO DNSSI' },
    { id: 'synthese_mat', label: 'Synthèse niveau de maturité' },
    { id: 'synthese_conf', label: 'Synthèse niveau de conformité' },
    { id: 'avancement', label: "État d'avancement" },
    { id: 'plans_actions', label: "Plan d'actions" },
    { id: 'indicateurs', label: 'Indicateurs de la SSI' },
];

export const TABS_ISO = [
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
export const RAISONS_INCLUSION = [
    { value: 'legal', label: 'Exigence légale / réglementaire' },
    { value: 'contractuel', label: 'Exigence contractuelle' },
    { value: 'risque', label: "Résultat d'appréciation des risques" },
    { value: 'bonne_pratique', label: 'Bonne pratique retenue' },
];

export const STATUT_IMPL_CONFIG = {
    implemente: { label: 'Implémenté', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    partiel: { label: 'Partiellement impl.', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    planifie: { label: 'Planifié', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    non_implemente: { label: 'Non implémenté', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export const INDICATEURS_DEF = [
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

export const ISO_INDICATEURS_DEF = [
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

export const VALIDATION_CONFIG = {
    en_attente: { label: 'En attente de validation', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    valide: { label: 'Validé', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    rejete: { label: 'Rejeté', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export const ISO_CONF_STATES = [
    { value: 5, label: 'Conforme', activeCls: 'bg-green-600 text-white border-green-600', inactiveCls: 'bg-white text-gray-500 border-gray-200 hover:border-green-400' },
    { value: 2, label: 'NC mineure', activeCls: 'bg-orange-500 text-white border-orange-500', inactiveCls: 'bg-white text-gray-500 border-gray-200 hover:border-orange-400' },
    { value: 0, label: 'NC majeure', activeCls: 'bg-red-600 text-white border-red-600', inactiveCls: 'bg-white text-gray-500 border-gray-200 hover:border-red-400' },
];

export const PRIORITE_CONFIG = {
    haute: { label: 'Haute', bg: 'bg-red-50', text: 'text-red-700' },
    moyenne: { label: 'Moyenne', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    basse: { label: 'Basse', bg: 'bg-green-50', text: 'text-green-700' },
};

export const STATUT_PLAN_CONFIG = {
    a_faire: { label: 'À faire', bg: 'bg-gray-100', text: 'text-gray-600' },
    en_cours: { label: 'En cours', bg: 'bg-blue-50', text: 'text-blue-700' },
    cloture: { label: 'Clôturé', bg: 'bg-green-50', text: 'text-green-700' },
};

export const PLAN_VALIDATION_CONFIG = {
    en_attente: { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700' },
    valide: { label: 'Validé', bg: 'bg-green-50', text: 'text-green-700' },
    rejete: { label: 'Rejeté', bg: 'bg-red-50', text: 'text-red-700' },
};

export const TYPE_AUDIT_OPTIONS = [
    { value: 'diagnostique', label: 'Audit diagnostique' },
    { value: 'a_blanc', label: 'Audit à blanc' },
    { value: 'conformite', label: 'Audit de conformité' },
];

export const ETAPES_DEF = [
    { nom: 'Cadrage', activites: 'Réunion de lancement, définition du périmètre, collecte des informations générales', date_debut: '', date_fin: '', duree: '1 semaine', livrables: 'Lettre de mission, planning validé' },
    { nom: 'Prérequis / Collecte documents', activites: 'Envoi de la liste de documents requis, relance et suivi de réception', date_debut: '', date_fin: '', duree: '1 semaine', livrables: 'Documents clients réceptionnés' },
    { nom: 'Revue documentaire', activites: "Analyse des politiques, procédures et preuves fournies par le client", date_debut: '', date_fin: '', duree: '1 semaine', livrables: "Grille d'analyse documentaire" },
    { nom: 'Réalisation', activites: "Entretiens, tests techniques, évaluations des mesures de contrôle", date_debut: '', date_fin: '', duree: '2 semaines', livrables: "Grille d'évaluation complétée" },
    { nom: 'Rendu du rapport', activites: "Rédaction, relecture et remise du rapport final au client", date_debut: '', date_fin: '', duree: '1 semaine', livrables: "Rapport d'audit final, plan d'actions priorisé" },
];

// Documents
export const FILE_ICONS = {
    'application/pdf': '📄',
    'application/msword': '📝',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'image/jpeg': '🖼️',
    'image/png': '🖼️',
};

export const PREVIEWABLE = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain'];

export const STATUT_BADGE = {
    en_attente: { label: 'En attente', cls: 'bg-gray-100 text-gray-500' },
    valide: { label: 'Validé', cls: 'bg-green-100 text-green-700' },
    refuse: { label: 'Refusé', cls: 'bg-red-100 text-red-700' },
};
