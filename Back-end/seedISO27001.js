const { sequelize, Referentiel, Domaine, Objectif, Mesure } = require('./src/models');

// ─── §4-10 : Corps principal ISO 27001:2022 ───────────────────────────────────
const ISO27001_MAIN_BODY = [
    {
        code: '4',
        nom: 'Contexte de l\'organisme',
        description: 'Compréhension du contexte, des parties intéressées et du périmètre du SMSI.',
        objectifs: [
            {
                code: '4.1',
                description: '4.1 — Compréhension de l\'organisme et de son contexte',
                mesures: [
                    { code: '4.1.a', description: 'L\'organisme détermine les enjeux externes et internes pertinents à sa mission qui affectent sa capacité à obtenir les résultats attendus de son SMSI.' },
                ],
            },
            {
                code: '4.2',
                description: '4.2 — Compréhension des besoins et attentes des parties intéressées',
                mesures: [
                    { code: '4.2.a', description: 'Les parties intéressées pertinentes pour le SMSI sont identifiées.' },
                    { code: '4.2.b', description: 'Les exigences pertinentes de ces parties intéressées relatives à la sécurité de l\'information sont déterminées.' },
                    { code: '4.2.c', description: 'Les exigences qui seront traitées dans le cadre du SMSI sont déterminées.' },
                ],
            },
            {
                code: '4.3',
                description: '4.3 — Détermination du domaine d\'application du SMSI',
                mesures: [
                    { code: '4.3.a', description: 'Les limites et l\'applicabilité du SMSI sont déterminées, en tenant compte des enjeux (§4.1), des exigences (§4.2) et des interfaces avec d\'autres organisations.' },
                    { code: '4.3.b', description: 'Le domaine d\'application est disponible sous forme d\'information documentée.' },
                ],
            },
            {
                code: '4.4',
                description: '4.4 — Système de management de la sécurité de l\'information',
                mesures: [
                    { code: '4.4.a', description: 'L\'organisme établit, met en œuvre, maintient et améliore continuellement le SMSI, y compris les processus nécessaires et leurs interactions, conformément aux exigences de la norme.' },
                ],
            },
        ],
    },

    {
        code: '5',
        nom: 'Leadership',
        description: 'Engagement de la direction, politique de sécurité et attribution des rôles et responsabilités.',
        objectifs: [
            {
                code: '5.1',
                description: '5.1 — Leadership et engagement',
                mesures: [
                    { code: '5.1.a', description: 'La politique de sécurité et les objectifs sont établis et compatibles avec l\'orientation stratégique de l\'organisme.' },
                    { code: '5.1.b', description: 'Les exigences du SMSI sont intégrées dans les processus métiers de l\'organisme.' },
                    { code: '5.1.c', description: 'Les ressources nécessaires au SMSI sont disponibles.' },
                    { code: '5.1.d', description: 'L\'importance d\'un management efficace de la sécurité et de la conformité aux exigences du SMSI est communiquée.' },
                    { code: '5.1.e', description: 'Le SMSI produit les résultats attendus.' },
                    { code: '5.1.f', description: 'Les personnes sont orientées et soutenues pour contribuer à l\'efficacité du SMSI.' },
                    { code: '5.1.g', description: 'L\'amélioration continue est promue.' },
                    { code: '5.1.h', description: 'Les autres rôles managériaux pertinents sont soutenus dans leur leadership concernant la sécurité.' },
                ],
            },
            {
                code: '5.2',
                description: '5.2 — Politique de sécurité de l\'information',
                mesures: [
                    { code: '5.2.a', description: 'Une politique de sécurité est établie, adaptée à la finalité de l\'organisme.' },
                    { code: '5.2.b', description: 'La politique inclut des objectifs de sécurité ou un cadre pour les établir.' },
                    { code: '5.2.c', description: 'La politique intègre un engagement à satisfaire les exigences applicables à la sécurité.' },
                    { code: '5.2.d', description: 'La politique intègre un engagement d\'amélioration continue du SMSI.' },
                    { code: '5.2.e', description: 'La politique est disponible sous forme d\'information documentée, communiquée en interne et aux parties intéressées.' },
                ],
            },
            {
                code: '5.3',
                description: '5.3 — Rôles, responsabilités et autorités',
                mesures: [
                    { code: '5.3.a', description: 'Les responsabilités et autorités pour les rôles pertinents à la sécurité sont attribuées et communiquées.' },
                    { code: '5.3.b', description: 'Une responsabilité est attribuée pour s\'assurer de la conformité du SMSI aux exigences de la norme et pour rapporter ses performances à la direction.' },
                ],
            },
        ],
    },

    {
        code: '6',
        nom: 'Planification',
        description: 'Appréciation et traitement des risques, objectifs de sécurité et planification des changements.',
        objectifs: [
            {
                code: '6.1.1',
                description: '6.1.1 — Généralités (risques et opportunités)',
                mesures: [
                    { code: '6.1.1.a', description: 'Les risques et opportunités susceptibles d\'affecter le SMSI sont identifiés, en tenant compte des enjeux (§4.1) et des exigences (§4.2).' },
                    { code: '6.1.1.b', description: 'Des actions pour traiter ces risques et opportunités sont planifiées, intégrées dans les processus du SMSI et leur efficacité est évaluée.' },
                ],
            },
            {
                code: '6.1.2',
                description: '6.1.2 — Appréciation du risque en sécurité de l\'information',
                mesures: [
                    { code: '6.1.2.a', description: 'Un processus d\'appréciation du risque est défini : critères d\'acceptation du risque et critères pour réaliser les appréciations sont établis et maintenus.' },
                    { code: '6.1.2.b', description: 'Les appréciations du risque répétées produisent des résultats cohérents, valides et comparables.' },
                    { code: '6.1.2.c', description: 'Les risques de sécurité sont identifiés (confidentialité, intégrité, disponibilité) et les propriétaires de risques sont désignés.' },
                    { code: '6.1.2.d', description: 'Les risques sont analysés (vraisemblance × impact) et évalués par rapport aux critères établis, puis priorisés.' },
                    { code: '6.1.2.e', description: 'Les résultats de l\'appréciation du risque sont conservés sous forme d\'information documentée.' },
                ],
            },
            {
                code: '6.1.3',
                description: '6.1.3 — Traitement du risque en sécurité de l\'information',
                mesures: [
                    { code: '6.1.3.a', description: 'Des options de traitement du risque appropriées sont sélectionnées en tenant compte des résultats de l\'appréciation.' },
                    { code: '6.1.3.b', description: 'Tous les contrôles nécessaires à la mise en œuvre de l\'option choisie sont déterminés.' },
                    { code: '6.1.3.c', description: 'Les contrôles retenus sont comparés à ceux de l\'Annexe A pour vérifier qu\'aucun contrôle nécessaire n\'est omis.' },
                    { code: '6.1.3.d', description: 'Une Déclaration d\'Applicabilité (SoA) est produite : contrôles nécessaires, justification d\'inclusion, état d\'implémentation et justification d\'exclusion.' },
                    { code: '6.1.3.e', description: 'Un plan de traitement du risque est formulé et approuvé par les propriétaires de risques.' },
                    { code: '6.1.3.f', description: 'L\'acceptation des risques résiduels par les propriétaires de risques est documentée.' },
                ],
            },
            {
                code: '6.2',
                description: '6.2 — Objectifs de sécurité de l\'information',
                mesures: [
                    { code: '6.2.a', description: 'Des objectifs de sécurité sont établis aux fonctions et niveaux pertinents, cohérents avec la politique et prenant en compte les résultats de l\'appréciation du risque.' },
                    { code: '6.2.b', description: 'Les objectifs sont mesurables, surveillés, communiqués, mis à jour si nécessaire et disponibles sous forme d\'information documentée.' },
                    { code: '6.2.c', description: 'Un plan définit ce qui sera fait, les ressources nécessaires, les responsables, les délais et comment les résultats seront évalués.' },
                ],
            },
            {
                code: '6.3',
                description: '6.3 — Planification des changements',
                mesures: [
                    { code: '6.3.a', description: 'Lorsque des changements au SMSI sont nécessaires, ils sont réalisés de manière planifiée et maîtrisée.' },
                ],
            },
        ],
    },

    {
        code: '7',
        nom: 'Support',
        description: 'Ressources, compétences, sensibilisation, communication et informations documentées.',
        objectifs: [
            {
                code: '7.1',
                description: '7.1 — Ressources',
                mesures: [
                    { code: '7.1.a', description: 'Les ressources nécessaires à l\'établissement, la mise en œuvre, la maintenance et l\'amélioration continue du SMSI sont déterminées et mises à disposition.' },
                ],
            },
            {
                code: '7.2',
                description: '7.2 — Compétences',
                mesures: [
                    { code: '7.2.a', description: 'Les compétences nécessaires pour les personnes travaillant sous le contrôle de l\'organisme et affectant la sécurité sont déterminées.' },
                    { code: '7.2.b', description: 'Ces personnes sont compétentes sur la base d\'une formation, d\'un apprentissage ou d\'une expérience appropriés.' },
                    { code: '7.2.c', description: 'Le cas échéant, des actions sont engagées pour acquérir les compétences nécessaires et leur efficacité est évaluée.' },
                    { code: '7.2.d', description: 'Des preuves appropriées des compétences sont conservées sous forme d\'information documentée.' },
                ],
            },
            {
                code: '7.3',
                description: '7.3 — Sensibilisation',
                mesures: [
                    { code: '7.3.a', description: 'Les personnes travaillant sous le contrôle de l\'organisme sont sensibilisées à la politique de sécurité de l\'information.' },
                    { code: '7.3.b', description: 'Elles connaissent leur contribution à l\'efficacité du SMSI, incluant les bénéfices d\'une meilleure performance de sécurité.' },
                    { code: '7.3.c', description: 'Elles connaissent les conséquences d\'un non-respect des exigences du SMSI.' },
                ],
            },
            {
                code: '7.4',
                description: '7.4 — Communication',
                mesures: [
                    { code: '7.4.a', description: 'Les besoins de communication interne et externe relatifs au SMSI sont déterminés : quoi, quand, avec qui et comment communiquer.' },
                ],
            },
            {
                code: '7.5.1',
                description: '7.5.1 — Informations documentées — Généralités',
                mesures: [
                    { code: '7.5.1.a', description: 'Le SMSI inclut les informations documentées requises par la norme.' },
                    { code: '7.5.1.b', description: 'Le SMSI inclut les informations documentées jugées nécessaires par l\'organisme pour son efficacité.' },
                ],
            },
            {
                code: '7.5.2',
                description: '7.5.2 — Création et mise à jour des informations documentées',
                mesures: [
                    { code: '7.5.2.a', description: 'Lors de la création et de la mise à jour, les informations documentées font l\'objet d\'une identification et description appropriées (titre, date, auteur, référence).' },
                    { code: '7.5.2.b', description: 'Le format (langue, version logicielle, graphiques) et le support (papier, électronique) sont appropriés.' },
                    { code: '7.5.2.c', description: 'Une revue et une approbation de l\'adéquation et de la pertinence sont réalisées.' },
                ],
            },
            {
                code: '7.5.3',
                description: '7.5.3 — Maîtrise des informations documentées',
                mesures: [
                    { code: '7.5.3.a', description: 'Les informations documentées sont disponibles et utilisables là et quand elles sont nécessaires, et adéquatement protégées.' },
                    { code: '7.5.3.b', description: 'La distribution, l\'accès, la récupération, l\'utilisation, le stockage et la conservation (y compris la lisibilité) sont maîtrisés.' },
                    { code: '7.5.3.c', description: 'Les modifications (contrôle de version) et la durée de conservation et d\'élimination sont maîtrisées.' },
                    { code: '7.5.3.d', description: 'Les informations documentées d\'origine externe jugées nécessaires sont identifiées et leur distribution est maîtrisée.' },
                ],
            },
        ],
    },

    {
        code: '8',
        nom: 'Fonctionnement',
        description: 'Planification opérationnelle et maîtrise, appréciation et traitement opérationnel des risques.',
        objectifs: [
            {
                code: '8.1',
                description: '8.1 — Planification et maîtrise opérationnelles',
                mesures: [
                    { code: '8.1.a', description: 'Les processus nécessaires à la satisfaction des exigences sont planifiés, mis en œuvre et maîtrisés, avec des critères définis et des informations documentées conservées.' },
                    { code: '8.1.b', description: 'Les plans de traitement du risque (§6.1.3) sont mis en œuvre.' },
                    { code: '8.1.c', description: 'Les changements planifiés sont maîtrisés et les conséquences des changements non prévus sont examinées ; des actions correctives sont prises si nécessaire.' },
                    { code: '8.1.d', description: 'Les processus, produits ou services fournis en externe et pertinents pour le SMSI sont maîtrisés.' },
                ],
            },
            {
                code: '8.2',
                description: '8.2 — Appréciation du risque en sécurité de l\'information (opérationnelle)',
                mesures: [
                    { code: '8.2.a', description: 'L\'organisme réalise des appréciations du risque à intervalles planifiés ou lorsque des changements significatifs sont proposés ou surviennent.' },
                    { code: '8.2.b', description: 'Les résultats des appréciations du risque sont conservés sous forme d\'information documentée.' },
                ],
            },
            {
                code: '8.3',
                description: '8.3 — Traitement du risque en sécurité de l\'information (opérationnel)',
                mesures: [
                    { code: '8.3.a', description: 'Le plan de traitement du risque est mis en œuvre.' },
                    { code: '8.3.b', description: 'Les résultats du traitement du risque sont conservés sous forme d\'information documentée.' },
                ],
            },
        ],
    },

    {
        code: '9',
        nom: 'Évaluation des performances',
        description: 'Surveillance, mesure, audit interne et revue de direction du SMSI.',
        objectifs: [
            {
                code: '9.1',
                description: '9.1 — Surveillance, mesure, analyse et évaluation',
                mesures: [
                    { code: '9.1.a', description: 'Ce qui doit être surveillé et mesuré est déterminé, incluant les processus et contrôles de sécurité.' },
                    { code: '9.1.b', description: 'Les méthodes de surveillance, mesure, analyse et évaluation produisant des résultats valides, comparables et reproductibles sont définies.' },
                    { code: '9.1.c', description: 'La fréquence et les responsables de la surveillance, de la mesure, de l\'analyse et de l\'évaluation sont déterminés.' },
                    { code: '9.1.d', description: 'Les résultats de la surveillance et de la mesure sont disponibles sous forme d\'information documentée comme preuve.' },
                    { code: '9.1.e', description: 'La performance de sécurité et l\'efficacité du SMSI sont évaluées.' },
                ],
            },
            {
                code: '9.2.1',
                description: '9.2.1 — Audit interne — Généralités',
                mesures: [
                    { code: '9.2.1.a', description: 'Des audits internes sont conduits à intervalles planifiés pour déterminer si le SMSI est conforme aux propres exigences de l\'organisme et à celles de la norme.' },
                    { code: '9.2.1.b', description: 'Les audits internes vérifient que le SMSI est efficacement mis en œuvre et maintenu.' },
                ],
            },
            {
                code: '9.2.2',
                description: '9.2.2 — Audit interne — Programme d\'audit',
                mesures: [
                    { code: '9.2.2.a', description: 'Un programme d\'audit est planifié, établi, mis en œuvre et maintenu (fréquence, méthodes, responsabilités, exigences de planification, rapports).' },
                    { code: '9.2.2.b', description: 'Les critères et le périmètre de chaque audit sont définis ; les auditeurs sont objectifs et impartiaux.' },
                    { code: '9.2.2.c', description: 'Les résultats des audits sont rapportés à la direction concernée et les informations documentées sont conservées.' },
                ],
            },
            {
                code: '9.3.1',
                description: '9.3.1 — Revue de direction — Généralités',
                mesures: [
                    { code: '9.3.1.a', description: 'La direction revoit le SMSI à intervalles planifiés pour s\'assurer de sa pertinence, adéquation et efficacité continues.' },
                ],
            },
            {
                code: '9.3.2',
                description: '9.3.2 — Revue de direction — Éléments d\'entrée',
                mesures: [
                    { code: '9.3.2.a', description: 'L\'état des actions issues des revues précédentes est examiné.' },
                    { code: '9.3.2.b', description: 'Les changements d\'enjeux externes/internes et des besoins des parties intéressées pertinents pour le SMSI sont pris en compte.' },
                    { code: '9.3.2.c', description: 'Les retours sur la performance de sécurité sont examinés : NC/actions correctives, surveillance/mesure, audit, réalisation des objectifs, retours des parties intéressées, résultats d\'appréciation du risque et état du plan de traitement, opportunités d\'amélioration.' },
                ],
            },
            {
                code: '9.3.3',
                description: '9.3.3 — Revue de direction — Résultats',
                mesures: [
                    { code: '9.3.3.a', description: 'Les résultats de la revue incluent les décisions relatives aux opportunités d\'amélioration continue et aux besoins de changement du SMSI.' },
                    { code: '9.3.3.b', description: 'Les résultats de la revue de direction sont conservés sous forme d\'information documentée.' },
                ],
            },
        ],
    },

    {
        code: '10',
        nom: 'Amélioration',
        description: 'Amélioration continue et traitement des non-conformités et actions correctives.',
        objectifs: [
            {
                code: '10.1',
                description: '10.1 — Amélioration continue',
                mesures: [
                    { code: '10.1.a', description: 'L\'organisme améliore continuellement la pertinence, l\'adéquation et l\'efficacité du SMSI.' },
                ],
            },
            {
                code: '10.2',
                description: '10.2 — Non-conformité et action corrective',
                mesures: [
                    { code: '10.2.a', description: 'En cas de non-conformité, l\'organisme réagit, prend des mesures pour la maîtriser, la corriger et gérer les conséquences.' },
                    { code: '10.2.b', description: 'La nécessité d\'actions pour éliminer les causes de la NC est évaluée : revue de la NC, détermination des causes racines, vérification si des NC similaires existent ou pourraient survenir.' },
                    { code: '10.2.c', description: 'Les actions nécessaires sont mises en œuvre et leur efficacité est évaluée.' },
                    { code: '10.2.d', description: 'Le SMSI est modifié si nécessaire suite aux NC.' },
                    { code: '10.2.e', description: 'La nature des NC, les actions prises et les résultats des actions correctives sont conservés sous forme d\'information documentée.' },
                ],
            },
        ],
    },
];

// ─── Annexe A : Contrôles de référence (93 contrôles) ────────────────────────
const ISO27001_ANNEXE_A = [
    {
        code: 'A.5',
        nom: 'Contrôles organisationnels',
        description: 'Contrôles portant sur les politiques, la gouvernance, la gestion des actifs, des accès, des fournisseurs, des incidents et la conformité.',
        objectifs: [
            {
                code: 'A.5.1',
                description: 'Politiques, gouvernance et responsabilités organisationnelles',
                mesures: [
                    { code: 'A.5.1',  description: 'Politiques de sécurité de l\'information — Des politiques de sécurité et des politiques spécifiques à des thèmes doivent être définies, approuvées par la direction, publiées, communiquées, reconnues par le personnel et révisées à intervalles planifiés.' },
                    { code: 'A.5.2',  description: 'Rôles et responsabilités en matière de sécurité — Les rôles et responsabilités liés à la sécurité doivent être définis et attribués selon les besoins de l\'organisme.' },
                    { code: 'A.5.3',  description: 'Séparation des tâches — Les tâches et domaines de responsabilité conflictuels doivent être séparés.' },
                    { code: 'A.5.4',  description: 'Responsabilités de la direction — La direction doit exiger que tout le personnel applique la sécurité conformément aux politiques établies.' },
                ],
            },
            {
                code: 'A.5.2',
                description: 'Relations externes, veille menaces et sécurité dans les projets',
                mesures: [
                    { code: 'A.5.5',  description: 'Relations avec les autorités — Des contacts appropriés avec les autorités compétentes doivent être établis et maintenus.' },
                    { code: 'A.5.6',  description: 'Relations avec les groupes d\'intérêt spécifiques — Des contacts avec les groupes spécialisés en sécurité doivent être établis et maintenus.' },
                    { code: 'A.5.7',  description: 'Renseignement sur les menaces — Des informations sur les menaces de sécurité doivent être collectées et analysées pour produire des renseignements exploitables.' },
                    { code: 'A.5.8',  description: 'Sécurité de l\'information dans la gestion de projet — La sécurité doit être intégrée dans la gestion de tous types de projets.' },
                ],
            },
            {
                code: 'A.5.3',
                description: 'Gestion des actifs et classification de l\'information',
                mesures: [
                    { code: 'A.5.9',  description: 'Inventaire des informations et actifs associés — Un inventaire des informations et des actifs associés, incluant les propriétaires, doit être élaboré et maintenu.' },
                    { code: 'A.5.10', description: 'Utilisation acceptable des informations et actifs — Des règles d\'utilisation acceptable et des procédures de traitement doivent être identifiées, documentées et mises en œuvre.' },
                    { code: 'A.5.11', description: 'Restitution des actifs — Le personnel et les autres parties intéressées doivent restituer tous les actifs lors de la cessation ou du changement d\'emploi.' },
                    { code: 'A.5.12', description: 'Classification des informations — Les informations doivent être classifiées selon les besoins de sécurité de l\'organisme (confidentialité, intégrité, disponibilité).' },
                    { code: 'A.5.13', description: 'Étiquetage des informations — Un ensemble approprié de procédures d\'étiquetage doit être développé et mis en œuvre conformément au schéma de classification.' },
                ],
            },
            {
                code: 'A.5.4',
                description: 'Contrôle d\'accès, identités et transfert d\'informations',
                mesures: [
                    { code: 'A.5.14', description: 'Transfert d\'informations — Des règles, procédures ou accords de transfert doivent être en place pour tous types de transferts au sein de l\'organisme et avec des tiers.' },
                    { code: 'A.5.15', description: 'Contrôle d\'accès — Des règles de contrôle d\'accès physique et logique aux informations et actifs doivent être établies et mises en œuvre.' },
                    { code: 'A.5.16', description: 'Gestion des identités — L\'ensemble du cycle de vie des identités doit être géré.' },
                    { code: 'A.5.17', description: 'Informations d\'authentification — L\'attribution et la gestion des informations d\'authentification doivent être contrôlées par un processus formel.' },
                    { code: 'A.5.18', description: 'Droits d\'accès — Les droits d\'accès doivent être provisionnés, révisés, modifiés et supprimés conformément à la politique de contrôle d\'accès.' },
                ],
            },
            {
                code: 'A.5.5',
                description: 'Sécurité dans les relations fournisseurs et services Cloud',
                mesures: [
                    { code: 'A.5.19', description: 'Sécurité dans les relations fournisseurs — Des processus et procédures doivent être définis et mis en œuvre pour gérer les risques de sécurité liés aux fournisseurs.' },
                    { code: 'A.5.20', description: 'Sécurité dans les accords fournisseurs — Les exigences de sécurité pertinentes doivent être établies et convenues avec chaque fournisseur.' },
                    { code: 'A.5.21', description: 'Sécurité dans la chaîne d\'approvisionnement TIC — Des processus de gestion des risques liés aux produits et services TIC de la chaîne d\'approvisionnement doivent être définis et mis en œuvre.' },
                    { code: 'A.5.22', description: 'Suivi, révision et gestion des changements fournisseurs — Les pratiques et services des fournisseurs doivent être régulièrement surveillés, révisés, évalués et gérés.' },
                    { code: 'A.5.23', description: 'Sécurité pour l\'utilisation des services Cloud — Des processus d\'acquisition, d\'utilisation, de gestion et de fin de services Cloud doivent être établis.' },
                ],
            },
            {
                code: 'A.5.6',
                description: 'Gestion des incidents de sécurité',
                mesures: [
                    { code: 'A.5.24', description: 'Planification et préparation de la gestion des incidents — L\'organisme doit planifier et se préparer à la gestion des incidents en définissant les processus, rôles et responsabilités.' },
                    { code: 'A.5.25', description: 'Appréciation et décision sur les événements de sécurité — Les événements de sécurité doivent être évalués et classifiés en incidents le cas échéant.' },
                    { code: 'A.5.26', description: 'Réponse aux incidents de sécurité — Les incidents doivent être traités conformément aux procédures documentées.' },
                    { code: 'A.5.27', description: 'Retour d\'expérience sur les incidents — Les connaissances tirées des incidents doivent servir à renforcer les contrôles de sécurité.' },
                    { code: 'A.5.28', description: 'Collecte de preuves — Des procédures d\'identification, de collecte, d\'acquisition et de préservation des preuves doivent être établies et appliquées.' },
                ],
            },
            {
                code: 'A.5.7',
                description: 'Continuité d\'activité, conformité légale et procédures opérationnelles',
                mesures: [
                    { code: 'A.5.29', description: 'Sécurité lors des perturbations — La façon dont la sécurité sera maintenue lors d\'une perturbation doit être planifiée.' },
                    { code: 'A.5.30', description: 'Disponibilité des TIC pour la continuité — La disponibilité des TIC lors des perturbations doit être planifiée, mise en œuvre, maintenue et testée.' },
                    { code: 'A.5.31', description: 'Exigences légales, réglementaires et contractuelles — Les exigences légales, réglementaires et contractuelles applicables doivent être identifiées, documentées et maintenues à jour.' },
                    { code: 'A.5.32', description: 'Droits de propriété intellectuelle — Des procédures appropriées de protection des droits de propriété intellectuelle doivent être mises en œuvre.' },
                    { code: 'A.5.33', description: 'Protection des enregistrements — Les enregistrements doivent être protégés contre la perte, la destruction, la falsification, les accès et divulgations non autorisés.' },
                    { code: 'A.5.34', description: 'Protection de la vie privée et des DCP — Les exigences de préservation de la vie privée et de protection des données à caractère personnel doivent être identifiées et satisfaites.' },
                    { code: 'A.5.35', description: 'Revue indépendante de la sécurité — L\'approche de l\'organisme en matière de sécurité doit faire l\'objet de revues indépendantes à intervalles planifiés ou lors de changements significatifs.' },
                    { code: 'A.5.36', description: 'Conformité aux politiques et normes — La conformité du traitement de l\'information aux politiques, règles et normes de sécurité doit être régulièrement révisée.' },
                    { code: 'A.5.37', description: 'Procédures opérationnelles documentées — Les procédures d\'exploitation des installations de traitement doivent être documentées et disponibles pour le personnel concerné.' },
                ],
            },
        ],
    },

    {
        code: 'A.6',
        nom: 'Contrôles liés aux personnes',
        description: 'Contrôles portant sur le personnel : sélection, formation, sensibilisation, responsabilités et signalement.',
        objectifs: [
            {
                code: 'A.6.1',
                description: 'Gestion du personnel et sensibilisation à la sécurité',
                mesures: [
                    { code: 'A.6.1', description: 'Sélection — Des vérifications des antécédents de tous les candidats doivent être réalisées avant l\'embauche, proportionnelles aux besoins métiers et aux risques perçus.' },
                    { code: 'A.6.2', description: 'Termes et conditions d\'embauche — Les accords contractuels doivent préciser les responsabilités du personnel et de l\'organisme en matière de sécurité.' },
                    { code: 'A.6.3', description: 'Sensibilisation, formation et apprentissage — Le personnel doit recevoir une sensibilisation, une formation et des mises à jour régulières adaptées à leurs fonctions.' },
                    { code: 'A.6.4', description: 'Processus disciplinaire — Un processus disciplinaire formalisé doit exister pour les violations de la politique de sécurité.' },
                    { code: 'A.6.5', description: 'Responsabilités après cessation ou changement de poste — Les responsabilités de sécurité restant valides après cessation ou changement doivent être définies, appliquées et communiquées.' },
                    { code: 'A.6.6', description: 'Accords de confidentialité ou de non-divulgation — Ces accords doivent être identifiés, documentés, régulièrement révisés et signés.' },
                    { code: 'A.6.7', description: 'Travail à distance — Des mesures de sécurité doivent être mises en œuvre pour protéger les informations accessibles ou traitées hors des locaux.' },
                    { code: 'A.6.8', description: 'Signalement des événements de sécurité — Un mécanisme doit permettre au personnel de signaler rapidement les événements de sécurité observés ou suspectés.' },
                ],
            },
        ],
    },

    {
        code: 'A.7',
        nom: 'Contrôles physiques',
        description: 'Contrôles relatifs à la sécurité physique des locaux, des équipements et des supports.',
        objectifs: [
            {
                code: 'A.7.1',
                description: 'Sécurité physique des locaux et équipements',
                mesures: [
                    { code: 'A.7.1',  description: 'Périmètres de sécurité physique — Des périmètres de sécurité doivent être définis et utilisés pour protéger les zones contenant des informations et actifs sensibles.' },
                    { code: 'A.7.2',  description: 'Contrôles d\'entrées physiques — Les zones sécurisées doivent être protégées par des contrôles d\'entrée appropriés pour n\'autoriser que le personnel habilité.' },
                    { code: 'A.7.3',  description: 'Sécurisation des bureaux, salles et installations — Des mesures de sécurité physique doivent être conçues et mises en œuvre.' },
                    { code: 'A.7.4',  description: 'Surveillance de la sécurité physique — Les locaux doivent être surveillés en permanence pour détecter tout accès physique non autorisé.' },
                    { code: 'A.7.5',  description: 'Protection contre les menaces physiques et environnementales — Des protections contre les catastrophes naturelles et autres menaces physiques doivent être conçues et mises en œuvre.' },
                    { code: 'A.7.6',  description: 'Travail en zones sécurisées — Des mesures de sécurité pour le travail en zones sécurisées doivent être conçues et appliquées.' },
                    { code: 'A.7.7',  description: 'Bureau propre et écran vide — Des règles de bureau propre et d\'écran vide doivent être définies et appliquées.' },
                    { code: 'A.7.8',  description: 'Emplacement et protection du matériel — Le matériel doit être placé et protégé de façon à réduire les risques liés aux menaces environnementales.' },
                    { code: 'A.7.9',  description: 'Sécurité des actifs hors des locaux — Les actifs situés hors des locaux doivent être protégés en tenant compte des risques spécifiques.' },
                    { code: 'A.7.10', description: 'Supports de stockage — Les supports doivent être gérés tout au long de leur cycle de vie (acquisition, usage, transport, élimination) conformément au schéma de classification.' },
                    { code: 'A.7.11', description: 'Équipements d\'infrastructure — Les équipements d\'infrastructure doivent être protégés contre les pannes de courant et autres perturbations.' },
                    { code: 'A.7.12', description: 'Sécurité du câblage — Les câbles électriques et de télécommunication doivent être protégés contre les interceptions, interférences et dommages.' },
                    { code: 'A.7.13', description: 'Maintenance des équipements — Les équipements doivent être correctement entretenus pour assurer leur disponibilité, intégrité et confidentialité.' },
                    { code: 'A.7.14', description: 'Mise au rebut ou réutilisation sécurisée des équipements — Tout équipement contenant des supports de stockage doit être vérifié pour s\'assurer que les données sensibles ont été supprimées ou écrasées avant élimination ou réutilisation.' },
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
                description: 'Terminaux, accès à privilèges et authentification',
                mesures: [
                    { code: 'A.8.1', description: 'Terminaux utilisateurs — Les informations stockées, traitées ou accessibles via les terminaux utilisateurs doivent être protégées.' },
                    { code: 'A.8.2', description: 'Droits d\'accès à privilèges — L\'attribution et l\'utilisation des droits d\'accès à privilèges doivent être restreintes et gérées.' },
                    { code: 'A.8.3', description: 'Restriction d\'accès à l\'information — L\'accès aux informations et actifs doit être restreint conformément à la politique de contrôle d\'accès.' },
                    { code: 'A.8.4', description: 'Accès au code source — Les accès en lecture et écriture au code source, aux outils de développement et aux bibliothèques logicielles doivent être gérés.' },
                    { code: 'A.8.5', description: 'Authentification sécurisée — Des technologies et procédures d\'authentification sécurisée doivent être mises en œuvre conformément aux restrictions d\'accès.' },
                ],
            },
            {
                code: 'A.8.2',
                description: 'Capacité, protection contre les malwares et vulnérabilités',
                mesures: [
                    { code: 'A.8.6', description: 'Gestion de la capacité — L\'utilisation des ressources doit être surveillée et ajustée en ligne avec les besoins de capacité actuels et prévisionnels.' },
                    { code: 'A.8.7', description: 'Protection contre les logiciels malveillants — Une protection contre les malwares doit être mise en œuvre et soutenue par une sensibilisation appropriée.' },
                    { code: 'A.8.8', description: 'Gestion des vulnérabilités techniques — Des informations sur les vulnérabilités techniques doivent être obtenues, l\'exposition évaluée et des mesures appropriées prises.' },
                    { code: 'A.8.9', description: 'Gestion de la configuration — Les configurations de sécurité du matériel, logiciels, services et réseaux doivent être établies, documentées, mises en œuvre, surveillées et révisées.' },
                ],
            },
            {
                code: 'A.8.3',
                description: 'Protection et sauvegarde des données',
                mesures: [
                    { code: 'A.8.10', description: 'Suppression de l\'information — Les informations stockées dans les systèmes, appareils ou supports doivent être supprimées lorsqu\'elles ne sont plus nécessaires.' },
                    { code: 'A.8.11', description: 'Masquage des données — Le masquage des données doit être utilisé conformément à la politique de contrôle d\'accès et aux exigences de l\'organisme.' },
                    { code: 'A.8.12', description: 'Prévention de la fuite de données — Des mesures de prévention des fuites de données doivent être appliquées aux systèmes, réseaux et appareils traitant des données sensibles.' },
                    { code: 'A.8.13', description: 'Sauvegarde des informations — Des copies de sauvegarde des informations, logiciels et systèmes doivent être maintenues et régulièrement testées.' },
                ],
            },
            {
                code: 'A.8.4',
                description: 'Résilience, journalisation et surveillance',
                mesures: [
                    { code: 'A.8.14', description: 'Redondance des installations de traitement — Une redondance suffisante des installations de traitement doit être mise en œuvre pour répondre aux exigences de disponibilité.' },
                    { code: 'A.8.15', description: 'Journalisation — Des journaux enregistrant les activités, exceptions, erreurs et événements de sécurité doivent être produits, stockés, protégés et analysés.' },
                    { code: 'A.8.16', description: 'Activités de surveillance — Les réseaux, systèmes et applications doivent être surveillés pour détecter tout comportement anormal et évaluer les incidents potentiels.' },
                    { code: 'A.8.17', description: 'Synchronisation des horloges — Les horloges des systèmes de traitement doivent être synchronisées sur des sources de temps approuvées.' },
                ],
            },
            {
                code: 'A.8.5',
                description: 'Sécurité des réseaux et utilisation des systèmes',
                mesures: [
                    { code: 'A.8.18', description: 'Utilisation de programmes utilitaires à privilèges — L\'utilisation des programmes pouvant neutraliser les contrôles système doit être restreinte et étroitement contrôlée.' },
                    { code: 'A.8.19', description: 'Installation de logiciels en exploitation — Des procédures de gestion sécurisée des installations de logiciels sur les systèmes en exploitation doivent être mises en œuvre.' },
                    { code: 'A.8.20', description: 'Sécurité des réseaux — Les réseaux et équipements réseau doivent être sécurisés, gérés et contrôlés pour protéger les informations.' },
                    { code: 'A.8.21', description: 'Sécurité des services réseau — Les mécanismes de sécurité, niveaux de service et exigences de tous les services réseau doivent être identifiés, mis en œuvre et surveillés.' },
                    { code: 'A.8.22', description: 'Cloisonnement des réseaux — Les groupes de services, utilisateurs et systèmes doivent être cloisonnés au sein du réseau.' },
                ],
            },
            {
                code: 'A.8.6',
                description: 'Développement sécurisé, cryptographie et gestion des changements',
                mesures: [
                    { code: 'A.8.23', description: 'Filtrage web — L\'accès aux sites web externes doit être géré pour réduire l\'exposition aux contenus malveillants.' },
                    { code: 'A.8.24', description: 'Utilisation de la cryptographie — Des règles sur l\'utilisation efficace de la cryptographie, incluant la gestion des clés, doivent être définies et mises en œuvre.' },
                    { code: 'A.8.25', description: 'Cycle de vie du développement sécurisé — Des règles pour le développement sécurisé de logiciels et systèmes doivent être établies et appliquées.' },
                    { code: 'A.8.26', description: 'Exigences de sécurité des applications — Les exigences de sécurité doivent être identifiées, spécifiées et approuvées lors du développement ou de l\'acquisition d\'applications.' },
                    { code: 'A.8.27', description: 'Architecture et principes d\'ingénierie sécurisés — Des principes d\'ingénierie de systèmes sécurisés doivent être établis, documentés, maintenus et appliqués.' },
                    { code: 'A.8.28', description: 'Codage sécurisé — Des principes de codage sécurisé doivent être appliqués au développement logiciel.' },
                    { code: 'A.8.29', description: 'Tests de sécurité en développement et acceptation — Des processus de tests de sécurité doivent être définis et mis en œuvre tout au long du cycle de développement.' },
                    { code: 'A.8.30', description: 'Développement externalisé — Les activités de développement externalisé doivent être dirigées, surveillées et révisées par l\'organisme.' },
                    { code: 'A.8.31', description: 'Séparation des environnements développement/test/production — Ces environnements doivent être séparés et sécurisés.' },
                    { code: 'A.8.32', description: 'Gestion des changements — Les modifications aux installations de traitement et systèmes doivent être soumises à des procédures de gestion des changements.' },
                    { code: 'A.8.33', description: 'Informations utilisées pour les tests — Les informations de test doivent être sélectionnées, protégées et gérées de manière appropriée.' },
                    { code: 'A.8.34', description: 'Protection des SI lors des tests d\'audit — Les tests d\'audit et activités d\'assurance sur les systèmes en exploitation doivent être planifiés et convenus avec la direction.' },
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

        // Trouver ou créer le référentiel
        let referentiel = await Referentiel.findOne({ where: { type: 'ISO27001' } });
        if (referentiel) {
            console.log(`Référentiel ISO 27001 existant (id: ${referentiel.id}) — ajout des sections manquantes...`);
            // Mettre à jour la description pour inclure §4-10
            await referentiel.update({
                description: 'Norme internationale spécifiant les exigences relatives à l\'établissement, la mise en œuvre, la maintenance et l\'amélioration continue d\'un SMSI. Inclut le corps principal (§4-10) et l\'Annexe A (93 contrôles organisés en 4 thèmes).',
            });
        } else {
            referentiel = await Referentiel.create({
                nom: 'ISO/IEC 27001:2022 — Sécurité de l\'information',
                version: '2022',
                type: 'ISO27001',
                description: 'Norme internationale spécifiant les exigences relatives à l\'établissement, la mise en œuvre, la maintenance et l\'amélioration continue d\'un SMSI. Inclut le corps principal (§4-10) et l\'Annexe A (93 contrôles organisés en 4 thèmes).',
            });
            console.log(`\nRéférentiel ISO 27001:2022 créé (id: ${referentiel.id})`);
        }

        // Récupérer les codes de domaines déjà présents
        const existingDomaines = await Domaine.findAll({ where: { referentiel_id: referentiel.id } });
        const existingCodes = new Set(existingDomaines.map(d => d.code));

        let domaineCount = 0, objectifCount = 0, mesureCount = 0, mesureUpdated = 0;

        const allData = [...ISO27001_MAIN_BODY, ...ISO27001_ANNEXE_A];

        for (const section of allData) {
            const isAnnexeA = section.code.startsWith('A.');

            if (existingCodes.has(section.code)) {
                if (!isAnnexeA) {
                    console.log(`  [${section.code}] déjà présent — ignoré`);
                    continue;
                }

                // Annexe A existante : mettre à jour descriptions des mesures
                console.log(`\n  [${section.code}] ${section.nom} — mise à jour descriptions...`);
                const domaine = existingDomaines.find(d => d.code === section.code);
                if (!domaine) continue;

                for (const obj of section.objectifs) {
                    const [objectif] = await Objectif.findOrCreate({
                        where: { domaine_id: domaine.id, code: obj.code },
                        defaults: { description: obj.description },
                    });
                    if (objectif.description !== obj.description) {
                        await objectif.update({ description: obj.description });
                    }

                    for (const m of obj.mesures) {
                        const [mesure, created] = await Mesure.findOrCreate({
                            where: { objectif_id: objectif.id, code: m.code },
                            defaults: { description: m.description, niveau_cible: 3 },
                        });
                        if (!created && mesure.description !== m.description) {
                            await mesure.update({ description: m.description });
                            mesureUpdated++;
                        }
                    }
                    console.log(`    ${obj.code} → ${obj.mesures.length} mesure(s) synchronisée(s)`);
                }
                continue;
            }

            const domaine = await Domaine.create({
                referentiel_id: referentiel.id,
                code: section.code,
                nom: section.nom,
                description: section.description,
                ponderation: 1.0,
            });
            domaineCount++;
            console.log(`\n  [${section.code}] ${section.nom} — CRÉÉ`);

            for (const obj of section.objectifs) {
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
                console.log(`    ${obj.code} → ${obj.mesures.length} mesure(s)`);
            }
        }

        console.log('\n=== Seed ISO 27001:2022 terminé ===');
        if (domaineCount === 0 && mesureUpdated === 0) {
            console.log('  Aucun changement (tout était déjà à jour).');
        } else {
            if (domaineCount > 0) console.log(`  ${domaineCount} domaine(s) ajouté(s) · ${objectifCount} objectif(s) · ${mesureCount} mesure(s)`);
            if (mesureUpdated > 0) console.log(`  ${mesureUpdated} description(s) de mesure Annexe A mises à jour.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Erreur seed ISO 27001:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

seedISO27001();
