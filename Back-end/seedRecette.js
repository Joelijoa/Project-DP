/**
 * seedRecette.js — Audits de test pour la recette finale
 * Usage : node seedRecette.js
 * Idempotent : ne recrée pas si déjà présent.
 */

const {
    sequelize, Audit, User, Referentiel, Mesure, Domaine, Objectif,
    Evaluation, PlanAction, AuditAuditeur, Entite, SoA,
} = require('./src/models');

const seed = async () => {
    await sequelize.authenticate();

    const existing = await Audit.findOne({ where: { nom: 'Audit DNSSI — Ministère de la Santé' } });
    if (existing) { console.log('Déjà présent. Abandon.'); process.exit(0); }

    const admin  = await User.findOne({ where: { role: 'admin' } });
    const senior = await User.findOne({ where: { role: 'auditeur_senior' } });
    const junior = await User.findOne({ where: { role: 'auditeur_junior' } });
    const client = await User.findOne({ where: { role: 'client' } });

    if (!admin) { console.error('Aucun admin trouvé'); process.exit(1); }

    const refDNSSI = await Referentiel.findOne({ where: { type: 'DNSSI' } });
    const refISO   = await Referentiel.findOne({ where: { type: 'ISO27001' } });
    if (!refDNSSI) { console.error('Référentiel DNSSI absent'); process.exit(1); }

    const [entiteSante]  = await Entite.findOrCreate({ where: { nom: 'Ministère de la Santé' },  defaults: { nom: 'Ministère de la Santé' } });
    const [entiteBanque] = await Entite.findOrCreate({ where: { nom: 'Banque Al Maghrib' },       defaults: { nom: 'Banque Al Maghrib' } });

    if (client && !client.entite_id) await client.update({ entite_id: entiteSante.id });

    const ident = (nom, ville) => ({
        denomination: nom,
        departement: 'Direction des Systèmes d\'Information',
        adresse: '12 Avenue Hassan II',
        ville,
        site_web: `www.${nom.toLowerCase().replace(/[\s']/g, '-').replace(/-+/g, '-')}.ma`,
        rssi_nom_prenom: 'Mohammed El Amrani',
        rssi_rattachement: 'DSI',
        rssi_email: 'rssi@organisation.ma',
        rssi_telephone: '+212 522 000 000',
        auteur_evaluation: `${admin.prenom} ${admin.nom}`,
        date_evaluation: '2026-05-10',
        valide_par: senior ? `${senior.prenom} ${senior.nom}` : '',
        date_validation: '2026-05-12',
        type_audit: 'audit_conformite',
        perimetre_physique: 'Datacenter principal, salle serveurs bâtiment A',
        perimetre_logique: 'SI métier, Intranet, VPN, applications critiques',
        perimetre_organisationnel: 'DSI, Direction Sécurité, Directions métier',
    });

    const constats = [
        'Aucune politique formalisée.', 'Processus documenté mais non appliqué.', 'Appliqué de manière informelle.',
        'Processus défini et documenté.', 'Indicateurs de suivi en place.', 'Processus optimisé continuellement.',
        'Contrôle absent.', 'Partiellement mis en œuvre.', 'Déploiement en cours.',
        'Formation non réalisée.', 'Revue annuelle effectuée.', 'Automatisation en place.',
    ];
    const recommandations = [
        'Mettre en place une politique de sécurité approuvée par la direction.',
        'Former les équipes aux procédures existantes.',
        'Documenter et formaliser le processus.',
        'Mettre en place un suivi par indicateurs.',
        'Planifier des audits internes réguliers.',
        null, null,
        'Renforcer les contrôles d\'accès physiques et logiques.',
        'Mettre en place une gestion des vulnérabilités.',
        'Réviser les procédures de sauvegarde.',
        null, null,
    ];

    // ── Audit DNSSI ───────────────────────────────────────────────────────────
    const niveauxDNSSI = [0, 1, 2, 3, 4, 5, 0, 2, 3, 1, 4, 5, 0, 3, 2, 4, 1, 5, 0, 2];

    const a1 = await Audit.create({
        nom: 'Audit DNSSI — Ministère de la Santé',
        client: entiteSante.nom,
        perimetre: 'Périmètre complet — tous domaines DNSSI',
        date_debut: '2026-03-01',
        date_fin: '2026-06-30',
        statut: 'en_cours',
        phase: 'realisation',
        referentiel_id: refDNSSI.id,
        entite_id: entiteSante.id,
        created_by: admin.id,
        identification: ident(entiteSante.nom, 'Rabat'),
        validation_planning: { statut: 'valide', date: '2026-03-05', commentaire: 'Planning validé par le client.' },
    });
    if (senior) await AuditAuditeur.findOrCreate({ where: { audit_id: a1.id, user_id: senior.id }, defaults: { audit_id: a1.id, user_id: senior.id } });
    if (junior) await AuditAuditeur.findOrCreate({ where: { audit_id: a1.id, user_id: junior.id }, defaults: { audit_id: a1.id, user_id: junior.id } });

    const mesuresDNSSI = await Mesure.findAll({
        include: [{ model: Objectif, as: 'objectif', include: [{ model: Domaine, as: 'domaine', where: { referentiel_id: refDNSSI.id }, required: true }], required: true }],
        limit: 40,
    });

    await Evaluation.bulkCreate(
        mesuresDNSSI.map((m, i) => ({
            audit_id: a1.id, mesure_id: m.id,
            niveau_maturite: niveauxDNSSI[i % niveauxDNSSI.length],
            commentaire: constats[i % constats.length],
            recommandation: recommandations[i % recommandations.length],
        })),
        { ignoreDuplicates: true }
    );

    const mesuresNC1 = mesuresDNSSI.filter((_, i) => niveauxDNSSI[i % niveauxDNSSI.length] <= 3);
    await PlanAction.bulkCreate(
        mesuresNC1.slice(0, 10).map((m, i) => {
            const niv = niveauxDNSSI[mesuresDNSSI.indexOf(m) % niveauxDNSSI.length];
            return {
                audit_id: a1.id, mesure_id: m.id,
                description_nc: constats[i % constats.length],
                action_corrective: recommandations[i % recommandations.length] || 'Action corrective à définir.',
                responsable: ['RSSI', 'DSI', 'Responsable Sécurité'][i % 3],
                delai: i % 2 === 0 ? '2026-09-30' : '2026-12-31',
                priorite: niv <= 1 ? 'haute' : niv <= 2 ? 'moyenne' : 'basse',
                statut: i % 4 === 0 ? 'en_cours' : 'a_faire',
                kpi: i % 3 === 0 ? 'Taux de conformité > 80%' : null,
                created_by: admin.id,
                statut_validation: i === 0 ? 'valide' : i === 1 ? 'en_attente' : null,
            };
        }),
        { ignoreDuplicates: true }
    );
    console.log(`✓ Audit DNSSI créé (id=${a1.id}) — ${mesuresDNSSI.length} évals, ${Math.min(mesuresNC1.length, 10)} plans`);

    // ── Audit ISO 27001 ───────────────────────────────────────────────────────
    if (refISO) {
        const niveauxISO = [0, 1, 2, 1, 0, 2, 1, 1, 0, 2, 1, 0, 1, 2, 1];

        const a2 = await Audit.create({
            nom: 'Audit ISO 27001 — Banque Al Maghrib',
            client: entiteBanque.nom,
            perimetre: 'SMSI périmètre global — Annexe A complète',
            date_debut: '2026-04-01',
            date_fin: '2026-09-30',
            statut: 'en_cours',
            phase: 'realisation',
            referentiel_id: refISO.id,
            entite_id: entiteBanque.id,
            created_by: admin.id,
            identification: ident(entiteBanque.nom, 'Casablanca'),
            validation_planning: { statut: 'valide', date: '2026-04-05', commentaire: 'Planning ISO validé.' },
        });
        if (senior) await AuditAuditeur.findOrCreate({ where: { audit_id: a2.id, user_id: senior.id }, defaults: { audit_id: a2.id, user_id: senior.id } });
        if (junior) await AuditAuditeur.findOrCreate({ where: { audit_id: a2.id, user_id: junior.id }, defaults: { audit_id: a2.id, user_id: junior.id } });

        const mesuresISO = await Mesure.findAll({
            include: [{ model: Objectif, as: 'objectif', include: [{ model: Domaine, as: 'domaine', where: { referentiel_id: refISO.id }, required: true }], required: true }],
            limit: 30,
        });

        await SoA.bulkCreate(
            mesuresISO.map(m => ({ audit_id: a2.id, mesure_id: m.id, applicable: true, justification: 'Applicable au périmètre SMSI.' })),
            { ignoreDuplicates: true }
        );
        await Evaluation.bulkCreate(
            mesuresISO.map((m, i) => ({
                audit_id: a2.id, mesure_id: m.id,
                niveau_maturite: niveauxISO[i % niveauxISO.length],
                commentaire: constats[i % constats.length],
                recommandation: niveauxISO[i % niveauxISO.length] !== 1 ? recommandations[i % recommandations.length] : null,
            })),
            { ignoreDuplicates: true }
        );
        const mesuresNCISO = mesuresISO.filter((_, i) => niveauxISO[i % niveauxISO.length] !== 1);
        await PlanAction.bulkCreate(
            mesuresNCISO.slice(0, 8).map((m, i) => ({
                audit_id: a2.id, mesure_id: m.id,
                description_nc: constats[i % constats.length],
                action_corrective: recommandations[i % recommandations.length] || 'Mettre en conformité le contrôle.',
                responsable: i % 2 === 0 ? 'RSSI' : 'DSI',
                delai: '2026-12-31',
                priorite: niveauxISO[mesuresISO.indexOf(m) % niveauxISO.length] === 0 ? 'haute' : 'moyenne',
                statut: 'a_faire',
                created_by: admin.id,
            })),
            { ignoreDuplicates: true }
        );
        console.log(`✓ Audit ISO créé (id=${a2.id}) — ${mesuresISO.length} évals, ${Math.min(mesuresNCISO.length, 8)} plans`);
    } else {
        console.log('  Référentiel ISO absent — audit ISO ignoré');
    }

    console.log('\n✅ Seed recette terminé.');
    process.exit(0);
};

seed().catch(err => { console.error('Erreur :', err.message); process.exit(1); });
