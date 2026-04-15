const { sequelize, Referentiel, Domaine, Objectif, Mesure } = require('./src/models');

// ─── Structure ISO 27001:2022 — Annexe A (93 contrôles) ──────────────────────
// 4 thèmes → 15 objectifs → 93 mesures

const ISO27001_DATA = [
    {
        code: 'A.5',
        nom: 'Contrôles organisationnels',
        description: 'Contrôles portant sur les politiques, la gouvernance, la gestion des actifs, des accès, des fournisseurs, des incidents et la conformité.',
        objectifs: [
            {
                code: 'A.5.1',
                description: 'Objectif 1 : Établir les politiques de sécurité de l\'information et les responsabilités organisationnelles pour en assurer la gouvernance.',
                mesures: [
                    { code: 'A.5.1',  description: 'Politiques de sécurité de l\'information — Définir, approuver, publier et réviser régulièrement des politiques de sécurité de l\'information.' },
                    { code: 'A.5.2',  description: 'Rôles et responsabilités en matière de sécurité de l\'information — Définir et attribuer les rôles et responsabilités liés à la sécurité.' },
                    { code: 'A.5.3',  description: 'Séparation des tâches — Séparer les tâches et les domaines de responsabilité conflictuels pour réduire les risques de fraude et d\'erreur.' },
                    { code: 'A.5.4',  description: 'Responsabilités de la direction — La direction doit exiger que tous les membres du personnel appliquent la sécurité conformément aux politiques.' },
                ],
            },
            {
                code: 'A.5.2',
                description: 'Objectif 2 : Maintenir des relations avec les parties externes et assurer une veille sur les menaces en matière de sécurité.',
                mesures: [
                    { code: 'A.5.5',  description: 'Relations avec les autorités — Maintenir des contacts appropriés avec les autorités compétentes.' },
                    { code: 'A.5.6',  description: 'Relations avec les groupes d\'intérêt spécifiques — Maintenir des contacts avec des groupes d\'intérêt spécialisés en sécurité.' },
                    { code: 'A.5.7',  description: 'Renseignement sur les menaces — Collecter et analyser des renseignements sur les menaces afin de prendre les mesures appropriées.' },
                    { code: 'A.5.8',  description: 'Sécurité de l\'information dans la gestion de projet — Intégrer la sécurité de l\'information dans la gestion de tous types de projets.' },
                ],
            },
            {
                code: 'A.5.3',
                description: 'Objectif 3 : Identifier, classifier et étiqueter les informations et les actifs associés pour en assurer la protection adéquate.',
                mesures: [
                    { code: 'A.5.9',  description: 'Inventaire des informations et autres actifs associés — Établir et maintenir un inventaire des informations et des actifs associés.' },
                    { code: 'A.5.10', description: 'Utilisation acceptable des informations et autres actifs — Définir et mettre en œuvre des règles pour l\'utilisation acceptable des informations.' },
                    { code: 'A.5.11', description: 'Restitution des actifs — Faire restituer tous les actifs lors de la cessation de l\'emploi ou de la modification du contrat.' },
                    { code: 'A.5.12', description: 'Classification des informations — Classifier les informations selon les exigences légales, la valeur et la sensibilité.' },
                    { code: 'A.5.13', description: 'Étiquetage des informations — Développer et mettre en œuvre un ensemble approprié de procédures d\'étiquetage des informations.' },
                ],
            },
            {
                code: 'A.5.4',
                description: 'Objectif 4 : Contrôler l\'accès aux informations et gérer les identités et les droits d\'accès des utilisateurs.',
                mesures: [
                    { code: 'A.5.14', description: 'Transfert d\'informations — Des règles, procédures ou accords de transfert doivent être en place pour tous types de transferts d\'informations.' },
                    { code: 'A.5.15', description: 'Contrôle d\'accès — Établir et mettre en œuvre des règles de contrôle d\'accès physique et logique aux informations.' },
                    { code: 'A.5.16', description: 'Gestion des identités — Gérer l\'ensemble du cycle de vie des identités.' },
                    { code: 'A.5.17', description: 'Informations d\'authentification — Gérer les informations d\'authentification secrètes par le biais d\'un processus de gestion formelle.' },
                    { code: 'A.5.18', description: 'Droits d\'accès — Provisionner, réviser, modifier et supprimer les droits d\'accès conformément à la politique de contrôle d\'accès.' },
                ],
            },
            {
                code: 'A.5.5',
                description: 'Objectif 5 : Assurer la sécurité de l\'information dans les relations avec les fournisseurs, y compris les services Cloud.',
                mesures: [
                    { code: 'A.5.19', description: 'Sécurité de l\'information dans les relations avec les fournisseurs — Identifier et mettre en œuvre des contrôles pour gérer les risques liés aux fournisseurs.' },
                    { code: 'A.5.20', description: 'Prise en compte de la sécurité dans les accords fournisseurs — Établir les exigences de sécurité pertinentes dans les accords avec les fournisseurs.' },
                    { code: 'A.5.21', description: 'Gestion de la sécurité dans la chaîne d\'approvisionnement TIC — Définir et mettre en œuvre des processus pour gérer les risques liés à la chaîne TIC.' },
                    { code: 'A.5.22', description: 'Suivi, révision et gestion des changements des services fournisseurs — Surveiller, réviser et gérer les changements des pratiques et des services des fournisseurs.' },
                    { code: 'A.5.23', description: 'Sécurité de l\'information dans l\'utilisation de services Cloud — Établir des processus pour l\'acquisition, l\'utilisation, la gestion et la fin des services Cloud.' },
                ],
            },
            {
                code: 'A.5.6',
                description: 'Objectif 6 : Planifier, détecter, répondre et tirer des enseignements des incidents de sécurité de l\'information.',
                mesures: [
                    { code: 'A.5.24', description: 'Planification et préparation de la gestion des incidents — Planifier et se préparer à la gestion des incidents par la définition de processus, rôles et responsabilités.' },
                    { code: 'A.5.25', description: 'Appréciation et décision relatives aux événements de sécurité — Apprécier les événements et décider s\'ils sont classifiés comme incidents.' },
                    { code: 'A.5.26', description: 'Réponse aux incidents de sécurité — Répondre aux incidents conformément aux procédures documentées.' },
                    { code: 'A.5.27', description: 'Retour d\'expérience sur les incidents de sécurité — Utiliser les connaissances acquises lors des incidents pour renforcer les contrôles.' },
                    { code: 'A.5.28', description: 'Collecte de preuves — Établir et appliquer des procédures d\'identification, de collecte, d\'acquisition et de préservation des preuves.' },
                ],
            },
            {
                code: 'A.5.7',
                description: 'Objectif 7 : Assurer la continuité d\'activité, respecter les exigences légales et maintenir la conformité aux politiques de sécurité.',
                mesures: [
                    { code: 'A.5.29', description: 'Sécurité de l\'information lors des perturbations — Planifier la manière dont la sécurité sera maintenue lors d\'une perturbation.' },
                    { code: 'A.5.30', description: 'Disponibilité des TIC pour la continuité d\'activité — Planifier, mettre en œuvre, maintenir et tester la disponibilité des TIC lors des perturbations.' },
                    { code: 'A.5.31', description: 'Exigences légales, réglementaires et contractuelles — Identifier et documenter les exigences légales, réglementaires et contractuelles applicables.' },
                    { code: 'A.5.32', description: 'Droits de propriété intellectuelle — Mettre en œuvre des procédures appropriées pour protéger les droits de propriété intellectuelle.' },
                    { code: 'A.5.33', description: 'Protection des enregistrements — Protéger les enregistrements contre la perte, la destruction, la falsification et l\'accès non autorisé.' },
                    { code: 'A.5.34', description: 'Protection de la vie privée et des données à caractère personnel — Identifier et respecter les exigences de protection de la vie privée et des DCP.' },
                    { code: 'A.5.35', description: 'Revue indépendante de la sécurité de l\'information — Soumettre l\'approche de l\'organisation à des revues indépendantes à intervalles planifiés.' },
                    { code: 'A.5.36', description: 'Conformité aux politiques et normes de sécurité — Réviser régulièrement la conformité du traitement de l\'information aux politiques et procédures.' },
                    { code: 'A.5.37', description: 'Procédures opérationnelles documentées — Documenter les procédures d\'exploitation relatives aux installations de traitement de l\'information.' },
                ],
            },
        ],
    },

    {
        code: 'A.6',
        nom: 'Contrôles liés aux personnes',
        description: 'Contrôles portant sur le personnel : sélection, formation, sensibilisation, responsabilités et signalement des incidents.',
        objectifs: [
            {
                code: 'A.6.1',
                description: 'Objectif 8 : S\'assurer que les membres du personnel et les contractuels comprennent leurs responsabilités en matière de sécurité et sont compétents.',
                mesures: [
                    { code: 'A.6.1', description: 'Sélection — Vérifier les antécédents de tous les candidats avant leur embauche et de manière continue selon les besoins.' },
                    { code: 'A.6.2', description: 'Termes et conditions d\'embauche — Les accords contractuels doivent préciser les responsabilités du personnel et de l\'organisation en matière de sécurité.' },
                    { code: 'A.6.3', description: 'Sensibilisation, apprentissage et formation à la sécurité — Former et sensibiliser régulièrement tous les membres du personnel aux politiques de sécurité.' },
                    { code: 'A.6.4', description: 'Processus disciplinaire — Mettre en place un processus disciplinaire formel en cas de violation de la sécurité de l\'information.' },
                    { code: 'A.6.5', description: 'Responsabilités après cessation ou changement de poste — Définir et communiquer les responsabilités de sécurité après cessation ou changement de poste.' },
                    { code: 'A.6.6', description: 'Accords de confidentialité ou de non-divulgation — Identifier, documenter et réviser les exigences de confidentialité ou de non-divulgation.' },
                    { code: 'A.6.7', description: 'Travail à distance — Mettre en œuvre des mesures de sécurité pour protéger les informations accessibles ou traitées lors du travail à distance.' },
                    { code: 'A.6.8', description: 'Signalement des événements de sécurité de l\'information — Permettre au personnel de signaler facilement les événements de sécurité observés.' },
                ],
            },
        ],
    },

    {
        code: 'A.7',
        nom: 'Contrôles physiques',
        description: 'Contrôles relatifs à la sécurité physique des locaux, des équipements et des supports de stockage.',
        objectifs: [
            {
                code: 'A.7.1',
                description: 'Objectif 9 : Prévenir l\'accès physique non autorisé, les dommages et les interférences avec les informations et les installations de traitement.',
                mesures: [
                    { code: 'A.7.1',  description: 'Périmètres de sécurité physique — Définir des périmètres de sécurité pour protéger les zones contenant des informations et des installations sensibles.' },
                    { code: 'A.7.2',  description: 'Contrôles d\'entrées physiques — Protéger les zones sécurisées par des contrôles d\'entrée appropriés pour s\'assurer que seul le personnel autorisé y accède.' },
                    { code: 'A.7.3',  description: 'Sécurisation des bureaux, salles et installations — Concevoir et appliquer des mesures de sécurité physique pour les bureaux, salles et installations.' },
                    { code: 'A.7.4',  description: 'Surveillance de la sécurité physique — Surveiller en permanence les locaux pour détecter tout accès physique non autorisé.' },
                    { code: 'A.7.5',  description: 'Protection contre les menaces physiques et environnementales — Concevoir et mettre en œuvre une protection contre les catastrophes naturelles et autres menaces.' },
                    { code: 'A.7.6',  description: 'Travail dans des zones sécurisées — Concevoir et appliquer des mesures de sécurité pour le travail en zones sécurisées.' },
                    { code: 'A.7.7',  description: 'Bureau propre et écran vide — Définir et appliquer des règles de bureau propre et d\'écran vide.' },
                    { code: 'A.7.8',  description: 'Emplacement et protection du matériel — Placer et protéger le matériel pour réduire les risques liés aux menaces environnementales.' },
                    { code: 'A.7.9',  description: 'Sécurité des actifs hors des locaux — Protéger les actifs situés hors des locaux en tenant compte des différents risques.' },
                    { code: 'A.7.10', description: 'Supports de stockage — Gérer les supports de stockage conformément au schéma de classification et aux exigences de manipulation.' },
                    { code: 'A.7.11', description: 'Équipements d\'infrastructure — Protéger les équipements d\'infrastructure contre les pannes de courant et autres perturbations.' },
                    { code: 'A.7.12', description: 'Sécurité du câblage — Protéger le câblage électrique et les câbles de télécommunication contre les interceptions, les interférences ou les dommages.' },
                    { code: 'A.7.13', description: 'Maintenance des équipements — Entretenir correctement les équipements pour assurer leur disponibilité et leur intégrité continues.' },
                    { code: 'A.7.14', description: 'Mise au rebut ou réutilisation sécurisée des équipements — Vérifier que tous les éléments contenant des données sont effacés ou détruits avant toute mise au rebut.' },
                ],
            },
        ],
    },

    {
        code: 'A.8',
        nom: 'Contrôles technologiques',
        description: 'Contrôles techniques portant sur les terminaux, les accès, la cryptographie, la journalisation, les réseaux et le développement sécurisé.',
        objectifs: [
            {
                code: 'A.8.1',
                description: 'Objectif 10 : Contrôler l\'accès aux informations via la gestion des terminaux, des privilèges et de l\'authentification.',
                mesures: [
                    { code: 'A.8.1', description: 'Terminaux utilisateurs — Protéger les informations stockées sur, traitées par ou accessibles via les terminaux utilisateurs.' },
                    { code: 'A.8.2', description: 'Droits d\'accès à privilèges — Restreindre et gérer les droits d\'accès à privilèges.' },
                    { code: 'A.8.3', description: 'Restriction d\'accès à l\'information — Restreindre l\'accès aux informations et aux actifs associés conformément à la politique de contrôle d\'accès.' },
                    { code: 'A.8.4', description: 'Accès au code source — Gérer de manière appropriée l\'accès en lecture et en écriture au code source.' },
                    { code: 'A.8.5', description: 'Authentification sécurisée — Mettre en œuvre des technologies et des procédures d\'authentification sécurisée.' },
                ],
            },
            {
                code: 'A.8.2',
                description: 'Objectif 11 : Gérer la capacité des systèmes et assurer la protection contre les logiciels malveillants et les vulnérabilités techniques.',
                mesures: [
                    { code: 'A.8.6', description: 'Gestion de la capacité — Surveiller et ajuster l\'utilisation des ressources en prévision des besoins futurs de capacité.' },
                    { code: 'A.8.7', description: 'Protection contre les logiciels malveillants — Mettre en œuvre une protection contre les logiciels malveillants, appuyée par une sensibilisation appropriée.' },
                    { code: 'A.8.8', description: 'Gestion des vulnérabilités techniques — Obtenir des informations sur les vulnérabilités techniques et prendre les mesures appropriées.' },
                    { code: 'A.8.9', description: 'Gestion de la configuration — Établir, documenter, mettre en œuvre, surveiller et réviser les configurations.' },
                ],
            },
            {
                code: 'A.8.3',
                description: 'Objectif 12 : Assurer la protection et la sauvegarde des données, notamment par la suppression, le masquage et la prévention des fuites.',
                mesures: [
                    { code: 'A.8.10', description: 'Suppression de l\'information — Supprimer les informations stockées dans les systèmes, appareils ou supports lorsqu\'elles ne sont plus nécessaires.' },
                    { code: 'A.8.11', description: 'Masquage des données — Utiliser le masquage des données conformément à la politique de contrôle d\'accès et aux exigences de l\'organisation.' },
                    { code: 'A.8.12', description: 'Prévention de la fuite de données — Appliquer des mesures de prévention des fuites de données sur les systèmes, réseaux et appareils traitant des données sensibles.' },
                    { code: 'A.8.13', description: 'Sauvegarde des informations — Maintenir et tester régulièrement des copies de sauvegarde des informations, logiciels et systèmes.' },
                ],
            },
            {
                code: 'A.8.4',
                description: 'Objectif 13 : Garantir la résilience des infrastructures par la redondance, la journalisation et la surveillance des activités.',
                mesures: [
                    { code: 'A.8.14', description: 'Redondance des installations de traitement — Mettre en œuvre une redondance suffisante pour répondre aux exigences de disponibilité.' },
                    { code: 'A.8.15', description: 'Journalisation — Produire, stocker, protéger et analyser des journaux enregistrant les activités, exceptions et événements de sécurité.' },
                    { code: 'A.8.16', description: 'Activités de surveillance — Surveiller les réseaux, systèmes et applications pour détecter tout comportement anormal.' },
                    { code: 'A.8.17', description: 'Synchronisation des horloges — Synchroniser les horloges des systèmes de traitement de l\'information sur des sources de temps approuvées.' },
                ],
            },
            {
                code: 'A.8.5',
                description: 'Objectif 14 : Sécuriser l\'exploitation des systèmes d\'information et les réseaux contre les accès et usages non autorisés.',
                mesures: [
                    { code: 'A.8.18', description: 'Utilisation de programmes utilitaires à privilèges — Restreindre et contrôler étroitement l\'utilisation des programmes utilitaires à privilèges.' },
                    { code: 'A.8.19', description: 'Installation de logiciels sur des systèmes en exploitation — Mettre en œuvre des procédures pour contrôler l\'installation de logiciels sur les systèmes.' },
                    { code: 'A.8.20', description: 'Sécurité des réseaux — Sécuriser les réseaux et les dispositifs réseau pour protéger les informations dans les systèmes.' },
                    { code: 'A.8.21', description: 'Sécurité des services réseau — Identifier et mettre en œuvre des mécanismes de sécurité pour tous les services réseau.' },
                    { code: 'A.8.22', description: 'Cloisonnement des réseaux — Cloisonner les groupes de services, utilisateurs et systèmes d\'information au sein du réseau.' },
                ],
            },
            {
                code: 'A.8.6',
                description: 'Objectif 15 : Sécuriser les applications et les développements par la cryptographie, les tests de sécurité et la gestion des changements.',
                mesures: [
                    { code: 'A.8.23', description: 'Filtrage web — Gérer l\'accès aux sites web externes pour réduire l\'exposition aux contenus malveillants.' },
                    { code: 'A.8.24', description: 'Utilisation de la cryptographie — Définir et mettre en œuvre des règles sur l\'utilisation de la cryptographie, y compris la gestion des clés.' },
                    { code: 'A.8.25', description: 'Cycle de vie du développement sécurisé — Établir des règles pour le développement sécurisé de logiciels et de systèmes.' },
                    { code: 'A.8.26', description: 'Exigences de sécurité des applications — Identifier, spécifier et approuver les exigences de sécurité lors du développement ou de l\'acquisition d\'applications.' },
                    { code: 'A.8.27', description: 'Architecture sécurisée des systèmes et principes d\'ingénierie — Établir, documenter et appliquer des principes d\'ingénierie de systèmes sécurisés.' },
                    { code: 'A.8.28', description: 'Codage sécurisé — Appliquer des principes de codage sécurisé au développement de logiciels.' },
                    { code: 'A.8.29', description: 'Tests de sécurité en développement et en acceptation — Définir et mettre en œuvre des processus de tests de sécurité tout au long du cycle de développement.' },
                    { code: 'A.8.30', description: 'Développement externalisé — Superviser et surveiller le développement externalisé de systèmes.' },
                    { code: 'A.8.31', description: 'Séparation des environnements de développement, test et production — Séparer et protéger les environnements de développement, de test et de production.' },
                    { code: 'A.8.32', description: 'Gestion des changements — Soumettre les modifications apportées aux installations de traitement et aux systèmes à des procédures de gestion des changements.' },
                    { code: 'A.8.33', description: 'Informations utilisées pour les tests — Sélectionner, protéger et gérer de manière appropriée les informations utilisées pour les tests.' },
                    { code: 'A.8.34', description: 'Protection des systèmes d\'information pendant les tests d\'audit — Planifier et valider les tests d\'audit pour minimiser les perturbations sur les systèmes en production.' },
                ],
            },
        ],
    },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

const seedISO27001 = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log('Connexion OK');

        // Vérifier si déjà seedé
        const existing = await Referentiel.findOne({ where: { type: 'ISO27001' } });
        if (existing) {
            console.log('Référentiel ISO 27001 déjà présent en base. Abandon.');
            process.exit(0);
        }

        // Créer le référentiel
        const referentiel = await Referentiel.create({
            nom: 'ISO/IEC 27001:2022 — Sécurité de l\'information',
            version: '2022',
            type: 'ISO27001',
            description: 'Norme internationale spécifiant les exigences relatives à l\'établissement, la mise en œuvre, la mise à jour et l\'amélioration continue d\'un système de management de la sécurité de l\'information (SMSI). L\'Annexe A contient 93 contrôles organisés en 4 thèmes.',
        });
        console.log(`Référentiel ISO 27001 créé (id: ${referentiel.id})`);

        let domaineCount = 0;
        let objectifCount = 0;
        let mesureCount = 0;

        for (const theme of ISO27001_DATA) {
            const domaine = await Domaine.create({
                referentiel_id: referentiel.id,
                code: theme.code,
                nom: theme.nom,
                description: theme.description,
                ponderation: 1.0,
            });
            domaineCount++;
            console.log(`\n  Domaine ${theme.code}: ${theme.nom}`);

            for (const obj of theme.objectifs) {
                const objectif = await Objectif.create({
                    domaine_id: domaine.id,
                    code: obj.code,
                    description: obj.description,
                });
                objectifCount++;

                for (const m of obj.mesures) {
                    await Mesure.create({
                        objectif_id: objectif.id,
                        code: m.code,
                        description: m.description,
                        niveau_cible: 3,
                    });
                    mesureCount++;
                }
                console.log(`    Objectif ${obj.code} → ${obj.mesures.length} mesures`);
            }
        }

        console.log('\n=== Seed ISO 27001:2022 terminé ===');
        console.log(`  ${domaineCount} domaines (thèmes)`);
        console.log(`  ${objectifCount} objectifs`);
        console.log(`  ${mesureCount} mesures (contrôles)`);

        process.exit(0);
    } catch (error) {
        console.error('Erreur seed ISO 27001:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

seedISO27001();
