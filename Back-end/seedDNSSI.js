const ExcelJS = require('exceljs');
const path = require('path');
const { sequelize, Referentiel, Domaine, Objectif, Mesure } = require('./src/models');

const EXCEL_PATH = path.join(__dirname, '..', 'support', 'outil_devaluation_dnssi.xlsx');

const seedDNSSI = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log('Connexion OK');

        // Vérifier si déjà seedé
        const existing = await Referentiel.findOne({ where: { type: 'DNSSI' } });
        if (existing) {
            console.log('Référentiel DNSSI déjà présent en base. Abandon.');
            process.exit(0);
        }

        // Créer le référentiel
        const referentiel = await Referentiel.create({
            nom: 'Directive Nationale de la Sécurité des Systèmes d\'Information',
            version: '1.0',
            type: 'DNSSI',
            description: 'Référentiel national applicable aux administrations et opérateurs d\'importance vitale, structurant les exigences de sécurité des SI.',
        });
        console.log('Référentiel DNSSI créé (id:', referentiel.id, ')');

        // Lire le fichier Excel
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXCEL_PATH);
        const ws = workbook.getWorksheet('Evaluation_MO_DNSSI');

        if (!ws) {
            throw new Error('Feuille "Evaluation_MO_DNSSI" introuvable');
        }

        let currentDomaine = null;
        let currentObjectif = null;
        let domaineCount = 0;
        let objectifCount = 0;
        let mesureCount = 0;

        // Parcourir les lignes (à partir de la ligne 3, après l'en-tête)
        ws.eachRow((row, rowNumber) => {
            if (rowNumber <= 2) return; // Skip header

            const chapitre = row.getCell(1).value ? String(row.getCell(1).value).trim() : '';
            const objectif = row.getCell(2).value ? String(row.getCell(2).value).trim() : '';
            const regle = row.getCell(3).value ? String(row.getCell(3).value).trim() : '';

            // Stocker les données pour traitement séquentiel
            if (!row._parsedData) row._parsedData = {};
            row._parsedData = { chapitre, objectif, regle };
        });

        // Collecter les données structurées
        const rows = [];
        ws.eachRow((row, rowNumber) => {
            if (rowNumber <= 2) return;
            const chapitre = row.getCell(1).value ? String(row.getCell(1).value).trim() : '';
            const objectif = row.getCell(2).value ? String(row.getCell(2).value).trim() : '';
            const regle = row.getCell(3).value ? String(row.getCell(3).value).trim() : '';
            if (regle) {
                rows.push({ chapitre, objectif, regle });
            }
        });

        console.log(`${rows.length} règles trouvées dans le fichier Excel`);

        // Traiter les lignes séquentiellement
        let lastChapitreText = '';
        let lastObjectifText = '';

        // Construire le map code → description depuis les commentaires de cellule
        const descriptionMap = {};
        ws.eachRow((row, rowNumber) => {
            if (rowNumber <= 2) return;
            const cell = row.getCell(3);
            const code = cell.value ? String(cell.value).trim() : '';
            if (!code) return;
            const note = cell.note;
            if (note && note.texts) {
                const full = note.texts.map(t => t.text).join('');
                // Supprimer la première ligne (qui répète le code) et nettoyer
                const lines = full.split('\n').map(l => l.trim()).filter(Boolean);
                const desc = lines.slice(1).join(' ').trim(); // ignorer la 1ère ligne = code
                if (desc) descriptionMap[code] = desc;
            }
        });
        console.log(`${Object.keys(descriptionMap).length} descriptions extraites des commentaires`);

        for (const row of rows) {
            // Nouveau domaine/chapitre ?
            if (row.chapitre && row.chapitre !== lastChapitreText) {
                lastChapitreText = row.chapitre;
                // Extraire le numéro du chapitre (ignorer les en-têtes sans numéro)
                const codeMatch = row.chapitre.match(/^(\d+)\./);
                if (!codeMatch) continue; // Ignorer les lignes d'en-tête
                const code = codeMatch[1];

                currentDomaine = await Domaine.create({
                    referentiel_id: referentiel.id,
                    code: code,
                    nom: row.chapitre,
                    ponderation: 1.0,
                });
                domaineCount++;
                console.log(`  Domaine ${code}: ${row.chapitre.substring(0, 60)}...`);
            }

            // Nouvel objectif ?
            if (row.objectif && row.objectif !== lastObjectifText) {
                lastObjectifText = row.objectif;
                const objMatch = row.objectif.match(/Objectif\s+(\d+)/);
                const objCode = objMatch ? objMatch[1] : String(objectifCount + 1);

                currentObjectif = await Objectif.create({
                    domaine_id: currentDomaine.id,
                    code: objCode,
                    description: row.objectif,
                });
                objectifCount++;
            }

            // Créer la mesure/règle
            if (row.regle && currentObjectif) {
                const code = row.regle.trim();
                await Mesure.create({
                    objectif_id: currentObjectif.id,
                    code,
                    description: descriptionMap[code] || null,
                    niveau_cible: 3,
                });
                mesureCount++;
            }
        }

        console.log('\n=== Seed DNSSI terminé ===');
        console.log(`  ${domaineCount} domaines (chapitres)`);
        console.log(`  ${objectifCount} objectifs`);
        console.log(`  ${mesureCount} mesures (règles)`);

        process.exit(0);
    } catch (error) {
        console.error('Erreur seed DNSSI:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

seedDNSSI();
