import ExcelJS from 'exceljs';
import Chart from 'chart.js/auto';

// ─── COULEURS BRAND ───────────────────────────────────────────────────────────
const C = {
    navy:       'FF1E293B',
    red:        'FFCC0000',
    white:      'FFFFFFFF',
    light:      'FFF8FAFC',
    border:     'FFE2E8F0',
    gray:       'FF6B7280',
    green:      'FF16A34A',
    orange:     'FFEA580C',
    redLight:   'FFFEE2E2',
    orangeLight:'FFFEF3C7',
    greenLight: 'FFF0FDF4',
};

const PHASE_LABELS  = { cadrage:'Cadrage', prerequis:'Prérequis', revue_documentaire:'Revue documentaire', realisation:'Réalisation', termine:'Terminé' };
const STATUT_LABELS = { brouillon:'Brouillon', en_cours:'En cours', termine:'Terminé', archive:'Archivé' };
const CONF_LABELS   = { conforme:'Conforme', partiel:'Partiellement conforme', non_conforme:'Non conforme', nc_mineure:'NC Mineure', nc_majeure:'NC Majeure', na:'N/A' };
const MAT_LABELS    = ['Aucun', 'Initial', 'Reproductible', 'Défini', 'Maîtrisé', 'Optimisé'];
const STATUT_PLAN   = { a_faire:'À faire', en_cours:'En cours', cloture:'Clôturé' };
const CONF_DNSSI    = { conforme:'Totale', partiel:'Partielle', non_conforme:'Non conforme', nc_mineure:'Non conforme', nc_majeure:'Non conforme', na:'N/A' };

const CONF_COLORS_HEX = ['#16a34a','#ca8a04','#ea580c','#dc2626','#991b1b','#9ca3af'];
const CONF_KEYS       = ['conforme','partiel','nc_mineure','nc_majeure','non_conforme','na'];
const CONF_LABELS_SHORT = ['Conforme','Partiel','NC Min.','NC Maj.','Non conforme','N/A'];
const MAT_COLORS_HEX  = ['#9ca3af','#f59e0b','#f97316','#3b82f6','#8b5cf6','#16a34a'];

// ─── UTILITAIRES ──────────────────────────────────────────────────────────────
function buildMesureMap(referentiel) {
    const map = {};
    for (const d of referentiel?.domaines || [])
        for (const o of d.objectifs || [])
            for (const m of o.mesures || [])
                map[m.id] = { mesure: m, objectif: o, domaine: d };
    return map;
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
        await new Promise(r => setTimeout(r, 100));
        const ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, wPx, hPx);
        ctx.globalCompositeOperation = 'source-over';
        const url = canvas.toDataURL('image/png', 1.0);
        chart.destroy();
        return url.split(',')[1]; // base64 only (sans le prefix data:...)
    } finally {
        if (document.body.contains(canvas)) document.body.removeChild(canvas);
    }
}

// ─── HELPERS STYLE EXCELJS ────────────────────────────────────────────────────
function thin(color = C.border) { return { style: 'thin', color: { argb: color } }; }
function borders(color = C.border) { return { top: thin(color), bottom: thin(color), left: thin(color), right: thin(color) }; }

function cellStyle(ws, addr, { bg, font, bold, size, align, wrap, border: brd } = {}) {
    const cell = ws.getCell(addr);
    if (bg)    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    if (font)  cell.font  = { color: { argb: font }, bold: bold !== false, size: size || 10 };
    else if (bold !== undefined || size) cell.font = { bold: !!bold, size: size || 10 };
    if (brd !== false) cell.border = brd || borders();
    cell.alignment = { horizontal: align || 'left', vertical: 'middle', wrapText: wrap !== false };
    return cell;
}

function setRowStyle(ws, rowNum, bg, fontColor = C.white, bold = true) {
    const row = ws.getRow(rowNum);
    row.eachCell({ includeEmpty: true }, cell => {
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.font   = { bold, color: { argb: fontColor }, size: 10 };
        cell.border = borders();
        cell.alignment = { vertical: 'middle', wrapText: true };
    });
    row.commit();
}

function setDataRow(ws, rowNum, isAlt = false) {
    const row = ws.getRow(rowNum);
    row.eachCell({ includeEmpty: true }, cell => {
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? C.light : C.white } };
        cell.border = borders();
        cell.alignment = { vertical: 'top', wrapText: true };
    });
    row.commit();
}

function titleRow(ws, rowNum, text, colSpan, bg = C.navy) {
    ws.getRow(rowNum).height = 22;
    const cell = ws.getCell(rowNum, 1);
    cell.value = text;
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font  = { bold: true, color: { argb: C.white }, size: 12 };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.mergeCells(rowNum, 1, rowNum, colSpan);
}

function sectionRow(ws, rowNum, text, colSpan) {
    ws.getRow(rowNum).height = 18;
    const cell = ws.getCell(rowNum, 1);
    cell.value = text;
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.red } };
    cell.font  = { bold: true, color: { argb: C.white }, size: 10 };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.mergeCells(rowNum, 1, rowNum, colSpan);
}

function labelValueRow(ws, rowNum, label, value, colSpan = 2) {
    ws.getRow(rowNum).height = 16;
    const lc = ws.getCell(rowNum, 1);
    lc.value = label;
    lc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.light } };
    lc.font  = { bold: true, color: { argb: C.navy.replace('FF','') }, size: 9 };
    lc.border = borders();
    lc.alignment = { vertical: 'middle' };

    ws.mergeCells(rowNum, 2, rowNum, colSpan + 1);
    const vc = ws.getCell(rowNum, 2);
    vc.value = value;
    vc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.white } };
    vc.font  = { size: 9 };
    vc.border = borders();
    vc.alignment = { vertical: 'middle', wrapText: true };
}

// ─── ONGLET 1 : Synthèse ──────────────────────────────────────────────────────
async function addSyntheseSheet(wb, audit, evaluations, planActions, donutImg, barImg) {
    const ws = wb.addWorksheet('Synthèse');
    ws.columns = [
        { width: 32 }, { width: 22 }, { width: 14 }, { width: 14 },
        { width: 14 }, { width: 14 }, { width: 14 },
    ];

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
    titleRow(ws, r++, 'RAPPORT D\'AUDIT DE SÉCURITÉ', 7);
    ws.addRow([]);  r++;

    // Infos générales
    sectionRow(ws, r++, '1. Informations générales', 7);
    const infoItems = [
        ['Nom de l\'audit',    audit.nom       || '—'],
        ['Entité / Client',    audit.client    || '—'],
        ['Référentiel',        audit.referentiel?.nom || '—'],
        ['Phase',              PHASE_LABELS[audit.phase]   || audit.phase],
        ['Statut',             STATUT_LABELS[audit.statut] || audit.statut],
        ['Période',            periode],
        ['Auditeur(s)',        auditeurs],
        ['Périmètre',          audit.perimetre || '—'],
        ['Date d\'export',     new Date().toLocaleDateString('fr-FR')],
    ];
    for (const [lbl, val] of infoItems) {
        labelValueRow(ws, r++, lbl, val, 6);
    }
    ws.addRow([]);  r++;

    // KPIs
    sectionRow(ws, r++, '2. Indicateurs clés', 7);
    ws.getRow(r).height = 14;
    ws.getCell(r, 1).value = 'Mesures évaluées';
    ws.getCell(r, 2).value = 'Taux conformité';
    ws.getCell(r, 3).value = 'Maturité moy.';
    ws.getCell(r, 4).value = 'NC Majeures';
    ws.getCell(r, 5).value = 'Plans d\'actions';
    setRowStyle(ws, r, C.navy); r++;

    ws.getRow(r).height = 20;
    ws.getCell(r, 1).value = total;
    ws.getCell(r, 2).value = `${tauxPct} %`;
    ws.getCell(r, 3).value = matMoy;
    ws.getCell(r, 4).value = counts.nc_majeure;
    ws.getCell(r, 5).value = planActions.length;
    setDataRow(ws, r); r++;
    ws.addRow([]);  r++;

    // Tableau conformité
    sectionRow(ws, r++, '3. Synthèse de conformité', 7);
    ws.getRow(r).height = 14;
    ['Niveau de conformité', 'Nb mesures', '% du total'].forEach((h, i) => { ws.getCell(r, i + 1).value = h; });
    setRowStyle(ws, r, C.navy); r++;

    const confBg = {
        conforme:     C.greenLight,
        partiel:      C.orangeLight,
        nc_mineure:   C.orangeLight,
        nc_majeure:   C.redLight,
        non_conforme: C.redLight,
        na:           C.light,
    };
    const confFont = {
        conforme:'FF15803D', partiel:'FF92400E', nc_mineure:'FF92400E',
        nc_majeure:'FF991B1B', non_conforme:'FF991B1B', na:C.gray,
    };

    for (const [i, key] of CONF_KEYS.entries()) {
        const v = counts[key];
        ws.getRow(r).height = 15;
        ws.getCell(r, 1).value = CONF_LABELS[key];
        ws.getCell(r, 2).value = v;
        ws.getCell(r, 3).value = total ? `${Math.round(v / total * 100)} %` : '0 %';
        for (let c = 1; c <= 3; c++) {
            const cell = ws.getCell(r, c);
            cell.fill   = { type:'pattern', pattern:'solid', fgColor:{ argb: confBg[key] } };
            cell.font   = { color:{ argb: confFont[key] }, bold: c === 1 };
            cell.border = borders();
            cell.alignment = { vertical:'middle' };
        }
        ws.getRow(r).commit(); r++;
    }
    ws.addRow([]); r++;

    // Graphiques
    const chartRow = r;
    sectionRow(ws, r++, '4. Graphiques', 7);

    if (donutImg) {
        const imgId = wb.addImage({ base64: donutImg, extension: 'png' });
        ws.addImage(imgId, { tl: { col: 0, row: r - 1 }, ext: { width: 260, height: 260 } });
    }
    if (barImg) {
        const imgId = wb.addImage({ base64: barImg, extension: 'png' });
        ws.addImage(imgId, { tl: { col: 4, row: r - 1 }, ext: { width: 340, height: 260 } });
    }
    // Réserver de la place pour les graphiques
    for (let i = 0; i < 15; i++) { ws.addRow([]); r++; }
}

// ─── ONGLET 2 : Identification ────────────────────────────────────────────────
function addIdentificationSheet(wb, audit) {
    const ws = wb.addWorksheet('Identification entité');
    ws.columns = [{ width: 32 }, { width: 50 }];

    const rssi      = audit.rssi ? `${audit.rssi.prenom || ''} ${audit.rssi.nom || ''}`.trim() : '—';
    const auditeurs = audit.auditeurs?.map(a => `${a.prenom} ${a.nom}`).join(', ') || '—';

    let r = 1;
    titleRow(ws, r++, '1. Identification de l\'entité ou de l\'IIV', 2);
    ws.addRow([]); r++;

    sectionRow(ws, r++, 'Informations générales', 2);
    for (const [lbl, val] of [
        ['Dénomination',            audit.client             || '—'],
        ['Département d\'appartenance', '—'],
        ['Adresse',                 audit.entite?.adresse    || '—'],
        ['Ville',                   audit.entite?.ville      || '—'],
        ['Adresse du site web',     audit.entite?.site_web   || '—'],
    ]) { labelValueRow(ws, r++, lbl, val, 1); }

    ws.addRow([]); r++;
    sectionRow(ws, r++, 'Responsable de la Sécurité des SI', 2);
    for (const [lbl, val] of [
        ['Nom et Prénom',   rssi],
        ['Rattachement',    '—'],
        ['e-mail',          audit.rssi?.email || '—'],
        ['Téléphone',       '—'],
    ]) { labelValueRow(ws, r++, lbl, val, 1); }

    ws.addRow([]); r++;
    sectionRow(ws, r++, 'Gestion du document', 2);
    for (const [lbl, val] of [
        ['Auteur de l\'évaluation', auditeurs],
        ['Date de l\'évaluation',  audit.date_debut ? new Date(audit.date_debut).toLocaleDateString('fr-FR') : '—'],
        ['Validé par',             '—'],
        ['Date de validation',     audit.date_fin   ? new Date(audit.date_fin).toLocaleDateString('fr-FR')   : '—'],
    ]) { labelValueRow(ws, r++, lbl, val, 1); }
}

// ─── ONGLET 3 : Evaluation_MO_DNSSI ──────────────────────────────────────────
function addEvaluationSheet(wb, referentiel, evaluations) {
    const ws = wb.addWorksheet('Evaluation_MO_DNSSI');
    ws.columns = [
        { width: 30 }, { width: 36 }, { width: 18 },
        { width: 8  }, { width: 16 }, { width: 22 },
        { width: 35 }, { width: 35 },
    ];

    const evalMap = buildEvalMap(evaluations);
    let r = 1;
    titleRow(ws, r++, '2. Evaluation de la mise en œuvre des règles de la DNSSI', 8);
    ws.addRow([]); r++;

    ws.getRow(r).height = 14;
    ['Chapitre','Objectif','Règle','Mat.','Libellé maturité','Conformité','Constat / Justificatif','Recommandation']
        .forEach((h, i) => { ws.getCell(r, i + 1).value = h; });
    setRowStyle(ws, r, C.navy); r++;

    const confBgEv = { conforme:C.greenLight, partiel:C.orangeLight, nc_mineure:C.orangeLight, nc_majeure:C.redLight, non_conforme:C.redLight, na:C.light };
    const confFontEv = { conforme:'FF15803D', partiel:'FF92400E', nc_mineure:'FF92400E', nc_majeure:'FF991B1B', non_conforme:'FF991B1B', na:C.gray };

    let alt = false;
    for (const domaine of referentiel?.domaines || []) {
        let firstDom = true;
        for (const objectif of domaine.objectifs || []) {
            let firstObj = true;
            for (const mesure of objectif.mesures || []) {
                const ev  = evalMap[mesure.id];
                const niv = ev?.niveau_maturite;
                const ck  = ev?.conformite || 'na';

                ws.getRow(r).height = 28;
                ws.getCell(r, 1).value = firstDom ? `${domaine.code} — ${domaine.nom || ''}` : '';
                ws.getCell(r, 2).value = firstObj ? (objectif.description || objectif.code || '') : '';
                ws.getCell(r, 3).value = mesure.code || `M${mesure.id}`;
                ws.getCell(r, 4).value = (niv != null && niv >= 0) ? niv : '';
                ws.getCell(r, 5).value = (niv != null && niv >= 0) ? (MAT_LABELS[niv] || '') : 'N/A';
                ws.getCell(r, 6).value = ev ? (CONF_LABELS[ck] || ck) : 'N/A';
                ws.getCell(r, 7).value = ev?.commentaire    || '';
                ws.getCell(r, 8).value = ev?.recommandation || '';

                setDataRow(ws, r, alt);

                // Colorisation colonne conformité
                const confCell = ws.getCell(r, 6);
                confCell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: confBgEv[ck] || C.light } };
                confCell.font = { color:{ argb: confFontEv[ck] || C.gray }, bold: true };

                // Domaine en gras navy
                if (firstDom) {
                    const dc = ws.getCell(r, 1);
                    dc.font = { bold: true, color:{ argb: 'FF1E293B' } };
                }

                ws.getRow(r).commit();
                firstDom = false; firstObj = false; alt = !alt; r++;
            }
        }
    }
}

// ─── ONGLET 4 : Synthèse maturité ────────────────────────────────────────────
async function addSyntheseMaturiteSheet(wb, evaluations, matBarImg) {
    const ws = wb.addWorksheet('Synthèse maturité');
    ws.columns = [{ width: 22 }, { width: 18 }, { width: 14 }];

    const counts = [0,0,0,0,0,0]; let na = 0;
    for (const ev of evaluations) {
        const n = ev.niveau_maturite;
        if (n != null && n >= 0 && n <= 5) counts[n]++; else na++;
    }
    const total = evaluations.length || 1;

    let r = 1;
    titleRow(ws, r++, '3. Synthèse du niveau de maturité', 3);
    ws.addRow([]); r++;

    ws.getRow(r).height = 14;
    ['État de maturité','Nombre de règles','% des règles'].forEach((h, i) => { ws.getCell(r, i + 1).value = h; });
    setRowStyle(ws, r, C.navy); r++;

    for (let i = 0; i < 6; i++) {
        ws.getRow(r).height = 15;
        ws.getCell(r, 1).value = MAT_LABELS[i];
        ws.getCell(r, 2).value = counts[i];
        ws.getCell(r, 3).value = `${Math.round(counts[i] / total * 100)} %`;
        setDataRow(ws, r, i % 2 === 1); r++;
    }
    ws.getRow(r).height = 15;
    ws.getCell(r, 1).value = 'N/A';
    ws.getCell(r, 2).value = na;
    ws.getCell(r, 3).value = `${Math.round(na / total * 100)} %`;
    setDataRow(ws, r, true); r++;
    ws.addRow([]); r++;

    if (matBarImg) {
        sectionRow(ws, r++, 'Distribution par niveau de maturité', 3);
        const imgId = wb.addImage({ base64: matBarImg, extension: 'png' });
        ws.addImage(imgId, { tl: { col: 0, row: r - 1 }, ext: { width: 400, height: 260 } });
        for (let i = 0; i < 14; i++) { ws.addRow([]); r++; }
    }
}

// ─── ONGLET 5 : Synthèse conformité ───────────────────────────────────────────
async function addSyntheseConformiteSheet(wb, evaluations, confPieImg) {
    const ws = wb.addWorksheet('Synthèse conformité');
    ws.columns = [{ width: 28 }, { width: 18 }, { width: 14 }];

    const dnssiCounts = { 'Non conforme':0, 'Partielle':0, 'Totale':0, 'N/A':0 };
    for (const ev of evaluations) {
        const mapped = CONF_DNSSI[ev.conformite || 'na'] || 'N/A';
        dnssiCounts[mapped] = (dnssiCounts[mapped] || 0) + 1;
    }
    const total = evaluations.length || 1;
    const bgMap = { 'Non conforme':C.redLight, 'Partielle':C.orangeLight, 'Totale':C.greenLight, 'N/A':C.light };
    const fgMap = { 'Non conforme':'FF991B1B', 'Partielle':'FF92400E', 'Totale':'FF15803D', 'N/A':C.gray };

    let r = 1;
    titleRow(ws, r++, '4. Synthèse du niveau de conformité à la DNSSI', 3);
    ws.addRow([]); r++;

    ws.getRow(r).height = 14;
    ['Niveau de conformité','Nb règles','%'].forEach((h, i) => { ws.getCell(r, i + 1).value = h; });
    setRowStyle(ws, r, C.navy); r++;

    for (const [k, v] of Object.entries(dnssiCounts)) {
        ws.getRow(r).height = 15;
        for (let c = 1; c <= 3; c++) {
            const cell = ws.getCell(r, c);
            cell.value  = c === 1 ? k : c === 2 ? v : `${Math.round(v / total * 100)} %`;
            cell.fill   = { type:'pattern', pattern:'solid', fgColor:{ argb: bgMap[k] } };
            cell.font   = { color:{ argb: fgMap[k] }, bold: c === 1 };
            cell.border = borders();
            cell.alignment = { vertical:'middle' };
        }
        ws.getRow(r).commit(); r++;
    }
    ws.addRow([]); r++;

    if (confPieImg) {
        sectionRow(ws, r++, 'Répartition de la conformité', 3);
        const imgId = wb.addImage({ base64: confPieImg, extension: 'png' });
        ws.addImage(imgId, { tl: { col: 0, row: r - 1 }, ext: { width: 360, height: 260 } });
        for (let i = 0; i < 14; i++) { ws.addRow([]); r++; }
    }
}

// ─── ONGLET 6 : État d'avancement ─────────────────────────────────────────────
function addEtatAvancementSheet(wb, referentiel, evaluations, planActions) {
    const ws = wb.addWorksheet("État d'avancement");
    ws.columns = [
        { width: 28 }, { width: 32 }, { width: 18 }, { width: 16 }, { width: 8 },
        { width: 30 }, { width: 30 }, { width: 14 }, { width: 18 }, { width: 30 },
    ];

    const evalMap = buildEvalMap(evaluations);
    const planMap = buildPlanMap(planActions);

    let r = 1;
    titleRow(ws, r++, "5. État d'avancement de l'implémentation", 10);
    ws.addRow([]); r++;

    ws.getRow(r).height = 28;
    ['Chapitre','Objectif','Règle','Conformité','Mat.','Actions achevées','Actions programmées','Délai','État','Commentaires']
        .forEach((h, i) => { ws.getCell(r, i + 1).value = h; });
    setRowStyle(ws, r, C.navy); r++;

    let alt = false;
    for (const domaine of referentiel?.domaines || []) {
        let firstDom = true;
        for (const objectif of domaine.objectifs || []) {
            let firstObj = true;
            for (const mesure of objectif.mesures || []) {
                const ev    = evalMap[mesure.id];
                const plans = planMap[mesure.id] || [];
                const niv   = ev?.niveau_maturite;
                const ck    = ev?.conformite || 'na';

                const achevees    = plans.filter(p => p.statut === 'cloture').map(p => p.action_corrective || '').join(' | ') || '';
                const programmees = plans.filter(p => p.statut !== 'cloture').map(p => p.action_corrective || '').join(' | ') || '';
                const delais      = plans.filter(p => p.delai).map(p => new Date(p.delai).toLocaleDateString('fr-FR')).join(', ') || '';
                const etats       = [...new Set(plans.map(p => STATUT_PLAN[p.statut] || p.statut))].join(', ') || '—';
                const commentaires = plans.map(p => p.description_nc || '').filter(Boolean).join(' | ') || '';

                ws.getRow(r).height = 28;
                ws.getCell(r, 1).value = firstDom ? `${domaine.code} — ${domaine.nom || ''}` : '';
                ws.getCell(r, 2).value = firstObj ? (objectif.description || objectif.code || '') : '';
                ws.getCell(r, 3).value = mesure.code || `M${mesure.id}`;
                ws.getCell(r, 4).value = CONF_DNSSI[ck] || 'N/A';
                ws.getCell(r, 5).value = (niv != null && niv >= 0) ? niv : '';
                ws.getCell(r, 6).value = achevees;
                ws.getCell(r, 7).value = programmees;
                ws.getCell(r, 8).value = delais;
                ws.getCell(r, 9).value = etats;
                ws.getCell(r, 10).value = commentaires;

                setDataRow(ws, r, alt);

                if (firstDom) { ws.getCell(r, 1).font = { bold: true }; }

                ws.getRow(r).commit();
                firstDom = false; firstObj = false; alt = !alt; r++;
            }
        }
    }
}

// ─── EXPORT PRINCIPAL ─────────────────────────────────────────────────────────
export async function exportAuditReportExcel({ audit, evaluations, planActions, soaEntries, referentiel }) {
    const wb   = new ExcelJS.Workbook();
    wb.creator  = 'DataProtect';
    wb.created  = new Date();

    // Générer les graphiques
    const [donutImg, barImg, matBarImg, confPieImg] = await Promise.all([
        chartToPNG({
            type: 'doughnut',
            data: {
                labels: CONF_LABELS_SHORT,
                datasets: [{ data: CONF_KEYS.map(k => { const c={conforme:0,partiel:0,nc_mineure:0,nc_majeure:0,non_conforme:0,na:0}; for(const ev of evaluations){const ck=ev.conformite||'na'; if(ck in c) c[ck]++;} return c[k]; }), backgroundColor: CONF_COLORS_HEX, borderWidth: 2 }],
            },
            options: { plugins: { legend: { position:'right', labels:{font:{size:11}} } } },
        }, 480, 320),

        chartToPNG({
            type: 'bar',
            data: {
                labels: CONF_LABELS_SHORT,
                datasets: [{ data: (() => { const c={conforme:0,partiel:0,nc_mineure:0,nc_majeure:0,non_conforme:0,na:0}; for(const ev of evaluations){const ck=ev.conformite||'na'; if(ck in c) c[ck]++;} return CONF_KEYS.map(k=>c[k]); })(), backgroundColor: CONF_COLORS_HEX, borderRadius: 4 }],
            },
            options: { plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,grid:{color:'#f3f4f6'}},x:{grid:{display:false}}}, layout:{padding:10} },
        }, 560, 320),

        chartToPNG({
            type: 'bar',
            data: {
                labels: MAT_LABELS,
                datasets: [{ data: (() => { const c=[0,0,0,0,0,0]; for(const ev of evaluations){const n=ev.niveau_maturite; if(n!=null&&n>=0&&n<=5)c[n]++;} return c; })(), backgroundColor: MAT_COLORS_HEX, borderRadius: 4 }],
            },
            options: { plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,grid:{color:'#f3f4f6'}},x:{grid:{display:false}}}, layout:{padding:10} },
        }, 560, 280),

        chartToPNG({
            type: 'pie',
            data: {
                labels: ['Non conforme','Partielle','Totale','N/A'],
                datasets: [{ data: (() => { const d={'Non conforme':0,'Partielle':0,'Totale':0,'N/A':0}; for(const ev of evaluations){const m=CONF_DNSSI[ev.conformite||'na']||'N/A'; d[m]++;} return Object.values(d); })(), backgroundColor:['#dc2626','#f97316','#16a34a','#9ca3af'], borderWidth:2 }],
            },
            options: { plugins:{legend:{position:'right',labels:{font:{size:11}}}} },
        }, 480, 280),
    ]);

    await addSyntheseSheet(wb, audit, evaluations, planActions, donutImg, barImg);
    addIdentificationSheet(wb, audit);
    addEvaluationSheet(wb, referentiel, evaluations);
    await addSyntheseMaturiteSheet(wb, evaluations, matBarImg);
    await addSyntheseConformiteSheet(wb, evaluations, confPieImg);
    addEtatAvancementSheet(wb, referentiel, evaluations, planActions);

    const buffer   = await wb.xlsx.writeBuffer();
    const blob     = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement('a');
    a.href         = url;
    a.download     = `rapport-audit-${(audit.nom || 'audit').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().getFullYear()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}
