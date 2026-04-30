/**
 * Script de correction : A.5.3 stocké comme objectif sans mesures
 *
 * Problème : A.5.3 a été importé au niveau "objectif" au lieu de "mesure".
 * Il apparaît dans la SoA et l'évaluation comme un en-tête vide non évaluable.
 *
 * Correction :
 *   1. Trouver l'objectif A.5.3 dans la table objectifs
 *   2. Trouver l'objectif parent correct (celui qui contient A.5.1, A.5.2, etc.)
 *   3. Insérer A.5.3 comme mesure sous cet objectif parent
 *   4. Supprimer A.5.3 de la table objectifs
 *
 * Usage : node scripts/fix_a53_objectif.js
 */

require('dotenv').config();
const { sequelize, Objectif, Mesure, Domaine } = require('../src/models/index');

async function main() {
    const t = await sequelize.transaction();
    try {
        // ── 1. Vérifier que A.5.3 existe bien en tant qu'objectif ──────────────
        const objectifA53 = await Objectif.findOne({ where: { code: 'A.5.3' }, transaction: t });
        if (!objectifA53) {
            console.log('✗ A.5.3 introuvable dans la table objectifs. Rien à corriger.');
            await t.rollback();
            return;
        }
        console.log(`✓ A.5.3 trouvé en tant qu'objectif (id=${objectifA53.id}, domaine_id=${objectifA53.domaine_id})`);
        console.log(`  Description : ${objectifA53.description}`);

        // ── 2. Vérifier qu'il n'a bien aucune mesure enfant ───────────────────
        const childMesures = await Mesure.findAll({ where: { objectif_id: objectifA53.id }, transaction: t });
        if (childMesures.length > 0) {
            console.log(`✗ A.5.3 possède ${childMesures.length} mesure(s) enfant. Annulation pour éviter toute perte.`);
            await t.rollback();
            return;
        }

        // ── 3. Trouver l'objectif parent correct ──────────────────────────────
        // L'objectif parent est celui du même domaine qui contient les mesures A.5.x
        const parentObjectif = await Objectif.findOne({
            where: { domaine_id: objectifA53.domaine_id },
            include: [{
                model: Mesure,
                as: 'mesures',
                where: sequelize.where(
                    sequelize.fn('LEFT', sequelize.col('mesures.code'), 3),
                    'A.5'
                ),
                required: true,
            }],
            transaction: t,
        });

        if (!parentObjectif) {
            // Fallback : prendre le premier objectif du même domaine (autre que A.5.3)
            const fallback = await Objectif.findOne({
                where: { domaine_id: objectifA53.domaine_id },
                transaction: t,
            });
            if (!fallback) {
                console.log('✗ Impossible de trouver un objectif parent dans ce domaine. Annulation.');
                await t.rollback();
                return;
            }
            console.log(`⚠ Objectif parent trouvé par fallback : id=${fallback.id} (${fallback.code})`);
            await insertAndClean(objectifA53, fallback.id, t);
        } else {
            console.log(`✓ Objectif parent identifié : id=${parentObjectif.id} (${parentObjectif.code})`);
            await insertAndClean(objectifA53, parentObjectif.id, t);
        }

        await t.commit();
        console.log('\n✅ Correction appliquée avec succès. Redémarre le backend pour que Sequelize recharge le référentiel.');
    } catch (err) {
        await t.rollback();
        console.error('✗ Erreur — rollback effectué :', err.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

async function insertAndClean(objectifA53, parentObjectifId, t) {
    // Vérifier qu'une mesure A.5.3 n'existe pas déjà
    const existing = await Mesure.findOne({ where: { code: 'A.5.3' }, transaction: t });
    if (existing) {
        console.log(`⚠ Une mesure A.5.3 existe déjà (id=${existing.id}). Suppression de l'objectif orphelin uniquement.`);
    } else {
        const newMesure = await Mesure.create({
            objectif_id: parentObjectifId,
            code: 'A.5.3',
            description: objectifA53.description,
            niveau_cible: 3,
        }, { transaction: t });
        console.log(`✓ Mesure A.5.3 créée (id=${newMesure.id}) sous objectif_id=${parentObjectifId}`);
    }

    await Objectif.destroy({ where: { id: objectifA53.id }, transaction: t });
    console.log(`✓ Objectif A.5.3 (id=${objectifA53.id}) supprimé de la table objectifs`);
}

main();
