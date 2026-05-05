-- Suppression propre avec CASCADE
TRUNCATE TABLE evaluations, soa, plans_actions, audit_auditeurs CASCADE;
UPDATE notifications SET audit_id = NULL WHERE audit_id IS NOT NULL;
TRUNCATE TABLE audits RESTART IDENTITY CASCADE;

-- Audits de test (une par phase)
INSERT INTO audits (nom, client, perimetre, date_debut, date_fin, statut, entite_id, referentiel_id, created_by, phase, statut_validation, identification, indicateurs, created_at, updated_at)
VALUES
  (
    'Audit DNSSI 2026 - Ministere Education',
    'Ministere de l Education Nationale',
    'Systemes d information du reseau educatif national',
    '2026-03-01', '2026-06-30',
    'brouillon', 4, 1, 1, 'cadrage', NULL, NULL, NULL,
    NOW(), NOW()
  ),
  (
    'Audit DNSSI - VICNLM',
    'VICNLM',
    'Infrastructure reseau et applications metier',
    '2026-04-01', '2026-07-31',
    'brouillon', 5, 1, 1, 'prerequis', NULL, NULL, NULL,
    NOW(), NOW()
  ),
  (
    'Audit DNSSI - SRH',
    'SRH',
    'Systeme de gestion des ressources humaines',
    '2026-02-15', '2026-05-15',
    'brouillon', 6, 1, 1, 'revue_documentaire', NULL, NULL, NULL,
    NOW(), NOW()
  ),
  (
    'Audit DNSSI - Conformite complete',
    'Ministere de l Education Nationale',
    'Perimetre complet - tous domaines DNSSI',
    '2026-01-10', '2026-04-30',
    'en_cours', 4, 1, 1, 'realisation', NULL, NULL, NULL,
    NOW(), NOW()
  ),
  (
    'Audit ISO 27001 - TEST ENTIEESSS',
    'TEST ENTIEESSS',
    'SMSI perimetre global',
    '2026-03-15', '2026-08-15',
    'en_cours', 2, 2, 1, 'realisation', NULL, NULL, NULL,
    NOW(), NOW()
  );

-- Assignation auditeurs pour les audits en realisation
INSERT INTO audit_auditeurs (audit_id, user_id, created_at, updated_at)
VALUES (4, 8, NOW(), NOW()), (4, 10, NOW(), NOW()), (5, 10, NOW(), NOW());

SELECT id, nom, phase, statut, referentiel_id FROM audits ORDER BY id;
