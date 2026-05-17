// Script de seed — audits de test
// Usage : node scripts/seedAudits.js

const { Audit, AuditAuditeur, Evaluation, PlanAction, SoA, Document, Notification, Referentiel, Domaine, Objectif, Mesure } = require('../src/models');

const CONSTATS = [
    "Les politiques de sécurité sont documentées mais ne sont pas révisées régulièrement.",
    "Absence de procédure formelle de gestion des incidents de sécurité.",
    "La politique de gestion des mots de passe est appliquée sur l'ensemble des systèmes.",
    "Les droits d'accès aux systèmes critiques ne font pas l'objet d'une revue périodique.",
    "Le plan de continuité d'activité n'a pas été testé depuis plus de 24 mois.",
    "Les journaux d'audit sont activés sur tous les serveurs de production.",
    "Les formations initiales ont été réalisées mais aucune sensibilisation annuelle n'est planifiée.",
    "Les sauvegardes sont effectuées quotidiennement et testées mensuellement.",
    "Aucune politique de sécurité des systèmes d'information (PSSI) formalisée et approuvée.",
    "Le chiffrement des communications n'est pas systématique sur les réseaux internes.",
    "La gestion des actifs informationnels est partielle et non centralisée.",
    "Les contrats avec les prestataires tiers ne comportent pas de clauses de sécurité.",
    "La classification des informations n'est pas appliquée de manière uniforme.",
    "Les incidents de sécurité sont traités de manière ad hoc sans enregistrement.",
];

const RECOMMANDATIONS = [
    "Instaurer un cycle de révision annuel des politiques de sécurité avec validation de la direction.",
    "Élaborer, formaliser et diffuser une procédure de gestion des incidents de sécurité.",
    "Maintenir la politique de mots de passe et étendre les exigences aux comptes de service.",
    "Instaurer une revue semestrielle des droits d'accès avec traçabilité des modifications.",
    "Planifier et exécuter un test du PCA dans les 6 prochains mois avec compte-rendu.",
    "Centraliser les journaux dans un SIEM pour améliorer la détection et la corrélation.",
    "Mettre en place un programme de sensibilisation annuel obligatoire pour tout le personnel.",
    "Documenter et formaliser la procédure de sauvegarde, de restauration et de vérification.",
    "Rédiger la PSSI et la faire approuver par la direction générale avant diffusion.",
    "Déployer TLS sur l'ensemble des flux réseaux internes sensibles et auditer les certificats.",
    "Mettre en place un inventaire centralisé des actifs informationnels avec propriétaire désigné.",
    "Intégrer des clauses de sécurité et des droits d'audit dans tous les contrats prestataires.",
    "Déployer un schéma de classification des informations et former les équipes à son application.",
    "Mettre en place un registre des incidents avec catégorisation, impact et leçons apprises.",
];

const PLANS = [
    { action: "Réviser et faire approuver la politique de sécurité",           responsable: "RSSI",                   delai: new Date('2025-03-31'), priorite: 'haute',   statut: 'en_cours' },
    { action: "Élaborer la procédure de gestion des incidents",                responsable: "DSI",                    delai: new Date('2025-02-28'), priorite: 'haute',   statut: 'a_faire' },
    { action: "Réaliser une revue des droits d'accès",                         responsable: "Administrateur système", delai: new Date('2025-04-30'), priorite: 'haute',   statut: 'a_faire' },
    { action: "Tester le plan de continuité d'activité",                       responsable: "DSI",                    delai: new Date('2025-06-30'), priorite: 'moyenne', statut: 'a_faire' },
    { action: "Déployer un programme de sensibilisation annuel",               responsable: "RSSI",                   delai: new Date('2025-05-31'), priorite: 'moyenne', statut: 'a_faire' },
    { action: "Rédiger et soumettre la PSSI à la direction",                   responsable: "RSSI",                   delai: new Date('2025-03-15'), priorite: 'haute',   statut: 'en_cours' },
    { action: "Déployer TLS sur les flux internes sensibles",                  responsable: "Équipe réseau",          delai: new Date('2025-07-31'), priorite: 'moyenne', statut: 'a_faire' },
    { action: "Mettre en place un SIEM de centralisation des logs",            responsable: "DSI",                    delai: new Date('2025-09-30'), priorite: 'basse',   statut: 'a_faire' },
    { action: "Formaliser la procédure de sauvegarde et de restauration",      responsable: "Administrateur système", delai: new Date('2025-04-15'), priorite: 'moyenne', statut: 'a_faire' },
    { action: "Mettre en place l'inventaire centralisé des actifs",            responsable: "DSI",                    delai: new Date('2025-08-31'), priorite: 'basse',   statut: 'a_faire' },
    { action: "Intégrer les clauses de sécurité dans les contrats prestataires",responsable: "Direction juridique",   delai: new Date('2025-06-30'), priorite: 'moyenne', statut: 'a_faire' },
    { action: "Déployer le schéma de classification des informations",         responsable: "RSSI",                   delai: new Date('2025-10-31'), priorite: 'basse',   statut: 'a_faire' },
];

function getMesureIds(referentiel) {
    const ids = [];
    for (const d of referentiel.domaines || [])
        for (const o of d.objectifs || [])
            for (const m of o.mesures || [])
                ids.push(m.id);
    return ids;
}

// Distribution réaliste : ~35% conforme, 20% partiel, 20% nc_mineure, 15% nc_majeure, 10% na
const CONF_DIST = ['conforme','conforme','conforme','conforme','partiel','partiel','nc_mineure','nc_mineure','nc_majeure','na'];
const MAT_DIST  = [1, 2, 2, 3, 3, 3, 4, 4];
function randConf(i) { return CONF_DIST[i % CONF_DIST.length]; }
function randMat(i)  { return MAT_DIST[i % MAT_DIST.length]; }

async function seed() {
    // ── 1. Supprimer dans l'ordre des dépendances ─────────────────────────────
    await Notification.destroy({ where: {}, force: true });
    await Document.destroy({ where: {}, force: true });
    await SoA.destroy({ where: {}, force: true });
    await PlanAction.destroy({ where: {}, force: true });
    await Evaluation.destroy({ where: {}, force: true });
    await AuditAuditeur.destroy({ where: {}, force: true });
    await Audit.destroy({ where: {}, force: true });
    console.log('✓ Audits et données liées supprimés');

    // ── 2. Charger les référentiels avec mesures ──────────────────────────────
    const include = [{ model: Domaine, as: 'domaines', include: [{ model: Objectif, as: 'objectifs', include: [{ model: Mesure, as: 'mesures', attributes: ['id'] }] }] }];
    const [dnssiRef, isoRef] = await Promise.all([
        Referentiel.findByPk(1, { include }),
        Referentiel.findByPk(2, { include }),
    ]);
    const dnssiIds = getMesureIds(dnssiRef);  // 104 mesures
    const isoIds   = getMesureIds(isoRef);    // 180 mesures

    // ── 3. Audit DNSSI terminé ────────────────────────────────────────────────
    const dnssiAudit = await Audit.create({
        nom:          "Audit de conformité DNSSI 2024 — Ministère de la Santé",
        description:  "Audit annuel de conformité au référentiel DNSSI pour évaluer le niveau de sécurité des systèmes d'information du Ministère de la Santé.",
        statut:       'termine',
        phase:        'termine',
        referentiel_id: 1,
        entite_id:    13,
        client:       'Ministère de la Santé',
        created_by:   1,
        date_debut:   new Date('2024-09-01'),
        date_fin:     new Date('2024-11-30'),
        perimetre:    "Systèmes d'information du Ministère de la Santé : infrastructure réseau, applications métier SIH, gestion des données patients, messagerie institutionnelle.",
        identification: {
            type_audit:                 'conformite',
            perimetre_physique:         'Serveurs du datacenter central, postes de travail des directions',
            perimetre_logique:          'Applications SIH, SI RH, messagerie institutionnelle',
            perimetre_organisationnel:  'DSI, Direction des Ressources Humaines, Direction Administrative',
        },
    });
    await AuditAuditeur.bulkCreate([
        { audit_id: dnssiAudit.id, user_id: 1  },
        { audit_id: dnssiAudit.id, user_id: 10 },
    ]);

    const dnssiEvals = dnssiIds.map((mid, i) => ({
        audit_id:         dnssiAudit.id,
        mesure_id:        mid,
        conformite:       randConf(i),
        niveau_maturite:  randMat(i),
        commentaire:      CONSTATS[i % CONSTATS.length],
        recommandation:   ['nc_mineure','nc_majeure','partiel'].includes(randConf(i)) ? RECOMMANDATIONS[i % RECOMMANDATIONS.length] : null,
    }));
    await Evaluation.bulkCreate(dnssiEvals);

    const ncDnssi = dnssiEvals.filter(e => ['nc_majeure','nc_mineure'].includes(e.conformite)).slice(0, PLANS.length);
    await PlanAction.bulkCreate(ncDnssi.map((e, i) => ({
        audit_id:       dnssiAudit.id,
        mesure_id:      e.mesure_id,
        description_nc: CONSTATS[i % CONSTATS.length],
        ...PLANS[i],
    })));
    console.log(`✓ Audit DNSSI terminé — id:${dnssiAudit.id} — ${dnssiIds.length} évaluations — ${ncDnssi.length} plans`);

    // ── 4. Audit ISO 27001 terminé ────────────────────────────────────────────
    const isoAudit = await Audit.create({
        nom:          "Audit ISO/IEC 27001:2022 — Banque Al Maghrib",
        description:  "Audit de certification ISO/IEC 27001:2022 portant sur le SMSI de la Banque Al Maghrib, couvrant l'ensemble des contrôles de l'annexe A.",
        statut:       'termine',
        phase:        'termine',
        referentiel_id: 2,
        entite_id:    14,
        client:       'Banque Al Maghrib',
        created_by:   1,
        date_debut:   new Date('2024-10-01'),
        date_fin:     new Date('2024-12-15'),
        perimetre:    "SMSI couvrant les systèmes de traitement des opérations bancaires, la gestion des données clients et l'infrastructure IT centrale de la Banque Al Maghrib.",
        identification: {
            type_audit:                 'conformite',
            perimetre_physique:         'Datacenter principal, site de backup, agences centrales',
            perimetre_logique:          'Core banking, applications web, infrastructure cloud hybride',
            perimetre_organisationnel:  'DSI, Direction Sécurité, Direction des Opérations',
        },
    });
    await AuditAuditeur.bulkCreate([
        { audit_id: isoAudit.id, user_id: 1  },
        { audit_id: isoAudit.id, user_id: 10 },
    ]);

    // Évaluer les 93 premières mesures ISO
    const isoSubset = isoIds.slice(0, 93);
    const isoEvals  = isoSubset.map((mid, i) => ({
        audit_id:        isoAudit.id,
        mesure_id:       mid,
        conformite:      randConf(i + 3),
        niveau_maturite: randMat(i + 2),
        commentaire:     CONSTATS[i % CONSTATS.length],
        recommandation:  ['nc_mineure','nc_majeure','partiel'].includes(randConf(i + 3)) ? RECOMMANDATIONS[i % RECOMMANDATIONS.length] : null,
    }));
    await Evaluation.bulkCreate(isoEvals);

    // SoA ISO (toutes les mesures)
    const SOA_STATUTS = ['implemente','implemente','planifie','partiel','non_implemente'];
    await SoA.bulkCreate(isoIds.map((mid, i) => ({
        audit_id:               isoAudit.id,
        mesure_id:              mid,
        applicable:             i % 9 !== 0,
        statut_implementation:  SOA_STATUTS[i % SOA_STATUTS.length],
        justification_exclusion: i % 9 === 0 ? "Non applicable au périmètre de l'organisation" : null,
        raisons_inclusion:      i % 9 !== 0 ? ['Exigences légales', 'Risques identifiés'].slice(0, (i % 2) + 1) : null,
        reference_document:     i % 4 === 0 ? `PSSI-BAM-${String(i).padStart(3,'0')}` : null,
    })));

    const ncIso = isoEvals.filter(e => ['nc_majeure','nc_mineure'].includes(e.conformite)).slice(0, PLANS.length);
    await PlanAction.bulkCreate(ncIso.map((e, i) => ({
        audit_id:       isoAudit.id,
        mesure_id:      e.mesure_id,
        description_nc: CONSTATS[i % CONSTATS.length],
        ...PLANS[i % PLANS.length],
    })));
    console.log(`✓ Audit ISO terminé — id:${isoAudit.id} — ${isoSubset.length} évaluations — SoA:${isoIds.length} — ${ncIso.length} plans`);

    // ── 5. Audit DNSSI en cours (réalisation) ────────────────────────────────
    const dnssiEncours = await Audit.create({
        nom:          "Audit DNSSI 2025 — Ministère des Finances",
        description:  "Audit de conformité DNSSI en cours pour le Ministère des Finances.",
        statut:       'en_cours',
        phase:        'realisation',
        referentiel_id: 1,
        entite_id:    13,
        client:       'Ministère des Finances',
        created_by:   1,
        date_debut:   new Date('2025-03-01'),
        date_fin:     new Date('2025-06-30'),
        perimetre:    "Systèmes d'information financiers et budgétaires du Ministère des Finances.",
    });
    await AuditAuditeur.bulkCreate([
        { audit_id: dnssiEncours.id, user_id: 10 },
        { audit_id: dnssiEncours.id, user_id: 8  },
    ]);
    console.log(`✓ Audit DNSSI en cours — id:${dnssiEncours.id}`);

    // ── 6. Audit ISO en cours (prérequis) ────────────────────────────────────
    const isoEncours = await Audit.create({
        nom:          "Audit ISO 27001 — test entreprise client",
        description:  "Audit de conformité ISO 27001 pour l'entreprise client.",
        statut:       'en_cours',
        phase:        'prerequis',
        referentiel_id: 2,
        entite_id:    16,
        client:       'test entreprise client',
        created_by:   1,
        date_debut:   new Date('2025-04-01'),
        date_fin:     new Date('2025-08-31'),
        perimetre:    'Périmètre à définir avec le client.',
    });
    await AuditAuditeur.create({ audit_id: isoEncours.id, user_id: 1 });
    console.log(`✓ Audit ISO en cours — id:${isoEncours.id}`);

    console.log('\n✅ Seed terminé — 4 audits créés (2 terminés, 2 en cours)');
    process.exit(0);
}

seed().catch(e => {
    console.error('❌ Erreur :', e.message);
    console.error(e.stack);
    process.exit(1);
});
