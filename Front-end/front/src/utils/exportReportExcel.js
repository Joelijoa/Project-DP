import ExcelJS from 'exceljs';
import Chart from 'chart.js/auto';

// ─── COULEURS ─────────────────────────────────────────────────────────────────
const C = {
    navy:        'FF1E293B',
    navyMid:     'FF334155',
    red:         'FFCC0000',
    white:       'FFFFFFFF',
    light:       'FFF8FAFC',
    border:      'FFE2E8F0',
    borderDark:  'FFCBD5E1',
    gray:        'FF6B7280',
    green:       'FF16A34A',
    greenLight:  'FFF0FDF4',
    greenFont:   'FF15803D',
    orange:      'FFEA580C',
    orangeLight: 'FFFEF3C7',
    orangeFont:  'FF92400E',
    redLight:    'FFFEE2E2',
    redFont:     'FF991B1B',
};

const FONT = 'Calibri';

const PHASE_LABELS  = { cadrage:'Cadrage', prerequis:'Prérequis', revue_documentaire:'Revue documentaire', realisation:'Réalisation', termine:'Terminé' };
const STATUT_LABELS = { brouillon:'Brouillon', en_cours:'En cours', termine:'Terminé', archive:'Archivé' };
const CONF_LABELS   = { conforme:'Conforme', partiel:'Partiellement conforme', non_conforme:'Non conforme', nc_mineure:'NC Mineure', nc_majeure:'NC Majeure', na:'N/A' };
const MAT_LABELS    = ['Aucun (0)', 'Initial (1)', 'Reproductible (2)', 'Défini (3)', 'Maîtrisé (4)', 'Optimisé (5)'];
const MAT_SHORT     = ['Aucun', 'Initial', 'Reproductible', 'Défini', 'Maîtrisé', 'Optimisé'];
const STATUT_PLAN   = { a_faire:'À faire', en_cours:'En cours', cloture:'Clôturé' };
const CONF_DNSSI    = { conforme:'Totale', partiel:'Partielle', non_conforme:'Non conforme', nc_mineure:'Non conforme', nc_majeure:'Non conforme', na:'N/A' };

const CONF_KEYS         = ['conforme','partiel','nc_mineure','nc_majeure','non_conforme','na'];
const CONF_LABELS_SHORT = ['Conforme','Partiel','NC Min.','NC Maj.','Non conforme','N/A'];
const CONF_COLORS       = ['#16a34a','#ca8a04','#ea580c','#dc2626','#991b1b','#9ca3af'];
const MAT_COLORS        = ['#9ca3af','#f59e0b','#f97316','#3b82f6','#8b5cf6','#16a34a'];

// ─── UTILITAIRES DONNÉES ──────────────────────────────────────────────────────
function sortDomaines(domaines) {
    return [...(domaines || [])].sort((a, b) =>
        (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
    );
}
function buildEvalMap(evaluations) {
    const map = {};
    for (const ev of evaluations) map[ev.mesure_id] = ev;
    return map;
}
function buildPlanMap(planActions) {
    const map = {};
    for (const p of planActions) {
        if (!map[p.mesure_id]) map[p.mesure_id] = [];
        map[p.mesure_id].push(p);
    }
    return map;
}

// ─── CHART PNG ────────────────────────────────────────────────────────────────
async function chartToPNG(config, wPx, hPx) {
    const canvas = document.createElement('canvas');
    canvas.width = wPx; canvas.height = hPx;
    canvas.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(canvas);
    try {
        const chart = new Chart(canvas, {
            ...config,
            options: { ...(config.options || {}), responsive: false, animation: false },
        });
        await new Promise(r => setTimeout(r, 120));
        const ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, wPx, hPx);
        ctx.globalCompositeOperation = 'source-over';
        const url = canvas.toDataURL('image/png', 1.0);
        chart.destroy();
        return url.split(',')[1];
    } finally {
        if (document.body.contains(canvas)) document.body.removeChild(canvas);
    }
}

// ─── HELPERS STYLE ────────────────────────────────────────────────────────────
const thin  = (argb = C.border)     => ({ style: 'thin',   color: { argb } });
const thick = (argb = C.borderDark) => ({ style: 'medium', color: { argb } });

function bdr(color = C.border) { return { top: thin(color), bottom: thin(color), left: thin(color), right: thin(color) }; }

function applyCell(cell, { bg, fontColor, bold = false, size = 10, italic = false, align = 'left', valign = 'middle', wrap = true, borderColor } = {}) {
    if (bg)        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font      = { name: FONT, bold, italic, size, color: { argb: fontColor || C.navy } };
    cell.border    = bdr(borderColor || C.border);
    cell.alignment = { horizontal: align, vertical: valign, wrapText: wrap };
}

function titleRow(ws, r, text, span, bg = C.navy, size = 13) {
    ws.getRow(r).height = 34;
    const cell = ws.getCell(r, 1);
    cell.value = text;
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font  = { name: FONT, bold: true, color: { argb: C.white }, size };
    cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    if (span > 1) ws.mergeCells(r, 1, r, span);
}

function sectionRow(ws, r, text, span) {
    ws.getRow(r).height = 24;
    const cell = ws.getCell(r, 1);
    cell.value = text;
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.red } };
    cell.font  = { name: FONT, bold: true, color: { argb: C.white }, size: 10 };
    cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    if (span > 1) ws.mergeCells(r, 1, r, span);
}

function headerRow(ws, r, labels, heights = 22) {
    ws.getRow(r).height = heights;
    labels.forEach((lbl, i) => {
        const cell = ws.getCell(r, i + 1);
        cell.value = lbl;
        applyCell(cell, { bg: C.navy, fontColor: C.white, bold: true, size: 10, align: 'center' });
    });
}

function labelValue(ws, r, label, value, labelCols = 1, valueCols = 2) {
    ws.getRow(r).height = 24;
    const lc = ws.getCell(r, 1);
    lc.value = label;
    applyCell(lc, { bg: C.light, fontColor: C.navyMid, bold: true, size: 9, borderColor: C.border });
    if (labelCols > 1) ws.mergeCells(r, 1, r, labelCols);

    const vc = ws.getCell(r, labelCols + 1);
    vc.value = value;
    applyCell(vc, { bg: C.white, fontColor: C.navy, size: 10, borderColor: C.border });
    if (valueCols > 1) ws.mergeCells(r, labelCols + 1, r, labelCols + valueCols);
}

function confStyle(key) {
    const bg   = { conforme:C.greenLight, partiel:C.orangeLight, nc_mineure:C.orangeLight, nc_majeure:C.redLight, non_conforme:C.redLight, na:C.light };
    const font = { conforme:C.greenFont,  partiel:C.orangeFont,  nc_mineure:C.orangeFont,  nc_majeure:C.redFont,  non_conforme:C.redFont,  na:C.gray };
    return { bg: bg[key] || C.light, fontColor: font[key] || C.gray };
}

// ─── ONGLET 1 : Synthèse ──────────────────────────────────────────────────────
async function addSyntheseSheet(wb, audit, evaluations, planActions, imgs) {
    const ws = wb.addWorksheet('Synthèse');
    ws.columns = [{ width: 30 },{ width: 24 },{ width: 13 },{ width: 13 },{ width: 13 },{ width: 13 },{ width: 13 },{ width: 13 }];

    const counts = { conforme:0, partiel:0, nc_mineure:0, nc_majeure:0, non_conforme:0, na:0 };
    let sumMat = 0, nMat = 0;
    for (const ev of evaluations) {
        const c = ev.conformite || 'na';
        if (c in counts) counts[c]++;
        if (ev.niveau_maturite != null && ev.niveau_maturite >= 0) { sumMat += ev.niveau_maturite; nMat++; }
    }
    const total   = evaluations.length;
    const matMoy  = nMat > 0 ? (sumMat / nMat).toFixed(1) : 'N/A';
    const tauxPct = total > 0 ? Math.round(counts.conforme / total * 100) : 0;
    const auditeurs = audit.auditeurs?.map(a => `${a.prenom} ${a.nom}`).join(', ') || '—';
    const periode   = audit.date_debut && audit.date_fin
        ? `${new Date(audit.date_debut).toLocaleDateString('fr-FR')} → ${new Date(audit.date_fin).toLocaleDateString('fr-FR')}`
        : '—';

    let r = 1;
    titleRow(ws, r++, 'RAPPORT D\'AUDIT DE SÉCURITÉ', 8, C.navy, 14);
    ws.addRow([]); r++;

    // ── Infos générales
    sectionRow(ws, r++, '1. Informations générales', 8);
    for (const [lbl, val] of [
        ['Nom de l\'audit', audit.nom || '—'],
        ['Entité / Client', audit.client || '—'],
        ['Référentiel', audit.referentiel?.nom || '—'],
        ['Phase', PHASE_LABELS[audit.phase] || audit.phase],
        ['Statut', STATUT_LABELS[audit.statut] || audit.statut],
        ['Période', periode],
        ['Auditeur(s)', auditeurs],
        ['Périmètre', audit.perimetre || '—'],
        ['Date d\'export', new Date().toLocaleDateString('fr-FR')],
    ]) { labelValue(ws, r++, lbl, val, 1, 7); }

    ws.addRow([]); r++;

    // ── KPIs
    sectionRow(ws, r++, '2. Indicateurs clés', 8);
    headerRow(ws, r, ['Mesures évaluées','Taux conformité','NC Majeures','Maturité moy.','Plans d\'actions','','',''], 18);
    r++;
    ws.getRow(r).height = 26;
    const kpiValues = [total, `${tauxPct} %`, counts.nc_majeure, matMoy, planActions.length];
    kpiValues.forEach((v, i) => {
        const cell = ws.getCell(r, i + 1);
        cell.value = v;
        applyCell(cell, { bg: C.light, fontColor: C.navy, bold: true, size: 13, align: 'center' });
    });
    ws.getRow(r).commit(); r++;
    ws.addRow([]); r++;

    // ── Synthèse conformité
    sectionRow(ws, r++, '3. Synthèse de conformité', 8);
    headerRow(ws, r, ['Niveau de conformité', 'Nb mesures', '% du total'], 16); r++;
    for (const key of CONF_KEYS) {
        ws.getRow(r).height = 22;
        const v = counts[key];
        const cs = confStyle(key);
        ['value','count','pct'].forEach((_, i) => {
            const cell = ws.getCell(r, i + 1);
            cell.value = i === 0 ? CONF_LABELS[key] : i === 1 ? v : (total ? `${Math.round(v / total * 100)} %` : '0 %');
            applyCell(cell, { ...cs, bold: i === 0, size: 10 });
        });
        ws.getRow(r).commit(); r++;
    }

    ws.addRow([]); r++;

    // ── Graphiques
    sectionRow(ws, r++, '4. Graphiques de conformité', 8);
    const chartRow = r - 1;
    if (imgs.donut) {
        const id = wb.addImage({ base64: imgs.donut, extension: 'png' });
        ws.addImage(id, { tl: { col: 0, row: chartRow }, ext: { width: 420, height: 420 } });
    }
    if (imgs.bar) {
        const id = wb.addImage({ base64: imgs.bar, extension: 'png' });
        ws.addImage(id, { tl: { col: 4, row: chartRow }, ext: { width: 500, height: 320 } });
    }
    for (let i = 0; i < 22; i++) { ws.addRow([]); r++; }
}

// ─── ONGLET 2 : Identification ────────────────────────────────────────────────
function addIdentificationSheet(wb, audit) {
    const ws = wb.addWorksheet('Identification entité');
    ws.columns = [{ width: 34 }, { width: 52 }];

    const rssi      = audit.rssi ? `${audit.rssi.prenom || ''} ${audit.rssi.nom || ''}`.trim() : '—';
    const auditeurs = audit.auditeurs?.map(a => `${a.prenom} ${a.nom}`).join(', ') || '—';

    let r = 1;
    titleRow(ws, r++, '1. Identification de l\'entité ou de l\'IIV', 2);
    ws.addRow([]); r++;

    sectionRow(ws, r++, 'Informations générales', 2);
    for (const [l, v] of [
        ['Dénomination', audit.client || '—'],
        ['Département d\'appartenance', '—'],
        ['Adresse', audit.entite?.adresse || '—'],
        ['Ville', audit.entite?.ville || '—'],
        ['Adresse du site web', audit.entite?.site_web || '—'],
    ]) { labelValue(ws, r++, l, v, 1, 1); }

    ws.addRow([]); r++;
    sectionRow(ws, r++, 'Responsable de la Sécurité des SI', 2);
    for (const [l, v] of [
        ['Nom et Prénom', rssi],
        ['Rattachement', '—'],
        ['e-mail', audit.rssi?.email || '—'],
        ['Téléphone', '—'],
    ]) { labelValue(ws, r++, l, v, 1, 1); }

    ws.addRow([]); r++;
    sectionRow(ws, r++, 'Gestion du document', 2);
    for (const [l, v] of [
        ['Auteur de l\'évaluation', auditeurs],
        ['Date de l\'évaluation', audit.date_debut ? new Date(audit.date_debut).toLocaleDateString('fr-FR') : '—'],
        ['Validé par', '—'],
        ['Date de validation', audit.date_fin ? new Date(audit.date_fin).toLocaleDateString('fr-FR') : '—'],
    ]) { labelValue(ws, r++, l, v, 1, 1); }
}

// ─── ONGLET 3 : Evaluation_MO_DNSSI ──────────────────────────────────────────
function addEvaluationSheet(wb, referentiel, evaluations) {
    const ws = wb.addWorksheet('Evaluation_MO_DNSSI');
    ws.columns = [
        { width: 26 }, // Chapitre
        { width: 32 }, // Objectif
        { width: 16 }, // Règle
        { width: 7  }, // Mat. (chiffre)
        { width: 16 }, // Libellé maturité
        { width: 22 }, // Conformité
        { width: 36 }, // Constat
        { width: 36 }, // Recommandation
    ];

    const evalMap = buildEvalMap(evaluations);
    const domaines = sortDomaines(referentiel?.domaines);

    let r = 1;
    titleRow(ws, r++, '2. Évaluation de la mise en œuvre des règles', 8);
    ws.addRow([]); r++;
    headerRow(ws, r, ['Chapitre','Objectif','Règle','Mat.','Libellé maturité','Conformité','Constat / Justificatif','Recommandation'], 20);
    r++;

    for (const domaine of domaines) {
        const domStart = r;
        const objectifs = [...(domaine.objectifs || [])].sort((a, b) =>
            (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
        );

        for (const objectif of objectifs) {
            const objStart = r;
            const mesures  = [...(objectif.mesures || [])].sort((a, b) =>
                (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
            );

            for (const mesure of mesures) {
                const ev  = evalMap[mesure.id];
                const niv = ev?.niveau_maturite;
                const ck  = ev?.conformite || 'na';
                const cs  = confStyle(ck);

                ws.getRow(r).height = 52;

                // Col 1 : Chapitre (sera fusionnée)
                const c1 = ws.getCell(r, 1);
                if (r === domStart) {
                    c1.value = domaine.nom || domaine.code || '';
                    applyCell(c1, { bg: C.navy, fontColor: C.white, bold: true, size: 9, align: 'center', valign: 'middle' });
                } else {
                    applyCell(c1, { bg: C.navy, fontColor: C.white, size: 9 });
                }

                // Col 2 : Objectif (sera fusionnée)
                const c2 = ws.getCell(r, 2);
                if (r === objStart) {
                    c2.value = objectif.description || objectif.code || '';
                    applyCell(c2, { bg: C.light, fontColor: C.navyMid, bold: false, size: 9, valign: 'middle' });
                } else {
                    applyCell(c2, { bg: C.light, fontColor: C.navyMid, size: 9 });
                }

                // Col 3 : Règle
                const c3 = ws.getCell(r, 3);
                c3.value = mesure.code || `M${mesure.id}`;
                applyCell(c3, { bg: C.white, fontColor: C.navy, bold: true, size: 9, align: 'center' });

                // Col 4 : Maturité (chiffre)
                const c4 = ws.getCell(r, 4);
                c4.value = (niv != null && niv >= 0) ? niv : '';
                applyCell(c4, { bg: C.white, fontColor: C.navy, size: 10, align: 'center', bold: true });

                // Col 5 : Libellé maturité
                const c5 = ws.getCell(r, 5);
                c5.value = (niv != null && niv >= 0) ? (MAT_SHORT[niv] || '') : 'N/A';
                applyCell(c5, { bg: C.white, size: 9 });

                // Col 6 : Conformité (colorée)
                const c6 = ws.getCell(r, 6);
                c6.value = CONF_LABELS[ck] || ck;
                applyCell(c6, { ...cs, bold: true, size: 9, align: 'center' });

                // Col 7 : Constat
                const c7 = ws.getCell(r, 7);
                c7.value = ev?.commentaire || '';
                applyCell(c7, { bg: C.white, size: 9 });

                // Col 8 : Recommandation
                const c8 = ws.getCell(r, 8);
                c8.value = ev?.recommandation || '';
                applyCell(c8, { bg: C.white, size: 9 });

                ws.getRow(r).commit();
                r++;
            }

            // Fusionner colonne Objectif pour cet objectif
            if (r > objStart + 1) {
                ws.mergeCells(objStart, 2, r - 1, 2);
            }
            ws.getCell(objStart, 2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }

        // Fusionner colonne Chapitre pour ce domaine
        if (r > domStart + 1) {
            ws.mergeCells(domStart, 1, r - 1, 1);
        }
        ws.getCell(domStart, 1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        // Ligne séparatrice entre domaines
        if (r <= domStart + 1 || domStart + 1 < r) {
            const sepRow = ws.getRow(r);
            ws.getRow(r - 1).eachCell({ includeEmpty: true }, (_, ci) => {
                const cell = ws.getCell(r - 1, ci);
                cell.border = { ...bdr(), bottom: thick() };
            });
        }
    }
}

// ─── ONGLET 4 : Synthèse maturité ────────────────────────────────────────────
async function addSyntheseMaturiteSheet(wb, evaluations, matBarImg) {
    const ws = wb.addWorksheet('Synthèse maturité');
    ws.columns = [{ width: 26 }, { width: 18 }, { width: 14 }];

    const counts = [0,0,0,0,0,0]; let na = 0;
    for (const ev of evaluations) {
        const n = ev.niveau_maturite;
        if (n != null && n >= 0 && n <= 5) counts[n]++; else na++;
    }
    const total = evaluations.length || 1;

    let r = 1;
    titleRow(ws, r++, '3. Synthèse du niveau de maturité', 3);
    ws.addRow([]); r++;
    headerRow(ws, r, ['État de maturité', 'Nombre de règles', '% des règles'], 16); r++;

    const matBg = ['FFF3F4F6','FFFEF3C7','FFFED7AA','FFDBEAFE','FFEDE9FE','FFF0FDF4'];
    const matFg = [C.gray,'FFCA8A04','FFEA580C','FF2563EB','FF7C3AED',C.greenFont];
    for (let i = 0; i < 6; i++) {
        ws.getRow(r).height = 24;
        [MAT_LABELS[i], counts[i], `${Math.round(counts[i]/total*100)} %`].forEach((v, ci) => {
            const cell = ws.getCell(r, ci + 1);
            cell.value = v;
            applyCell(cell, { bg: matBg[i], fontColor: matFg[i], bold: ci === 0, size: 10, align: ci > 0 ? 'center' : 'left' });
        });
        ws.getRow(r).commit(); r++;
    }
    ws.getRow(r).height = 20;
    [['N/A', na, `${Math.round(na/total*100)} %`]].forEach(([l,v,p]) => {
        [l,v,p].forEach((val, ci) => {
            const cell = ws.getCell(r, ci + 1);
            cell.value = val;
            applyCell(cell, { bg: C.light, fontColor: C.gray, size: 10, align: ci > 0 ? 'center' : 'left' });
        });
    });
    ws.getRow(r).commit(); r++;
    ws.addRow([]); r++;

    if (matBarImg) {
        sectionRow(ws, r++, 'Distribution par niveau de maturité', 3);
        const id = wb.addImage({ base64: matBarImg, extension: 'png' });
        ws.addImage(id, { tl: { col: 0, row: r - 1 }, ext: { width: 580, height: 350 } });
        for (let i = 0; i < 20; i++) { ws.addRow([]); r++; }
    }
}

// ─── ONGLET 5 : Synthèse conformité ───────────────────────────────────────────
async function addSyntheseConformiteSheet(wb, evaluations, confPieImg) {
    const ws = wb.addWorksheet('Synthèse conformité');
    ws.columns = [{ width: 26 }, { width: 18 }, { width: 14 }];

    const dnssi = { 'Non conforme':0, 'Partielle':0, 'Totale':0, 'N/A':0 };
    for (const ev of evaluations) {
        const m = CONF_DNSSI[ev.conformite || 'na'] || 'N/A';
        dnssi[m] = (dnssi[m] || 0) + 1;
    }
    const total = evaluations.length || 1;
    const dnssiBg   = { 'Non conforme':C.redLight, 'Partielle':C.orangeLight, 'Totale':C.greenLight, 'N/A':C.light };
    const dnssiFg   = { 'Non conforme':C.redFont,  'Partielle':C.orangeFont,  'Totale':C.greenFont,  'N/A':C.gray  };

    let r = 1;
    titleRow(ws, r++, '4. Synthèse du niveau de conformité à la DNSSI', 3);
    ws.addRow([]); r++;
    headerRow(ws, r, ['Niveau de conformité', 'Nb règles', '%'], 16); r++;

    for (const [k, v] of Object.entries(dnssi)) {
        ws.getRow(r).height = 24;
        [k, v, `${Math.round(v/total*100)} %`].forEach((val, ci) => {
            const cell = ws.getCell(r, ci + 1);
            cell.value = val;
            applyCell(cell, { bg: dnssiBg[k], fontColor: dnssiFg[k], bold: ci === 0, size: 10, align: ci > 0 ? 'center' : 'left' });
        });
        ws.getRow(r).commit(); r++;
    }
    ws.addRow([]); r++;

    if (confPieImg) {
        sectionRow(ws, r++, 'Répartition de la conformité', 3);
        const id = wb.addImage({ base64: confPieImg, extension: 'png' });
        ws.addImage(id, { tl: { col: 0, row: r - 1 }, ext: { width: 500, height: 433 } });
        for (let i = 0; i < 24; i++) { ws.addRow([]); r++; }
    }
}

// ─── ONGLET 6 : État d'avancement ─────────────────────────────────────────────
function addEtatAvancementSheet(wb, referentiel, evaluations, planActions) {
    const ws = wb.addWorksheet("État d'avancement");
    ws.columns = [
        { width: 26 }, { width: 30 }, { width: 16 }, { width: 16 }, { width: 8 },
        { width: 32 }, { width: 32 }, { width: 14 }, { width: 16 }, { width: 32 },
    ];

    const evalMap = buildEvalMap(evaluations);
    const planMap = buildPlanMap(planActions);
    const domaines = sortDomaines(referentiel?.domaines);

    let r = 1;
    titleRow(ws, r++, "5. État d'avancement de l'implémentation", 10);
    ws.addRow([]); r++;
    headerRow(ws, r, ['Chapitre','Objectif','Règle','Conformité','Mat.','Actions achevées','Actions programmées','Délai','État','Commentaires'], 24);
    r++;

    for (const domaine of domaines) {
        const domStart = r;
        const objectifs = [...(domaine.objectifs || [])].sort((a, b) =>
            (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
        );

        for (const objectif of objectifs) {
            const objStart = r;
            const mesures  = [...(objectif.mesures || [])].sort((a, b) =>
                (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
            );

            for (const mesure of mesures) {
                const ev    = evalMap[mesure.id];
                const plans = planMap[mesure.id] || [];
                const niv   = ev?.niveau_maturite;
                const ck    = ev?.conformite || 'na';
                const cs    = confStyle(ck);

                ws.getRow(r).height = 52;

                const c1 = ws.getCell(r, 1);
                if (r === domStart) c1.value = domaine.nom || domaine.code || '';
                applyCell(c1, { bg: C.navy, fontColor: C.white, bold: true, size: 9, align: 'center' });

                const c2 = ws.getCell(r, 2);
                if (r === objStart) c2.value = objectif.description || objectif.code || '';
                applyCell(c2, { bg: C.light, fontColor: C.navyMid, size: 9 });

                ws.getCell(r, 3).value = mesure.code || `M${mesure.id}`;
                applyCell(ws.getCell(r, 3), { bg: C.white, fontColor: C.navy, bold: true, size: 9, align: 'center' });

                ws.getCell(r, 4).value = CONF_DNSSI[ck] || 'N/A';
                applyCell(ws.getCell(r, 4), { ...cs, bold: true, size: 9, align: 'center' });

                ws.getCell(r, 5).value = (niv != null && niv >= 0) ? niv : '';
                applyCell(ws.getCell(r, 5), { bg: C.white, align: 'center', size: 10, bold: true });

                ws.getCell(r, 6).value  = plans.filter(p => p.statut === 'cloture').map(p => p.action_corrective || '').join('\n') || '';
                ws.getCell(r, 7).value  = plans.filter(p => p.statut !== 'cloture').map(p => p.action_corrective || '').join('\n') || '';
                ws.getCell(r, 8).value  = plans.filter(p => p.delai).map(p => new Date(p.delai).toLocaleDateString('fr-FR')).join(', ') || '';
                ws.getCell(r, 9).value  = [...new Set(plans.map(p => STATUT_PLAN[p.statut] || p.statut))].join(', ') || '—';
                ws.getCell(r, 10).value = plans.map(p => p.description_nc || '').filter(Boolean).join('\n') || '';

                for (let ci = 6; ci <= 10; ci++) applyCell(ws.getCell(r, ci), { bg: C.white, size: 9 });

                ws.getRow(r).commit(); r++;
            }

            if (r > objStart + 1) ws.mergeCells(objStart, 2, r - 1, 2);
            ws.getCell(objStart, 2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }

        if (r > domStart + 1) ws.mergeCells(domStart, 1, r - 1, 1);
        ws.getCell(domStart, 1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    }
}

// ─── EXPORT PRINCIPAL ─────────────────────────────────────────────────────────
export async function exportAuditReportExcel({ audit, evaluations, planActions, soaEntries, referentiel }) {
    // Calcul des données pour les graphiques
    const cCounts = { conforme:0, partiel:0, nc_mineure:0, nc_majeure:0, non_conforme:0, na:0 };
    for (const ev of evaluations) { const c = ev.conformite||'na'; if(c in cCounts) cCounts[c]++; }
    const matCounts = [0,0,0,0,0,0];
    for (const ev of evaluations) { const n=ev.niveau_maturite; if(n!=null&&n>=0&&n<=5) matCounts[n]++; }
    const dnssiCounts = {'Non conforme':0,'Partielle':0,'Totale':0,'N/A':0};
    for (const ev of evaluations) { const m=CONF_DNSSI[ev.conformite||'na']||'N/A'; dnssiCounts[m]++; }

    const legendFont = { size: 15, family: 'Calibri' };
    const tickFont   = { size: 14, family: 'Calibri' };
    const chartBase  = { responsive: false, animation: false, layout: { padding: 16 } };

    const [donut, bar, matBar, confPie] = await Promise.all([
        // Donut conformité — canvas 900×900
        chartToPNG({ type:'doughnut', data:{ labels:CONF_LABELS_SHORT, datasets:[{ data:CONF_KEYS.map(k=>cCounts[k]), backgroundColor:CONF_COLORS, borderWidth:3 }] }, options:{ ...chartBase, cutout:'65%', plugins:{ legend:{ position:'right', labels:{ font:legendFont, padding:16, boxWidth:18 } }, tooltip:{enabled:false} } } }, 900, 900),

        // Bar conformité horizontal — canvas 1100×700
        chartToPNG({ type:'bar', data:{ labels:CONF_LABELS_SHORT, datasets:[{ data:CONF_KEYS.map(k=>cCounts[k]), backgroundColor:CONF_COLORS, borderRadius:6, borderSkipped:false }] }, options:{ ...chartBase, indexAxis:'y', plugins:{ legend:{display:false} }, scales:{ x:{beginAtZero:true,grid:{color:'#f3f4f6'},ticks:{font:tickFont}}, y:{grid:{display:false},ticks:{font:{...tickFont,weight:'600'}}} } } }, 1100, 700),

        // Bar maturité — canvas 1100×660
        chartToPNG({ type:'bar', data:{ labels:MAT_SHORT, datasets:[{ data:matCounts, backgroundColor:MAT_COLORS, borderRadius:6, borderSkipped:false }] }, options:{ ...chartBase, plugins:{ legend:{display:false} }, scales:{ y:{beginAtZero:true,grid:{color:'#f3f4f6'},ticks:{font:tickFont}}, x:{grid:{display:false},ticks:{font:tickFont}} } } }, 1100, 660),

        // Pie conformité DNSSI — canvas 900×780
        chartToPNG({ type:'pie', data:{ labels:Object.keys(dnssiCounts), datasets:[{ data:Object.values(dnssiCounts), backgroundColor:['#dc2626','#f97316','#16a34a','#9ca3af'], borderWidth:3 }] }, options:{ ...chartBase, plugins:{ legend:{ position:'right', labels:{ font:legendFont, padding:18, boxWidth:18 } }, tooltip:{enabled:false} } } }, 900, 780),
    ]);

    const wb    = new ExcelJS.Workbook();
    wb.creator  = 'DataProtect';
    wb.created  = new Date();

    await addSyntheseSheet(wb, audit, evaluations, planActions, { donut, bar });
    addIdentificationSheet(wb, audit);
    addEvaluationSheet(wb, referentiel, evaluations);
    await addSyntheseMaturiteSheet(wb, evaluations, matBar);
    await addSyntheseConformiteSheet(wb, evaluations, confPie);
    addEtatAvancementSheet(wb, referentiel, evaluations, planActions);

    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href = url; a.download = `rapport-audit-${(audit.nom||'audit').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${new Date().getFullYear()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}
