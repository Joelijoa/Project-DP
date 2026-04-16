/**
 * Migration : met à jour les descriptions des mesures DNSSI
 * à partir des commentaires de cellule du fichier Excel.
 * Peut être relancé plusieurs fois sans risque (idempotent).
 */
const ExcelJS = require('exceljs');
const path = require('path');
const { sequelize, Mesure } = require('./src/models');

const EXCEL_PATH = path.join(__dirname, '..', 'support', 'outil_devaluation_dnssi.xlsx');

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB connectée');

        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(EXCEL_PATH);
        const ws = wb.getWorksheet('Evaluation_MO_DNSSI');
        if (!ws) throw new Error('Feuille Evaluation_MO_DNSSI introuvable');

        // Extraire descriptions depuis les commentaires de cellule (colonne 3)
        const descriptionMap = {};
        ws.eachRow((row, rowNumber) => {
            if (rowNumber <= 2) return;
            const cell = row.getCell(3);
            const code = cell.value ? String(cell.value).trim() : '';
            if (!code) return;
            const note = cell.note;
            if (note && note.texts) {
                const full = note.texts.map(t => t.text).join('');
                const lines = full.split('\n').map(l => l.trim()).filter(Boolean);
                // La première ligne répète le code (ex "POL-RISQUE:"), on la retire
                const desc = lines.slice(1).join(' ').trim();
                if (desc) descriptionMap[code] = desc;
            }
        });

        console.log(`${Object.keys(descriptionMap).length} descriptions extraites`);

        // Mettre à jour chaque mesure en base
        let updated = 0;
        let notFound = 0;

        for (const [code, description] of Object.entries(descriptionMap)) {
            const mesure = await Mesure.findOne({ where: { code } });
            if (mesure) {
                await mesure.update({ description });
                updated++;
            } else {
                // Essayer avec trim étendu (certains codes ont des espaces internes)
                const mesures = await Mesure.findAll();
                const match = mesures.find(m => m.code.replace(/\s+/g, '') === code.replace(/\s+/g, ''));
                if (match) {
                    await match.update({ description });
                    updated++;
                } else {
                    console.warn('  Non trouvé en base:', code);
                    notFound++;
                }
            }
        }

        console.log(`\n=== Migration terminée ===`);
        console.log(`  ${updated} mesures mises à jour`);
        if (notFound > 0) console.log(`  ${notFound} codes non trouvés en base`);

        await sequelize.close();
        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err.message);
        process.exit(1);
    }
};

run();
