<!-- converted from Cahier de charge_Plateforme_Audit_GRC.docx -->


CAHIER DES CHARGES
Projet de Stage de Fin d'Études
Plateforme Web d'Audit GRC — ISO 27001 & DNSSI


# Sommaire

# 1. Contexte et Problématique
## 1.1 Contexte Général
Dans un environnement numérique de plus en plus exposer aux cybermenaces, la sécurité de l'information est devenue un enjeu stratégique majeur pour toutes les organisations. Les entreprises, qu'elles soient publiques ou privées, sont aujourd'hui soumises à des exigences réglementaires et normatives croissantes.
Deux référentiels sont particulièrement structurants dans ce contexte :
- ISO 27001 : Norme internationale définissant les exigences pour la mise en place d'un Système de Management de la Sécurité de l'Information (SMSI). Elle repose sur 114 mesures de sécurité (Annexe A) regroupées en 14 domaines.
- DNSSI (Directive Nationale de la Sécurité des Systèmes d'Information) : Référentiel national applicable aux administrations et opérateurs d'importance vitale, structurant les exigences de sécurité des SI au niveau étatique.

## 1.2 Problématique Identifiée
Aujourd'hui, les audits de conformité GRC (Gouvernance, Risque, Conformité) sont majoritairement réalisés via des fichiers Excel non structurés. Cette approche présente de nombreuses limites :
- Absence de standardisation : chaque auditeur crée ses propres modèles, rendant la comparaison et la mutualisation impossibles.
- Risque d'erreur élevé : saisies manuelles, formules cassées, absence de contrôle de cohérence.
- Restitution fastidieuse : les graphiques et rapports doivent être générés manuellement après chaque audit.
- Pas de centralisation : les données d'audit sont dispersées sur des postes individuels, sans historique ni traçabilité.
- Collaboration limitée : plusieurs auditeurs ne peuvent pas travailler simultanément sur un même dossier.

## 1.3 Enjeux du Projet
Le projet vise à répondre à ces problèmes par le développement d'une application web dédiée à la digitalisation des audits de conformité. Les enjeux sont :
- Améliorer la qualité et la fiabilité des évaluations de conformité.
- Réduire le temps de production des rapports d'audit.
- Offrir une vision consolidée et historisée des audits réalisés.
- Faciliter la prise de décision grâce à des indicateurs visuels clairs (rosace de maturité, graphiques de restitution).
- Permettre la priorisation des actions correctives via un plan d'actions structuré.

# 2. Objectifs du Projet
## 2.1 Objectif Principal
Développer une application web permettant de réaliser, centraliser et restituer des audits de conformité ISO 27001 et DNSSI, avec génération automatique de livrables exploitables en mission d'audit.
## 2.2 Objectifs Spécifiques
- Permettre la saisie structurée des réponses aux exigences ISO 27001 et DNSSI.
- Calculer automatiquement les niveaux de maturité par domaine et globalement.
- Générer des graphiques de restitution (radar, barres, camembert) exploitables.
- Produire une rosace de maturité visuelle et exportable.
- Générer automatiquement un plan d'actions priorisé selon le niveau de risque.
- Produire des rapports filtrés exportables (PDF, Excel).
- Centraliser les audits dans une base de données avec gestion multi-utilisateurs.
- Assurer la traçabilité et l'historique des audits par client / organisation.

# 3. Périmètre Fonctionnel
## 3.1 Modules de l'Application
### Module 1 — Gestion des utilisateurs et accès
- Authentification sécurisée (login / mot de passe, option 2FA).
- Gestion des rôles : Administrateur, Auditeur Senior, Auditeur Junior, Client.
- Gestion des droits d'accès par rôle et par projet d'audit.
- Tableau de bord personnalisé selon le profil connecté.

### Module 2 — Gestion des référentiels
- Intégration complète du référentiel ISO 27001 (114 mesures, 14 domaines).
- Intégration du référentiel DNSSI avec ses axes et mesures associés.
- Possibilité d'ajouter ou de personnaliser des référentiels complémentaires.
- Versionning des référentiels (ISO 27001:2013 et ISO 27001:2022).

### Module 3 — Réalisation de l'audit
- Création d'un projet d'audit (client, périmètre, dates, auditeurs assignés).
- Saisie des réponses par exigence selon une échelle de maturité définie (0 à 5 — CMMI).
- Ajout de commentaires, preuves et pièces jointes par mesure.
- Sauvegarde automatique des saisies (autosave).
- Indicateur de progression de l'audit en temps réel (% complété).
- Mode multi-auditeur : plusieurs auditeurs peuvent saisir simultanément.

### Module 4 — Tableau de bord et visualisations
- Rosace de maturité : graphique radar représentant la maturité par domaine.
- Graphique en barres : comparaison des scores par domaine.
- Graphique camembert : répartition des niveaux de conformité (Conforme / Partiel / Non conforme).
- Tableau synthétique des résultats avec code couleur (vert / orange / rouge).
- Comparaison multi-audits pour suivre l'évolution dans le temps.

### Module 5 — Plan d'actions
- Génération automatique du plan d'actions à partir des non-conformités identifiées.
- Priorisation des actions selon la criticité (Impact x Probabilité).
- Affectation des actions à des responsables avec délais.
- Suivi de l'état d'avancement des actions (À faire / En cours / Clôturé).
- Export du plan d'actions en format Excel et PDF.

### Module 6 — Génération de rapports
- Rapport d'audit complet : synthèse exécutive, résultats détaillés, plan d'actions.
- Rapport filtré par domaine, par niveau de criticité, ou par responsable.
- Export en PDF (mise en page professionnelle avec logo et en-tête personnalisables).
- Export en Excel pour analyses complémentaires.
- Rapport de comparaison entre deux audits (évolution de la maturité).

# 4. Architecture Technique
## 4.1 Stack Technologique Recommandée

## 4.2 Architecture Globale
L'application suivra une architecture client-serveur à 3 couches :
- Couche Présentation (Frontend) : Interface utilisateur SPA accessible via navigateur web. Communique avec le backend via des appels API REST (JSON).
- Couche Métier (Backend / API) : Serveur applicatif exposant les endpoints API. Implémente la logique métier (calcul de maturité, génération de rapports, gestion des droits).
- Couche Données (Base de données) : Stockage persistant des référentiels, projets d'audit, réponses, utilisateurs, plans d'actions. Accès via ORM.

## 4.3 Modèle de Données Simplifié
Les principales entités de la base de données sont :

# 5. Référentiel de Maturité (Modèle CMMI)
L'évaluation des mesures de contrôle sera réalisée selon une échelle de maturité inspirée du modèle CMMI (Capability Maturity Model Integration), adaptée au contexte des audits ISO 27001 et DNSSI.


Le score de maturité global d'un domaine est calculé comme la moyenne arithmétique des niveaux de toutes les mesures du domaine. Le score global de l'audit est la moyenne pondérée de tous les domaines.

# 6. Spécifications Fonctionnelles Détaillées
## 6.1 Rosace de Maturité
La rosace de maturité est un graphique de type radar (spider chart) représentant graphiquement le niveau de maturité de l'organisation pour chaque domaine du référentiel audité.
### Caractéristiques techniques :
- Axes : un axe par domaine du référentiel (14 axes pour ISO 27001, variable pour DNSSI).
- Échelle : de 0 (centre) à 5 (périphérie).
- Deux tracés superposés : niveau actuel (bleu) et cible (vert pointillé).
- Zones de couleur selon les niveaux (rouge 0-1, orange 2, jaune 3, vert 4-5).
- Export possible en image PNG/SVG et intégré automatiquement dans le rapport PDF.

## 6.2 Graphiques de Restitution
En complément de la rosace, les graphiques suivants seront générés :
- Graphique en barres horizontales : classement des domaines par score de maturité, avec code couleur.
- Graphique camembert : répartition des mesures par statut (Conforme / Partiellement conforme / Non conforme).
- Graphique d'évolution : courbe temporelle du score global sur les audits successifs (si disponible).
- Tableau de chaleur (heatmap) : vue matricielle des niveaux de maturité par domaine et sous-domaine.

## 6.3 Plan d'Actions Priorisé
Le plan d'actions est généré automatiquement à partir de toutes les mesures ayant un niveau de maturité inférieur à la cible définie. Il respecte les caractéristiques suivantes :
### Calcul de la priorité :
- Criticité = (Niveau cible - Niveau actuel) x Pondération du domaine.
- Priorité HAUTE : Criticité ≥ 3 (action immédiate requise).
- Priorité MOYENNE : Criticité entre 1,5 et 3 (à traiter dans les 3 mois).
- Priorité BASSE : Criticité < 1,5 (amélioration continue, 6+ mois).
### Contenu du plan d'actions :
- Référence de la mesure (ex : A.9.1 pour ISO 27001).
- Description de la non-conformité constatée.
- Action corrective recommandée.
- Responsable désigné, délai de mise en œuvre, ressources estimées.
- Indicateur de suivi (KPI associé à la mesure).

## 6.4 Rapports Filtrés
L'application permettra de générer plusieurs types de rapports selon les besoins :

# 7. Contraintes et Exigences Non Fonctionnelles
## 7.1 Sécurité
- Chiffrement des mots de passe (bcrypt, coût ≥ 12).
- Authentification par token JWT avec expiration configurée.
- Protection contre les injections SQL (requêtes paramétrées / ORM).
- Protection XSS et CSRF sur toutes les routes.
- Chiffrement des communications (HTTPS/TLS).
- Journalisation des accès et actions sensibles (logs d'audit).

## 7.2 Performance
- Temps de chargement des pages < 3 secondes (connexion standard).
- Génération d'un rapport PDF < 10 secondes.
- Support de 20 utilisateurs simultanés minimum sans dégradation notable.
- Autosave des saisies toutes les 30 secondes.

## 7.3 Ergonomie et Accessibilité
- Interface responsive (compatible Desktop, Tablette).
- Navigation intuitive avec indicateurs de progression clairs.
- Messages d'erreur explicites et aide contextuelle.
- Langue : Français (interface principale), Anglais (option secondaire).

## 7.4 Maintenabilité
- Code source versionné sur Git avec conventions de commit claires.
- Documentation technique (README, diagrammes d'architecture, Swagger API).
- Tests unitaires pour la logique de calcul de maturité (couverture ≥ 70%).
- Architecture modulaire facilitant l'ajout de nouveaux référentiels.

# 8. Planning Prévisionnel
Le projet est découpé en 5 phases sur la durée du stage. Le planning ci-dessous est indicatif et pourra être ajusté en accord avec le maître de stage.


# 9. Livrables Attendus
## 9.1 Livrables Techniques
- Code source complet et versionné sur un dépôt Git (GitHub / GitLab).
- Base de données initialisée avec les référentiels ISO 27001 et DNSSI.
- API REST documentée (Swagger / OpenAPI).
- Application web déployée et accessible.
- Suite de tests automatisés.

## 9.2 Livrables Documentaires
- Cahier des charges (ce document).
- Dossier de conception : modèle de données (MCD/MLD), diagrammes d'architecture, maquettes UI.
- Manuel utilisateur (guide d'utilisation de la plateforme).
- Documentation technique (guide d'installation, configuration, déploiement).
- Rapport de stage final.

# 10. Glossaire

| Référence | CDC-GRC-AUDIT-2025 |
| --- | --- |
| Version | v1.0 |
| Date | Avril 2025 |
| Domaine | GRC / Sécurité de l'Information |
| Couche | Technologie | Justification |
| --- | --- | --- |
| Frontend | React.js ou Vue.js | SPA dynamique, composants réutilisables, large écosystème de graphiques |
| Backend | Node.js (Express) ou Django (Python) | API REST robuste, rapidité de développement |
| Base de données | PostgreSQL | Relationnel, fiable, open-source, performant pour données structurées |
| Authentification | JWT + bcrypt | Sécurisé, stateless, compatible API REST |
| Graphiques | Chart.js ou D3.js | Génération de radars, barres, camemberts interactifs |
| Export PDF | Puppeteer ou jsPDF | Génération de PDF côté serveur avec mise en page HTML/CSS |
| Export Excel | ExcelJS ou SheetJS | Génération de fichiers .xlsx structurés |
| Hébergement | Docker + Nginx | Déploiement conteneurisé, scalable |
| Entité | Attributs principaux |
| --- | --- |
| Utilisateur | id, nom, email, mot_de_passe_hash, rôle, date_création |
| Organisation | id, nom, secteur, contact, date_création |
| Projet_Audit | id, organisation_id, référentiel, date_début, date_fin, statut, auditeurs |
| Référentiel | id, nom (ISO27001/DNSSI), version, date_publication |
| Domaine | id, référentiel_id, code, libellé, pondération |
| Mesure | id, domaine_id, code, libellé, description, objectif |
| Réponse_Audit | id, projet_id, mesure_id, niveau (0-5), commentaire, preuves, auditeur_id |
| Action | id, projet_id, mesure_id, priorité, responsable, délai, statut, description |
| Niveau | Libellé | Description | Couleur |
| --- | --- | --- | --- |
| 0 | Inexistant | Aucune mesure en place. La pratique est absente de l'organisation. | Rouge foncé (#8B0000) |
| 1 | Initial | La mesure existe de manière informelle. Non documentée, dépend des individus. | Rouge (#CC0000) |
| 2 | Reproductible | La mesure est définie et documentée. Appliquée mais sans contrôle régulier. | Orange (#FF8C00) |
| 3 | Défini | Processus standardisé, documenté et communiqué. Formation en place. | Jaune (#DAA520) |
| 4 | Géré | Mesure appliquée, surveillée avec indicateurs. Des contrôles sont réalisés régulièrement. | Vert clair (#228B22) |
| 5 | Optimisé | Processus optimisé en continu. Automatisation, amélioration proactive et retour d'expérience. | Vert (#006400) |
| Type de rapport | Contenu | Format export |
| --- | --- | --- |
| Rapport Exécutif | Synthèse globale, rosace, score de maturité, top 5 risques | PDF |
| Rapport Détaillé | Toutes les mesures, réponses, preuves, commentaires | PDF / Excel |
| Rapport par Domaine | Résultats filtrés sur un domaine spécifique | PDF / Excel |
| Plan d'Actions | Toutes les actions correctives priorisées | Excel / PDF |
| Rapport Comparatif | Évolution entre deux audits successifs | PDF |
| Phase | Intitulé | Activités | Durée | Livrable |
| --- | --- | --- | --- | --- |
| 1 | Analyse & Conception | Étude des référentiels ISO 27001 et DNSSI, recueil des besoins, modélisation BDD, maquettage UI (wireframes), rédaction spécifications. | 2 semaines | CDC, MCD, Wireframes |
| 2 | Développement Backend | Mise en place de l'environnement, développement de l'API REST, gestion des utilisateurs, intégration des référentiels en base, logique de calcul de maturité. | 3 semaines | API documentée (Swagger) |
| 3 | Développement Frontend | Développement de l'interface utilisateur : formulaires d'audit, tableau de bord, graphiques (rosace, barres, camembert), plan d'actions. | 3 semaines | Interface web fonctionnelle |
| 4 | Génération de rapports | Développement du moteur de rapports PDF/Excel, templates personnalisables, export des graphiques, filtres de rapports. | 2 semaines | Module rapport complet |
| 5 | Tests & Déploiement | Tests unitaires, tests d'intégration, tests utilisateurs (UAT), correction des bugs, déploiement en environnement de production (Docker). | 2 semaines | Application déployée + documentation |
| Terme | Définition |
| --- | --- |
| GRC | Gouvernance, Risque, Conformité. Ensemble des pratiques visant à aligner les activités de l'organisation sur ses objectifs tout en gérant les risques. |
| ISO 27001 | Norme internationale de management de la sécurité de l'information. Définit les exigences pour établir, mettre en œuvre et améliorer un SMSI. |
| DNSSI | Directive Nationale de la Sécurité des Systèmes d'Information. Référentiel réglementaire national applicable aux administrations et OIV. |
| SMSI | Système de Management de la Sécurité de l'Information. Ensemble de politiques et procédures pour gérer les risques de sécurité de l'information. |
| CMMI | Capability Maturity Model Integration. Modèle d'évaluation de la maturité des processus sur une échelle de 0 à 5. |
| OIV | Opérateur d'Importance Vitale. Entité dont l'indisponibilité pourrait nuire gravement à la Nation. |
| API REST | Interface de programmation permettant la communication entre le frontend et le backend via le protocole HTTP. |
| JWT | JSON Web Token. Standard d'authentification stateless utilisé pour sécuriser les échanges entre client et serveur. |
| SPA | Single Page Application. Application web dont le contenu est chargé dynamiquement sans rechargement de la page. |
| UAT | User Acceptance Testing. Phase de tests réalisée par les utilisateurs finaux pour valider que l'application répond à leurs besoins. |