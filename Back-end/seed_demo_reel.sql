-- ============================================================
-- seed_demo_reel.sql
-- Données de démonstration réalistes (fictives) pour audits 35 et 36
-- Ministère de la Santé Publique (DNSSI) | Banque Nationale de Développement (ISO 27001)
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1 — UPDATE audits : identification JSONB + dates
-- ============================================================

-- Audit 35 : Ministère de la Santé Publique — DNSSI
UPDATE audits SET
    perimetre       = 'Systèmes d''information du réseau hospitalier national : DSI centrale, 3 hôpitaux régionaux, applications métier (DPI, RH, facturation)',
    date_debut      = '2026-04-06',
    date_fin        = '2026-05-16',
    phase           = 'termine',
    statut          = 'termine',
    identification  = '{
        "denomination":       "Ministère de la Santé Publique",
        "departement":        "Direction des Systèmes d''Information (DSI)",
        "adresse":            "Avenue Mohammed V, Hay Riad",
        "ville":              "Rabat",
        "site_web":           "www.sante.gov.ma",
        "rssi_nom_prenom":    "M. Ahmed Benali",
        "rssi_rattachement":  "Direction Générale — Pôle Numérique",
        "rssi_email":         "a.benali@sante.gov.ma",
        "rssi_telephone":     "+212 5 37 68 14 20",
        "type_audit":                  "conformite",
        "perimetre_physique":          "DSI centrale, 3 hôpitaux régionaux",
        "perimetre_logique":           "Applications métier (DPI, RH, facturation), réseau hospitalier national",
        "perimetre_organisationnel":   "Direction des Systèmes d''Information (DSI) et équipes IT des sites",
        "auteur_evaluation":  "Cabinet DATAPROTECT",
        "date_evaluation":    "2026-04-06",
        "valide_par":         "M. Khalid Mansouri, DSI",
        "date_validation":    "2026-05-20"
    }'::jsonb,
    updated_at = NOW()
WHERE id = 35;

-- Audit 36 : Banque Nationale de Développement — ISO 27001
UPDATE audits SET
    perimetre       = 'SMSI global : infrastructure réseau, datacenter principal, applications bancaires critiques (core banking, e-banking, Swift)',
    date_debut      = '2026-05-04',
    date_fin        = '2026-06-27',
    phase           = 'termine',
    statut          = 'termine',
    identification  = '{
        "denomination":       "Banque Nationale de Développement",
        "departement":        "Direction Informatique et Sécurité (DIS)",
        "adresse":            "Boulevard Hassan II, Quartier des Affaires",
        "ville":              "Casablanca",
        "site_web":           "www.bnd.ma",
        "rssi_nom_prenom":    "Mme. Fatima Zahra El Idrissi",
        "rssi_rattachement":  "Direction Générale des Opérations",
        "rssi_email":         "fz.elidrissi@bnd.ma",
        "rssi_telephone":     "+212 5 22 48 30 10",
        "type_audit":                  "conformite",
        "perimetre_physique":          "Datacenter principal, infrastructure réseau",
        "perimetre_logique":           "Applications bancaires critiques (core banking, e-banking, Swift)",
        "perimetre_organisationnel":   "Direction Informatique et Sécurité (DIS), SMSI global",
        "auteur_evaluation":  "Cabinet DATAPROTECT",
        "date_evaluation":    "2026-05-04",
        "valide_par":         "M. Omar Tazi, DG",
        "date_validation":    "2026-07-05"
    }'::jsonb,
    updated_at = NOW()
WHERE id = 36;


-- ============================================================
-- SECTION 2 — UPDATE evaluations : notes et preuves (audit 35 — DNSSI)
-- ============================================================

UPDATE evaluations SET
    note   = CASE
        WHEN conformite = 'nc_majeure' AND MOD(id, 3) = 0 THEN
            'Absence totale de dispositif. Aucun document ni procédure identifié lors de la visite sur site.'
        WHEN conformite = 'nc_majeure' AND MOD(id, 3) = 1 THEN
            'Lacune critique constatée. L''exigence DNSSI n''est ni formalisée ni appliquée au sein de la DSI.'
        WHEN conformite = 'nc_majeure' AND MOD(id, 3) = 2 THEN
            'Non-conformité majeure relevée. Aucun responsable désigné et aucune mesure corrective en cours pour cette exigence.'

        WHEN conformite = 'nc_mineure' AND MOD(id, 3) = 0 THEN
            'Dispositif partiellement mis en œuvre. Des lacunes persistent dans l''application des exigences DNSSI.'
        WHEN conformite = 'nc_mineure' AND MOD(id, 3) = 1 THEN
            'La procédure existe mais n''a pas été révisée depuis plus de deux ans. La mise à jour est nécessaire pour assurer la conformité.'
        WHEN conformite = 'nc_mineure' AND MOD(id, 3) = 2 THEN
            'Non-conformité mineure identifiée. Le document de référence est disponible mais son application n''est pas systématiquement vérifiée.'

        WHEN conformite = 'partiel' AND MOD(id, 3) = 0 THEN
            'Exigence partiellement satisfaite. La mise en œuvre reste incomplète sur certains périmètres du réseau hospitalier.'
        WHEN conformite = 'partiel' AND MOD(id, 3) = 1 THEN
            'Conformité partielle observée. Les procédures sont définies mais leur application n''est pas homogène entre les sites.'
        WHEN conformite = 'partiel' AND MOD(id, 3) = 2 THEN
            'Mise en œuvre partielle de l''exigence. Des efforts ont été engagés mais le déploiement n''est pas complet sur l''ensemble du périmètre audité.'

        WHEN conformite = 'conforme' AND MOD(id, 3) = 0 THEN
            'Exigence pleinement satisfaite. Les éléments de preuve collectés confirment la conformité au référentiel DNSSI.'
        WHEN conformite = 'conforme' AND MOD(id, 3) = 1 THEN
            'Conformité établie et documentée. Les procédures sont à jour, appliquées et font l''objet d''un suivi régulier.'
        WHEN conformite = 'conforme' AND MOD(id, 3) = 2 THEN
            'L''exigence est intégralement couverte. Un audit interne récent confirme l''efficacité opérationnelle des mesures en place.'

        ELSE NULL
    END,
    preuve = CASE
        WHEN conformite = 'nc_majeure' AND MOD(id, 3) = 0 THEN
            'Entretien DSI du 12/10/2025 — Aucun document présenté'
        WHEN conformite = 'nc_majeure' AND MOD(id, 3) = 1 THEN
            'Revue documentaire du 15/10/2025 — Dossier vide, absence de politique formalisée'
        WHEN conformite = 'nc_majeure' AND MOD(id, 3) = 2 THEN
            'Visite terrain 22/10/2025 — Absence de dispositif technique et organisationnel'

        WHEN conformite = 'nc_mineure' AND MOD(id, 3) = 0 THEN
            'Procédure v1.0 datée de 2022, non révisée — Revue documentaire du 14/10/2025'
        WHEN conformite = 'nc_mineure' AND MOD(id, 3) = 1 THEN
            'Document de référence périmé (dernière MAJ : 2021) — Entretien chef de projet IT du 18/10/2025'
        WHEN conformite = 'nc_mineure' AND MOD(id, 3) = 2 THEN
            'Processus défini mais non testé — PV de réunion SSI 2024 consulté lors de la revue du 20/10/2025'

        WHEN conformite = 'partiel' AND MOD(id, 3) = 0 THEN
            'Politique SSI v2.1 approuvée — Écarts constatés lors de l''audit terrain du 20/10/2025'
        WHEN conformite = 'partiel' AND MOD(id, 3) = 1 THEN
            'Déploiement partiel confirmé — Entretien RSSI + rapport d''avancement Q3-2025'
        WHEN conformite = 'partiel' AND MOD(id, 3) = 2 THEN
            'Mesure opérationnelle sur site central uniquement — PV CODIR sept. 2025 + constats terrain 21/10/2025'

        WHEN conformite = 'conforme' AND MOD(id, 3) = 0 THEN
            'Politique approuvée + PV CODIR 2024 + Rapport audit interne Q3-2025'
        WHEN conformite = 'conforme' AND MOD(id, 3) = 1 THEN
            'Procédure MSP-SEC validée RSSI + Registre des contrôles 2025 + Tests de conformité oct. 2025'
        WHEN conformite = 'conforme' AND MOD(id, 3) = 2 THEN
            'Documentation complète fournie + Résultats tests d''intrusion 2024 + Revue annuelle RSSI confirmée'

        ELSE NULL
    END,
    updated_at = NOW()
WHERE audit_id = 35;


-- ============================================================
-- SECTION 3 — UPDATE evaluations : notes et preuves (audit 36 — ISO 27001)
-- ============================================================

UPDATE evaluations SET
    note   = CASE
        WHEN conformite = 'nc_majeure' AND MOD(id, 3) = 0 THEN
            'Non-conformité majeure identifiée. Le contrôle ISO 27001 est absent ou non opérationnel dans le périmètre audité.'
        WHEN conformite = 'nc_majeure' AND MOD(id, 3) = 1 THEN
            'Absence de contrôle critique constatée. Aucune politique, procédure ou mesure technique ne couvre cette exigence de l''Annexe A.'
        WHEN conformite = 'nc_majeure' AND MOD(id, 3) = 2 THEN
            'Défaillance majeure relevée lors de la revue SMSI. Le contrôle n''est ni documenté ni déployé dans le SI bancaire.'

        WHEN conformite = 'nc_mineure' AND MOD(id, 3) = 0 THEN
            'Non-conformité mineure. Le contrôle existe mais son déploiement est incomplet ou non formalisé à l''échelle du SMSI.'
        WHEN conformite = 'nc_mineure' AND MOD(id, 3) = 1 THEN
            'Le contrôle est documenté mais les preuves d''application effective sont insuffisantes. Une mise à jour du SMSI est requise.'
        WHEN conformite = 'nc_mineure' AND MOD(id, 3) = 2 THEN
            'Écart mineur détecté. La procédure n''a pas été révisée dans les délais prescrits par la politique SMSI de la banque.'

        WHEN conformite = 'partiel' AND MOD(id, 3) = 0 THEN
            'Conformité partielle. Le contrôle est déployé mais des axes d''amélioration ont été identifiés sur certains domaines du périmètre.'
        WHEN conformite = 'partiel' AND MOD(id, 3) = 1 THEN
            'Mise en œuvre partielle constatée. Le contrôle couvre le datacenter principal mais reste absent sur les sites secondaires.'
        WHEN conformite = 'partiel' AND MOD(id, 3) = 2 THEN
            'Le contrôle est opérationnel sur le périmètre core banking mais son extension aux activités e-banking est en cours.'

        WHEN conformite = 'conforme' AND MOD(id, 3) = 0 THEN
            'Contrôle pleinement opérationnel et documenté. La conformité à l''Annexe A ISO 27001:2022 est établie et vérifiée.'
        WHEN conformite = 'conforme' AND MOD(id, 3) = 1 THEN
            'Exigence intégralement satisfaite. Les preuves collectées démontrent l''efficacité et la maturité du contrôle dans le SMSI.'
        WHEN conformite = 'conforme' AND MOD(id, 3) = 2 THEN
            'Conformité confirmée lors de la revue de direction. Le contrôle fait l''objet d''une surveillance continue et d''une révision annuelle.'

        ELSE NULL
    END,
    preuve = CASE
        WHEN conformite = 'nc_majeure' AND MOD(id, 3) = 0 THEN
            'Entretien RSSI du 05/11/2025 — Absence de document de référence'
        WHEN conformite = 'nc_majeure' AND MOD(id, 3) = 1 THEN
            'Revue SMSI du 08/11/2025 — Contrôle non référencé dans le registre des risques BND'
        WHEN conformite = 'nc_majeure' AND MOD(id, 3) = 2 THEN
            'Audit terrain 12/11/2025 — Aucune mesure technique ni organisationnelle identifiée'

        WHEN conformite = 'nc_mineure' AND MOD(id, 3) = 0 THEN
            'Document de politique partiel v0.9 — Non approuvé formellement — Revue du 10/11/2025'
        WHEN conformite = 'nc_mineure' AND MOD(id, 3) = 1 THEN
            'Procédure BND-SEC non mise à jour depuis 18 mois — Entretien DIS du 14/11/2025'
        WHEN conformite = 'nc_mineure' AND MOD(id, 3) = 2 THEN
            'Registre des contrôles incomplet — Preuves d''application insuffisantes — Revue documentaire 18/11/2025'

        WHEN conformite = 'partiel' AND MOD(id, 3) = 0 THEN
            'Procédure SMSI réf. BND-SEC-012 — Applicable sur 60% du périmètre — Audit terrain nov. 2025'
        WHEN conformite = 'partiel' AND MOD(id, 3) = 1 THEN
            'Déploiement partiel confirmé — Rapport avancement SMSI Q3-2025 + Entretien architecte SI'
        WHEN conformite = 'partiel' AND MOD(id, 3) = 2 THEN
            'Contrôle actif sur datacenter principal — Extension planifiée T1 2026 — PV CODIR oct. 2025'

        WHEN conformite = 'conforme' AND MOD(id, 3) = 0 THEN
            'Politique BND-SEC approuvée CODIR + Tests d''efficacité Q4-2025 + Revue annuelle SMSI'
        WHEN conformite = 'conforme' AND MOD(id, 3) = 1 THEN
            'Documentation SMSI complète + Rapport pentest 2024 + Certification ISO préaudit validée'
        WHEN conformite = 'conforme' AND MOD(id, 3) = 2 THEN
            'Registre des contrôles à jour + PV revue direction 2025 + Indicateurs KPI sécurité conformes'

        ELSE NULL
    END,
    updated_at = NOW()
WHERE audit_id = 36;


-- ============================================================
-- SECTION 4 — UPDATE plans_actions (audit 35 — 8 plans DNSSI / Santé)
-- ============================================================

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM plans_actions
    WHERE audit_id = 35
)
UPDATE plans_actions pa SET
    description_nc = CASE r.rn
        WHEN 1 THEN 'Absence d''une politique de sécurité des systèmes d''information formalisée et approuvée par la direction. Les règles de sécurité ne sont pas documentées et les responsabilités ne sont pas clairement définies.'
        WHEN 2 THEN 'Absence de procédure de gestion des incidents de sécurité. Aucun processus structuré de détection, signalement et traitement des incidents n''est en place au sein de la DSI.'
        WHEN 3 THEN 'Les pratiques de développement sécurisé ne sont pas appliquées. Les applications métier sont développées sans revue de code sécurisée ni tests de sécurité systématiques.'
        WHEN 4 THEN 'Le contrôle d''accès logique aux systèmes sensibles est insuffisant. Des comptes génériques et des droits excessifs ont été identifiés lors de la revue des accès.'
        WHEN 5 THEN 'Absence de programme de formation et de sensibilisation à la sécurité informatique pour les utilisateurs du ministère. Les risques liés aux comportements humains restent élevés.'
        WHEN 6 THEN 'Les mécanismes de journalisation et de supervision des événements de sécurité sont partiels. Les journaux des systèmes critiques ne sont pas centralisés ni analysés.'
        WHEN 7 THEN 'Le plan de continuité d''activité (PCA) n''est pas formalisé. En cas d''incident majeur, la reprise des services critiques du ministère ne serait pas assurée dans des délais acceptables.'
        WHEN 8 THEN 'La charte informatique n''était pas signée par l''ensemble des utilisateurs. Les obligations d''utilisation acceptable du SI n''étaient pas portées à la connaissance de tous les agents.'
        ELSE description_nc
    END,
    action_corrective = CASE r.rn
        WHEN 1 THEN 'Rédiger, faire valider par le CODIR et diffuser une politique de sécurité des SI couvrant l''ensemble du périmètre du ministère. Désigner un comité de pilotage SSI et planifier une révision annuelle.'
        WHEN 2 THEN 'Définir et documenter une procédure de gestion des incidents de sécurité. Mettre en place une cellule SOC interne ou externalisée, et former les équipes à la détection et à l''escalade des incidents.'
        WHEN 3 THEN 'Intégrer les exigences de sécurité dans le cycle de développement (SDLC). Former les développeurs aux pratiques DevSecOps et instaurer des revues de code et des tests d''intrusion avant mise en production.'
        WHEN 4 THEN 'Réaliser une revue complète des droits d''accès et supprimer les comptes génériques et les accès non justifiés. Mettre en œuvre le principe du moindre privilège et activer l''authentification multi-facteurs sur les systèmes critiques.'
        WHEN 5 THEN 'Élaborer et déployer un programme annuel de sensibilisation à la sécurité informatique. Organiser des sessions de formation obligatoires pour tous les agents et intégrer des modules e-learning sur les risques courants.'
        WHEN 6 THEN 'Déployer une solution de centralisation et d''analyse des journaux (SIEM). Définir les événements à surveiller, configurer des alertes sur les comportements anormaux et assigner des responsabilités de supervision.'
        WHEN 7 THEN 'Élaborer un Plan de Continuité d''Activité (PCA) et un Plan de Reprise Informatique (PRI) couvrant les services critiques. Tester le PCA annuellement et désigner des responsables de continuité par domaine.'
        WHEN 8 THEN 'Mettre à jour la charte informatique, la faire signer par l''ensemble des agents et des prestataires, et l''intégrer au processus d''accueil des nouveaux arrivants.'
        ELSE action_corrective
    END,
    responsable = CASE r.rn
        WHEN 1 THEN 'DSI + RSSI'
        WHEN 2 THEN 'Cellule SOC — DSI'
        WHEN 3 THEN 'Chef de projet IT'
        WHEN 4 THEN 'Administrateur SI'
        WHEN 5 THEN 'RH + RSSI'
        WHEN 6 THEN 'Équipe réseau — DSI'
        WHEN 7 THEN 'DSI'
        WHEN 8 THEN 'RSSI'
        ELSE responsable
    END,
    delai = CASE r.rn
        WHEN 1 THEN '2026-03-31'
        WHEN 2 THEN '2026-02-28'
        WHEN 3 THEN '2026-04-30'
        WHEN 4 THEN '2026-03-15'
        WHEN 5 THEN '2026-05-31'
        WHEN 6 THEN '2026-06-30'
        WHEN 7 THEN '2026-09-30'
        WHEN 8 THEN '2025-12-31'
        ELSE delai
    END,
    priorite = CASE r.rn
        WHEN 1 THEN 'haute'
        WHEN 2 THEN 'haute'
        WHEN 3 THEN 'haute'
        WHEN 4 THEN 'moyenne'
        WHEN 5 THEN 'moyenne'
        WHEN 6 THEN 'moyenne'
        WHEN 7 THEN 'basse'
        WHEN 8 THEN 'basse'
        ELSE priorite
    END,
    statut = CASE r.rn
        WHEN 1 THEN 'en_cours'
        WHEN 2 THEN 'a_faire'
        WHEN 3 THEN 'a_faire'
        WHEN 4 THEN 'en_cours'
        WHEN 5 THEN 'a_faire'
        WHEN 6 THEN 'a_faire'
        WHEN 7 THEN 'a_faire'
        WHEN 8 THEN 'cloture'
        ELSE statut
    END,
    kpi = CASE r.rn
        WHEN 1 THEN 'Politique SSI approuvée et diffusée à 100% des agents — Date de publication'
        WHEN 2 THEN 'Délai moyen de traitement des incidents < 4h — Taux de résolution au 1er niveau > 80%'
        WHEN 3 THEN '100% des projets IT avec revue sécurité — 0 vulnérabilité critique en production'
        WHEN 4 THEN '0 compte générique actif — 100% des accès privilégiés avec MFA activé'
        WHEN 5 THEN 'Taux de participation formations > 90% — Score quiz sensibilisation > 75%'
        WHEN 6 THEN '100% des systèmes critiques journalisés — Délai d''analyse < 24h'
        WHEN 7 THEN 'PCA testé annuellement — RTO < 4h pour services critiques'
        WHEN 8 THEN '100% des agents ayant signé la charte — Intégré au processus onboarding'
        ELSE kpi
    END,
    updated_at = NOW()
FROM ranked r
WHERE pa.id = r.id;


-- ============================================================
-- SECTION 5 — UPDATE plans_actions (audit 36 — 7 plans ISO 27001 / Banque)
-- ============================================================

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM plans_actions
    WHERE audit_id = 36
)
UPDATE plans_actions pa SET
    description_nc = CASE r.rn
        WHEN 1 THEN 'Le chiffrement des données sensibles n''est pas systématiquement appliqué. Des données clients et des données financières circulent ou sont stockées en clair sur certains segments du SI bancaire.'
        WHEN 2 THEN 'Absence d''un processus structuré de gestion des vulnérabilités. Les correctifs de sécurité ne sont pas appliqués dans les délais prescrits et aucun suivi centralisé des CVE n''est en place.'
        WHEN 3 THEN 'Le Plan de Continuité du SMSI n''est pas formalisé ni testé. En cas d''incident majeur affectant la sécurité de l''information, la reprise des activités bancaires critiques ne serait pas garantie.'
        WHEN 4 THEN 'La gestion de la sécurité des tiers et fournisseurs est insuffisante. Les contrats ne comportent pas systématiquement de clauses de sécurité et les audits fournisseurs ne sont pas réalisés.'
        WHEN 5 THEN 'L''audit interne SMSI annuel n''a pas été réalisé dans les délais prévus par la politique de la banque. Le programme d''audit interne n''est pas respecté, limitant la surveillance du SMSI.'
        WHEN 6 THEN 'La sécurité des environnements cloud et virtualisés n''est pas suffisamment encadrée. L''utilisation des services cloud par les équipes IT n''est pas soumise à une politique de sécurité dédiée.'
        WHEN 7 THEN 'L''usage des appareils personnels (BYOD) n''était pas encadré par une politique formelle. Des risques de fuite de données et de contamination du SI bancaire étaient identifiés.'
        ELSE description_nc
    END,
    action_corrective = CASE r.rn
        WHEN 1 THEN 'Définir et déployer une politique de chiffrement couvrant les données au repos et en transit. Mettre en œuvre TLS 1.3 sur l''ensemble des flux sensibles et chiffrer les bases de données clients avec AES-256.'
        WHEN 2 THEN 'Mettre en place un processus de gestion des vulnérabilités avec des SLA de correction définis selon la criticité (critique : 72h, haute : 7j, moyenne : 30j). Déployer un outil de scan automatique et désigner un responsable de suivi.'
        WHEN 3 THEN 'Élaborer un Plan de Continuité du SMSI intégré au PCA de la banque. Définir les RTO/RPO pour les actifs critiques, tester le plan annuellement et former les équipes aux procédures de crise.'
        WHEN 4 THEN 'Intégrer des clauses de sécurité obligatoires dans tous les contrats fournisseurs. Mettre en place un processus d''évaluation sécurité des tiers avant contractualisation et réaliser des audits annuels des fournisseurs critiques.'
        WHEN 5 THEN 'Établir et respecter un programme d''audit interne SMSI annuel conforme à la norme ISO 27001. Former des auditeurs internes qualifiés et reporter les résultats à la revue de direction.'
        WHEN 6 THEN 'Élaborer une politique de sécurité cloud couvrant les usages IaaS, PaaS et SaaS. Définir les critères de qualification des services cloud autorisés et intégrer leur surveillance dans le SMSI.'
        WHEN 7 THEN 'Formaliser et publier une politique BYOD définissant les règles d''usage des appareils personnels, les mesures de sécurité obligatoires (MDM, VPN, chiffrement) et les sanctions en cas de non-respect.'
        ELSE action_corrective
    END,
    responsable = CASE r.rn
        WHEN 1 THEN 'RSSI — Direction Informatique'
        WHEN 2 THEN 'Équipe sécurité — DIS'
        WHEN 3 THEN 'DG + DSI'
        WHEN 4 THEN 'Direction Achats + RSSI'
        WHEN 5 THEN 'RSSI'
        WHEN 6 THEN 'Architecte SI — DIS'
        WHEN 7 THEN 'RSSI'
        ELSE responsable
    END,
    delai = CASE r.rn
        WHEN 1 THEN '2026-03-31'
        WHEN 2 THEN '2026-02-28'
        WHEN 3 THEN '2026-04-30'
        WHEN 4 THEN '2026-05-31'
        WHEN 5 THEN '2026-06-30'
        WHEN 6 THEN '2026-07-31'
        WHEN 7 THEN '2025-12-31'
        ELSE delai
    END,
    priorite = CASE r.rn
        WHEN 1 THEN 'haute'
        WHEN 2 THEN 'haute'
        WHEN 3 THEN 'haute'
        WHEN 4 THEN 'moyenne'
        WHEN 5 THEN 'moyenne'
        WHEN 6 THEN 'moyenne'
        WHEN 7 THEN 'basse'
        ELSE priorite
    END,
    statut = CASE r.rn
        WHEN 1 THEN 'en_cours'
        WHEN 2 THEN 'a_faire'
        WHEN 3 THEN 'a_faire'
        WHEN 4 THEN 'en_cours'
        WHEN 5 THEN 'a_faire'
        WHEN 6 THEN 'a_faire'
        WHEN 7 THEN 'cloture'
        ELSE statut
    END,
    kpi = CASE r.rn
        WHEN 1 THEN '100% des flux sensibles chiffrés en TLS 1.3 — 0 donnée client stockée en clair'
        WHEN 2 THEN '100% des CVE critiques corrigées sous 72h — Taux de conformité patch > 95%'
        WHEN 3 THEN 'PCA SMSI testé annuellement — RTO < 2h pour services bancaires critiques'
        WHEN 4 THEN '100% des contrats fournisseurs avec clauses sécurité — Audit annuel réalisé'
        WHEN 5 THEN 'Programme d''audit interne respecté — Rapport transmis à la revue de direction'
        WHEN 6 THEN '100% des services cloud évalués — Politique cloud publiée et appliquée'
        WHEN 7 THEN '100% des agents ayant signé la politique BYOD — MDM déployé sur appareils enregistrés'
        ELSE kpi
    END,
    updated_at = NOW()
FROM ranked r
WHERE pa.id = r.id;

-- ============================================================
-- SECTION 6 — Planning audit 35 (DNSSI / Santé — 6 semaines)
-- ============================================================

UPDATE audits
SET identification = jsonb_set(
    identification,
    '{planning}',
    '{
        "objectifs": "Évaluer le niveau de maturité SSI du réseau hospitalier national au regard du référentiel DNSSI. Identifier les écarts de conformité, formuler des recommandations et établir un plan d''actions priorisé.",
        "methodes": "Entretiens avec les responsables SI et métier, revue documentaire des politiques et procédures SSI, observations terrain sur les sites, analyse des configurations réseau et des journaux d''événements.",
        "documents_attendus": "Politique de sécurité des SI, schémas réseau, procédures de gestion des incidents, registre des actifs informationnels, PCA/PRI, rapports d''audit antérieurs",
        "etapes": [
            {
                "nom": "Cadrage",
                "activites": "Réunion de lancement, définition du périmètre, collecte des informations générales, signature de la lettre de mission.",
                "date_debut": "2026-04-06",
                "date_fin": "2026-04-10",
                "duree": "1 semaine",
                "livrables": "Lettre de mission, planning validé"
            },
            {
                "nom": "Prérequis / Collecte documents",
                "activites": "Envoi de la liste de documents requis, relance et suivi de réception, vérification de complétude des livrables.",
                "date_debut": "2026-04-13",
                "date_fin": "2026-04-17",
                "duree": "1 semaine",
                "livrables": "Documents clients réceptionnés"
            },
            {
                "nom": "Revue documentaire",
                "activites": "Analyse des politiques, procédures et preuves fournies. Vérification de la cohérence et de la complétude par rapport aux exigences DNSSI.",
                "date_debut": "2026-04-20",
                "date_fin": "2026-04-24",
                "duree": "1 semaine",
                "livrables": "Grille d''analyse documentaire"
            },
            {
                "nom": "Réalisation",
                "activites": "Entretiens avec les responsables SI et métier, observations terrain sur les 3 sites hospitaliers, évaluation des mesures de contrôle DNSSI.",
                "date_debut": "2026-04-27",
                "date_fin": "2026-05-08",
                "duree": "2 semaines",
                "livrables": "Grille d''évaluation DNSSI complétée"
            },
            {
                "nom": "Rendu du rapport",
                "activites": "Rédaction du rapport final, consolidation des non-conformités et recommandations, présentation des résultats au RSSI et à la direction.",
                "date_debut": "2026-05-11",
                "date_fin": "2026-05-16",
                "duree": "1 semaine",
                "livrables": "Rapport d''audit final, plan d''actions priorisé"
            }
        ],
        "sessions": [
            {
                "date": "2026-04-27",
                "entretiens": [
                    {
                        "interlocuteurs": ["M. Ahmed Benali (RSSI)", "M. Khalid Mansouri (DSI)"],
                        "plage_debut": "09:00",
                        "plage_fin": "10:30",
                        "exigences": "Objectif 1 — Organisation et gouvernance SSI\nObjectif 2 — Politique de sécurité des SI\nObjectif 3 — Gestion des risques SSI"
                    },
                    {
                        "interlocuteurs": ["Responsable infrastructure réseau"],
                        "plage_debut": "11:00",
                        "plage_fin": "12:00",
                        "exigences": "Objectif 7 — Gestion des actifs informationnels\nObjectif 8 — Contrôle d''accès logique\nObjectif 14 — Sécurité des réseaux"
                    },
                    {
                        "interlocuteurs": ["Chef de projet IT", "Développeur lead"],
                        "plage_debut": "14:00",
                        "plage_fin": "15:30",
                        "exigences": "Objectif 11 — Sécurité du développement\nObjectif 13 — Acquisition et maintenance des SI"
                    }
                ]
            },
            {
                "date": "2026-05-04",
                "entretiens": [
                    {
                        "interlocuteurs": ["Administrateur systèmes et réseaux"],
                        "plage_debut": "09:00",
                        "plage_fin": "10:00",
                        "exigences": "Objectif 10 — Journalisation et surveillance\nObjectif 9 — Cryptographie\nObjectif 15 — Sécurité physique et environnementale"
                    },
                    {
                        "interlocuteurs": ["Directeur des Ressources Humaines"],
                        "plage_debut": "10:30",
                        "plage_fin": "11:30",
                        "exigences": "Objectif 4 — Sensibilisation et formation SSI\nObjectif 5 — Gestion des ressources humaines"
                    },
                    {
                        "interlocuteurs": ["M. Khalid Mansouri (DSI)", "M. Ahmed Benali (RSSI)"],
                        "plage_debut": "14:00",
                        "plage_fin": "15:30",
                        "exigences": "Objectif 12 — Plan de continuité d''activité (PCA/PRI)\nObjectif 6 — Gestion des incidents de sécurité\nRestitution provisoire — points ouverts"
                    }
                ]
            }
        ]
    }'::jsonb,
    true
),
updated_at = NOW()
WHERE id = 35;


-- ============================================================
-- SECTION 7 — Planning audit 36 (ISO 27001 / Banque — 8 semaines)
-- ============================================================

UPDATE audits
SET identification = jsonb_set(
    identification,
    '{planning}',
    '{
        "objectifs": "Évaluer la conformité du SMSI de la banque aux exigences de la norme ISO 27001:2022. Vérifier l''efficacité des contrôles de l''Annexe A, identifier les non-conformités et proposer un plan d''amélioration en vue d''une certification.",
        "methodes": "Revue du SMSI (politique, procédures, registre des risques, SoA), entretiens avec les responsables sécurité, tests de contrôles techniques, revue des indicateurs et des résultats d''audit interne.",
        "documents_attendus": "Politique SMSI, registre des risques, SoA (Déclaration d''applicabilité), procédures ISO 27001, rapport d''audit interne, PV de revue de direction, résultats des tests d''intrusion",
        "etapes": [
            {
                "nom": "Cadrage",
                "activites": "Réunion de lancement avec la direction, définition du périmètre SMSI, recueil des attentes et signature de la convention d''audit.",
                "date_debut": "2026-05-04",
                "date_fin": "2026-05-08",
                "duree": "1 semaine",
                "livrables": "Convention d''audit, périmètre validé, planning détaillé"
            },
            {
                "nom": "Prérequis / Collecte documents",
                "activites": "Envoi de la liste des documents SMSI requis, suivi de réception et vérification de la complétude du dossier documentaire.",
                "date_debut": "2026-05-11",
                "date_fin": "2026-05-15",
                "duree": "1 semaine",
                "livrables": "Dossier documentaire SMSI réceptionné"
            },
            {
                "nom": "Revue documentaire",
                "activites": "Analyse de la politique SMSI, du registre des risques, du SoA et des procédures ISO 27001. Vérification de la cohérence avec les exigences §4 à §10.",
                "date_debut": "2026-05-18",
                "date_fin": "2026-05-22",
                "duree": "1 semaine",
                "livrables": "Grille de revue documentaire ISO 27001"
            },
            {
                "nom": "Réalisation",
                "activites": "Entretiens avec les responsables sécurité et métier, évaluation des contrôles de l''Annexe A, tests techniques sur le datacenter et les applications bancaires critiques.",
                "date_debut": "2026-05-25",
                "date_fin": "2026-06-13",
                "duree": "3 semaines",
                "livrables": "Grille d''évaluation ISO 27001:2022 complétée, constats d''audit"
            },
            {
                "nom": "Rendu du rapport",
                "activites": "Rédaction du rapport d''audit, consolidation des non-conformités majeures/mineures, présentation des résultats à la direction et remise du plan d''actions.",
                "date_debut": "2026-06-16",
                "date_fin": "2026-06-27",
                "duree": "2 semaines",
                "livrables": "Rapport d''audit ISO 27001:2022, plan d''actions priorisé"
            }
        ],
        "sessions": [
            {
                "date": "2026-05-25",
                "entretiens": [
                    {
                        "interlocuteurs": ["Mme. Fatima Zahra El Idrissi (RSSI)", "Directeur informatique (DIS)"],
                        "plage_debut": "09:00",
                        "plage_fin": "10:30",
                        "exigences": "A.5.1 — Politiques de sécurité de l''information\nA.5.2 — Rôles et responsabilités SSI\nA.5.36 — Conformité aux politiques et normes"
                    },
                    {
                        "interlocuteurs": ["Architecte systèmes d''information"],
                        "plage_debut": "11:00",
                        "plage_fin": "12:30",
                        "exigences": "A.8.1 — Appareils des utilisateurs finaux\nA.8.9 — Gestion de la configuration\nA.11 — Sécurité physique et environnementale"
                    }
                ]
            },
            {
                "date": "2026-06-01",
                "entretiens": [
                    {
                        "interlocuteurs": ["Équipe sécurité opérationnelle (DIS)"],
                        "plage_debut": "09:00",
                        "plage_fin": "10:30",
                        "exigences": "A.8.8 — Gestion des vulnérabilités techniques\nA.8.15 — Journalisation\nA.8.16 — Activités de surveillance"
                    },
                    {
                        "interlocuteurs": ["Administrateur bases de données", "Administrateur réseau"],
                        "plage_debut": "11:00",
                        "plage_fin": "12:30",
                        "exigences": "A.8.24 — Utilisation de la cryptographie\nA.8.20 — Sécurité des réseaux\nA.8.21 — Sécurité des services réseau"
                    }
                ]
            },
            {
                "date": "2026-06-08",
                "entretiens": [
                    {
                        "interlocuteurs": ["Direction des Achats", "Responsable contrats IT"],
                        "plage_debut": "09:00",
                        "plage_fin": "10:00",
                        "exigences": "A.5.19 — Sécurité de l''information dans les relations avec les fournisseurs\nA.5.20 — Sécurité dans les accords avec les fournisseurs"
                    },
                    {
                        "interlocuteurs": ["Directeur des Ressources Humaines"],
                        "plage_debut": "10:30",
                        "plage_fin": "11:30",
                        "exigences": "A.6.3 — Sensibilisation, apprentissage et formation\nA.6.4 — Processus disciplinaire\nA.6.5 — Responsabilités après la fin ou le changement d''emploi"
                    },
                    {
                        "interlocuteurs": ["M. Omar Tazi (Directeur Général)", "Mme. Fatima Zahra El Idrissi (RSSI)"],
                        "plage_debut": "14:00",
                        "plage_fin": "15:30",
                        "exigences": "A.5.35 — Révision indépendante de la sécurité\n§9.3 — Revue de direction\nRestitution provisoire — synthèse des non-conformités"
                    }
                ]
            }
        ]
    }'::jsonb,
    true
),
updated_at = NOW()
WHERE id = 36;


COMMIT;

-- Vérification rapide
SELECT id, nom, phase, statut, date_debut, date_fin,
       identification->>'denomination' AS organisme
FROM audits
WHERE id IN (35, 36);
