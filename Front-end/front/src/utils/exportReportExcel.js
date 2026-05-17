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

const ISO_CONF_KEYS   = ['conforme','nc_mineure','nc_majeure','partiel','na'];
const ISO_CONF_SHORT  = ['Conforme','NC Mineure','NC Majeure','Partiel','N/A'];
const ISO_CONF_COLORS = ['#16a34a','#ea580c','#dc2626','#ca8a04','#9ca3af'];

const SOA_STATUT_LABELS = { implemente:'Implémenté', planifie:'Planifié', partiel:'Partiel', non_implemente:'Non implémenté' };

function getReferentielType(referentiel) {
    const type = (referentiel?.type || '').toUpperCase();
    const nom  = (referentiel?.nom  || '').toLowerCase();
    if (type === 'DNSSI' || nom.includes('dnssi') || nom.includes('directive nationale')) return 'dnssi';
    return 'iso27001';
}

// ─── UTILITAIRES DONNÉES ──────────────────────────────────────────────────────
function stripObjPrefix(text) {
    if (!text) return '';
    return text.replace(/^Objectif\s+\d+\s*:\s*/i, '').trim() || text;
}

// Hauteur d'une ligne selon le texte le plus long parmi plusieurs cellules
// Estimation conservative : 0.9 char/unit (Calibri 9pt, marges incluses)
// 22 pts par ligne, minimum 60 pts pour toute cellule avec contenu
// Chaque tranche de 60 caractères = une ligne supplémentaire, 28pt par ligne
function calcRowHeight(text, colWidthChars, minH = 150) {
    if (!text || !String(text).trim()) return minH;
    const charsPerLine = Math.max(8, Math.floor(colWidthChars * 0.75));
    const lines = String(text).split('\n').reduce(
        (sum, seg) => sum + Math.max(1, Math.ceil(seg.length / charsPerLine)), 0
    );
    return Math.max(minH, Math.min(lines * 28 + 20, 800));
}
function measureRowHeight(ev, constatW, recommW, minH = 150) {
    return Math.max(
        calcRowHeight(ev?.commentaire,    constatW, minH),
        calcRowHeight(ev?.recommandation, recommW,  minH),
        minH
    );
}

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

function titleRow(ws, r, text, span, bg = C.navy, size = 16) {
    ws.getRow(r).height = 56;
    const cell = ws.getCell(r, 1);
    cell.value = text;
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font  = { name: FONT, bold: true, color: { argb: C.white }, size };
    cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 2 };
    if (span > 1) ws.mergeCells(r, 1, r, span);
}

function sectionRow(ws, r, text, span) {
    ws.getRow(r).height = 40;
    const cell = ws.getCell(r, 1);
    cell.value = text;
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.red } };
    cell.font  = { name: FONT, bold: true, color: { argb: C.white }, size: 12 };
    cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 2 };
    if (span > 1) ws.mergeCells(r, 1, r, span);
}

function headerRow(ws, r, labels) {
    ws.getRow(r).height = 44;
    labels.forEach((lbl, i) => {
        const cell = ws.getCell(r, i + 1);
        cell.value = lbl;
        applyCell(cell, { bg: C.navyMid, fontColor: C.white, bold: true, size: 11, align: 'center', valign: 'middle', wrap: true });
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
    headerRow(ws, r, ['Mesures évaluées','Taux conformité','NC Majeures','Maturité moy.','Plans d\'actions','','','']);
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
    headerRow(ws, r, ['Niveau de conformité', 'Nb mesures', '% du total']); r++;
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
        { width: 55 }, // Constat / Justificatif
        { width: 55 }, // Recommandation
    ];

    const evalMap = buildEvalMap(evaluations);
    const domaines = sortDomaines(referentiel?.domaines);

    let r = 1;
    titleRow(ws, r++, '2. Évaluation de la mise en œuvre des règles', 8);
    ws.addRow([]); r++;
    headerRow(ws, r, ['Chapitre','Objectif','Règle','Mat.','Libellé maturité','Conformité','Constat / Justificatif','Recommandation']);
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

                ws.getRow(r).height = measureRowHeight(ev, 55, 55);

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
                    c2.value = stripObjPrefix(objectif.description) || objectif.code || '';
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
async function addSyntheseMaturiteSheet(wb, evaluations, matBarImg, referentiel) {
    const ws = wb.addWorksheet('Synthèse maturité');
    ws.columns = [
        { width: 40 }, { width: 12 }, { width: 12 }, { width: 15 },
        { width: 12 }, { width: 13 }, { width: 13 }, { width: 10 },
    ];

    const counts = [0,0,0,0,0,0]; let na = 0;
    for (const ev of evaluations) {
        const n = ev.niveau_maturite;
        if (n != null && n >= 0 && n <= 5) counts[n]++; else na++;
    }
    const total = evaluations.length || 1;

    let r = 1;
    titleRow(ws, r++, '3. Synthèse du niveau de maturité', 8);
    ws.addRow([]); r++;
    headerRow(ws, r, ['État de maturité', 'Nombre de règles', '% des règles']); r++;

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
    ['N/A', na, `${Math.round(na/total*100)} %`].forEach((val, ci) => {
        const cell = ws.getCell(r, ci + 1);
        cell.value = val;
        applyCell(cell, { bg: C.light, fontColor: C.gray, size: 10, align: ci > 0 ? 'center' : 'left' });
    });
    ws.getRow(r).commit(); r++;
    ws.addRow([]); r++;

    // ── Distribution par domaine
    const evalMap = buildEvalMap(evaluations);
    const domaines = sortDomaines(referentiel?.domaines);
    if (domaines.length > 0) {
        sectionRow(ws, r++, 'Distribution par domaine', 8);
        headerRow(ws, r, ['Domaine', 'Aucun', 'Initial', 'Reproductible', 'Défini', 'Maîtrisé', 'Optimisé', 'N/A']); r++;
        for (const domaine of domaines) {
            const mats = [0,0,0,0,0,0]; let dNa = 0;
            const allMesures = (domaine.objectifs || []).flatMap(o => o.mesures || []);
            for (const m of allMesures) {
                const ev = evalMap[m.id];
                const n = ev?.niveau_maturite;
                if (n != null && n >= 0 && n <= 5) mats[n]++; else dNa++;
            }
            ws.getRow(r).height = 22;
            [domaine.nom || domaine.code, ...mats, dNa].forEach((v, ci) => {
                const cell = ws.getCell(r, ci + 1);
                cell.value = v;
                applyCell(cell, { bg: ci === 0 ? C.light : C.white, fontColor: ci === 0 ? C.navyMid : C.navy, bold: ci === 0, size: 9, align: ci > 0 ? 'center' : 'left' });
            });
            ws.getRow(r).commit(); r++;
        }
        ws.addRow([]); r++;
    }

    if (matBarImg) {
        sectionRow(ws, r++, 'Distribution par niveau de maturité', 8);
        const id = wb.addImage({ base64: matBarImg, extension: 'png' });
        ws.addImage(id, { tl: { col: 0, row: r - 1 }, ext: { width: 580, height: 350 } });
        for (let i = 0; i < 20; i++) { ws.addRow([]); r++; }
    }
}

// ─── ONGLET 5 : Synthèse conformité ───────────────────────────────────────────
async function addSyntheseConformiteSheet(wb, evaluations, confPieImg, referentiel) {
    const ws = wb.addWorksheet('Synthèse conformité');
    ws.columns = [
        { width: 40 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 12 },
    ];

    const dnssi = { 'Non conforme':0, 'Partielle':0, 'Totale':0, 'N/A':0 };
    for (const ev of evaluations) {
        const m = CONF_DNSSI[ev.conformite || 'na'] || 'N/A';
        dnssi[m] = (dnssi[m] || 0) + 1;
    }
    const total = evaluations.length || 1;
    const dnssiBg = { 'Non conforme':C.redLight, 'Partielle':C.orangeLight, 'Totale':C.greenLight, 'N/A':C.light };
    const dnssiFg = { 'Non conforme':C.redFont,  'Partielle':C.orangeFont,  'Totale':C.greenFont,  'N/A':C.gray  };

    let r = 1;
    titleRow(ws, r++, '4. Synthèse du niveau de conformité à la DNSSI', 5);
    ws.addRow([]); r++;
    headerRow(ws, r, ['Niveau de conformité', 'Nb règles', '%']); r++;

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

    // ── Conformité par domaine
    const evalMap = buildEvalMap(evaluations);
    const domaines = sortDomaines(referentiel?.domaines);
    if (domaines.length > 0) {
        sectionRow(ws, r++, 'Conformité par domaine', 5);
        headerRow(ws, r, ['Domaine', 'Non conforme', 'Partielle', 'Totale', 'N/A']); r++;
        for (const domaine of domaines) {
            const dc = { 'Non conforme':0, 'Partielle':0, 'Totale':0, 'N/A':0 };
            const allMesures = (domaine.objectifs || []).flatMap(o => o.mesures || []);
            for (const m of allMesures) {
                const ev = evalMap[m.id];
                const label = CONF_DNSSI[ev?.conformite || 'na'] || 'N/A';
                dc[label] = (dc[label] || 0) + 1;
            }
            ws.getRow(r).height = 22;
            [domaine.nom || domaine.code, dc['Non conforme'], dc['Partielle'], dc['Totale'], dc['N/A']].forEach((v, ci) => {
                const cell = ws.getCell(r, ci + 1);
                cell.value = v;
                const style = ci === 0 ? { bg: C.light, fontColor: C.navyMid, bold: true, size: 9, align: 'left' }
                    : ci === 1 ? { bg: C.redLight,    fontColor: C.redFont,    size: 9, align: 'center', bold: false }
                    : ci === 2 ? { bg: C.orangeLight,  fontColor: C.orangeFont,  size: 9, align: 'center', bold: false }
                    : ci === 3 ? { bg: C.greenLight,   fontColor: C.greenFont,   size: 9, align: 'center', bold: false }
                    :            { bg: C.light,        fontColor: C.gray,        size: 9, align: 'center', bold: false };
                applyCell(cell, style);
            });
            ws.getRow(r).commit(); r++;
        }
        ws.addRow([]); r++;
    }

    if (confPieImg) {
        sectionRow(ws, r++, 'Répartition de la conformité', 5);
        const id = wb.addImage({ base64: confPieImg, extension: 'png' });
        ws.addImage(id, { tl: { col: 0, row: r - 1 }, ext: { width: 500, height: 433 } });
        for (let i = 0; i < 24; i++) { ws.addRow([]); r++; }
    }
}

// ─── ONGLET 6 : État d'avancement ─────────────────────────────────────────────
function addEtatAvancementSheet(wb, referentiel, evaluations, planActions, refType = 'dnssi') {
    const ws = wb.addWorksheet("État d'avancement");
    ws.columns = [
        { width: 24 }, // Chapitre
        { width: 28 }, // Objectif
        { width: 14 }, // Règle
        { width: 18 }, // Conformité
        { width: 7  }, // Mat.
        { width: 38 }, // Actions achevées
        { width: 38 }, // Actions programmées
        { width: 14 }, // Délai
        { width: 16 }, // État
        { width: 50 }, // Commentaires
    ];

    const evalMap = buildEvalMap(evaluations);
    const planMap = buildPlanMap(planActions);
    const domaines = sortDomaines(referentiel?.domaines);

    let r = 1;
    titleRow(ws, r++, "5. État d'avancement de l'implémentation", 10);
    ws.addRow([]); r++;
    headerRow(ws, r, ['Chapitre','Objectif','Règle','Conformité','Mat.','Actions achevées','Actions programmées','Délai','État','Commentaires']);
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

                const achevesText = plans.filter(p => p.statut === 'cloture').map(p => p.action_corrective || '').join('\n');
                const programText = plans.filter(p => p.statut !== 'cloture').map(p => p.action_corrective || '').join('\n');
                const commentText = plans.map(p => p.description_nc || '').filter(Boolean).join('\n');
                ws.getRow(r).height = Math.max(
                    calcRowHeight(achevesText, 38),
                    calcRowHeight(programText, 38),
                    calcRowHeight(commentText, 50),
                    150
                );

                const c1 = ws.getCell(r, 1);
                if (r === domStart) c1.value = domaine.nom || domaine.code || '';
                applyCell(c1, { bg: C.navy, fontColor: C.white, bold: true, size: 9, align: 'center' });

                const c2 = ws.getCell(r, 2);
                if (r === objStart) c2.value = stripObjPrefix(objectif.description) || objectif.code || '';
                applyCell(c2, { bg: C.light, fontColor: C.navyMid, size: 9 });

                ws.getCell(r, 3).value = mesure.code || `M${mesure.id}`;
                applyCell(ws.getCell(r, 3), { bg: C.white, fontColor: C.navy, bold: true, size: 9, align: 'center' });

                ws.getCell(r, 4).value = refType === 'dnssi' ? (CONF_DNSSI[ck] || 'N/A') : (CONF_LABELS[ck] || 'N/A');
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

// ─── ONGLET 3 ISO : Évaluation ISO 27001 ──────────────────────────────────────
function addEvaluationSheetISO(wb, referentiel, evaluations) {
    const ws = wb.addWorksheet('Évaluation ISO 27001');
    ws.columns = [
        { width: 26 }, // Domaine
        { width: 32 }, // Objectif
        { width: 13 }, // Contrôle
        { width: 20 }, // Conformité
        { width: 55 }, // Constat / Justificatif
        { width: 55 }, // Recommandation
    ];

    const evalMap = buildEvalMap(evaluations);
    const domaines = sortDomaines(referentiel?.domaines);

    let r = 1;
    titleRow(ws, r++, '2. Évaluation des contrôles ISO/IEC 27001:2022', 6);
    ws.addRow([]); r++;
    headerRow(ws, r, ['Domaine','Objectif','Contrôle','Conformité','Constat / Justificatif','Recommandation']);
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
                const ev = evalMap[mesure.id];
                const ck = ev?.conformite || 'na';
                const cs = confStyle(ck);
                ws.getRow(r).height = measureRowHeight(ev, 55, 55);

                const c1 = ws.getCell(r, 1);
                if (r === domStart) {
                    c1.value = domaine.nom || domaine.code || '';
                    applyCell(c1, { bg: C.navy, fontColor: C.white, bold: true, size: 9, align: 'center', valign: 'middle' });
                } else {
                    applyCell(c1, { bg: C.navy, fontColor: C.white, size: 9 });
                }

                const c2 = ws.getCell(r, 2);
                if (r === objStart) {
                    c2.value = stripObjPrefix(objectif.description) || objectif.code || '';
                    applyCell(c2, { bg: C.light, fontColor: C.navyMid, bold: false, size: 9, valign: 'middle' });
                } else {
                    applyCell(c2, { bg: C.light, fontColor: C.navyMid, size: 9 });
                }

                ws.getCell(r, 3).value = mesure.code || `M${mesure.id}`;
                applyCell(ws.getCell(r, 3), { bg: C.white, fontColor: C.navy, bold: true, size: 9, align: 'center' });

                ws.getCell(r, 4).value = CONF_LABELS[ck] || ck;
                applyCell(ws.getCell(r, 4), { ...cs, bold: true, size: 9, align: 'center' });

                ws.getCell(r, 5).value = ev?.commentaire || '';
                applyCell(ws.getCell(r, 5), { bg: C.white, size: 9 });

                ws.getCell(r, 6).value = ev?.recommandation || '';
                applyCell(ws.getCell(r, 6), { bg: C.white, size: 9 });

                ws.getRow(r).commit(); r++;
            }

            if (r > objStart + 1) ws.mergeCells(objStart, 2, r - 1, 2);
            ws.getCell(objStart, 2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }

        if (r > domStart + 1) ws.mergeCells(domStart, 1, r - 1, 1);
        ws.getCell(domStart, 1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        ws.getRow(r - 1).eachCell({ includeEmpty: true }, (_, ci) => {
            ws.getCell(r - 1, ci).border = { ...bdr(), bottom: thick() };
        });
    }
}

// ─── ONGLET 4 ISO : Synthèse conformité ISO ───────────────────────────────────
async function addSyntheseConformiteSheetISO(wb, evaluations, confPieImg, referentiel) {
    const ws = wb.addWorksheet('Synthèse conformité ISO');
    ws.columns = [{ width: 40 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }];

    const isoCounts = Object.fromEntries(ISO_CONF_KEYS.map(k => [k, 0]));
    for (const ev of evaluations) {
        const c = ev.conformite || 'na';
        if (c in isoCounts) isoCounts[c]++;
    }
    const total = evaluations.length || 1;

    let r = 1;
    titleRow(ws, r++, '4. Synthèse du niveau de conformité ISO/IEC 27001:2022', 5);
    ws.addRow([]); r++;
    headerRow(ws, r, ['Niveau de conformité', 'Nb contrôles', '%']); r++;

    for (const key of ISO_CONF_KEYS) {
        const v  = isoCounts[key];
        const cs = confStyle(key);
        ws.getRow(r).height = 24;
        [CONF_LABELS[key] || key, v, `${Math.round(v / total * 100)} %`].forEach((val, ci) => {
            const cell = ws.getCell(r, ci + 1);
            cell.value = val;
            applyCell(cell, { ...cs, bold: ci === 0, size: 10, align: ci > 0 ? 'center' : 'left' });
        });
        ws.getRow(r).commit(); r++;
    }
    ws.addRow([]); r++;

    // Conformité par domaine
    const evalMap = buildEvalMap(evaluations);
    const domaines = sortDomaines(referentiel?.domaines);
    if (domaines.length > 0) {
        sectionRow(ws, r++, 'Conformité par domaine', 5);
        headerRow(ws, r, ['Domaine', 'Conforme', 'NC Min.', 'NC Maj.', 'N/A']); r++;
        for (const domaine of domaines) {
            const dc = { conforme:0, nc_mineure:0, nc_majeure:0, na:0 };
            const allMesures = (domaine.objectifs || []).flatMap(o => o.mesures || []);
            for (const m of allMesures) {
                const ev = evalMap[m.id];
                const c = ev?.conformite || 'na';
                if (c in dc) dc[c]++; else dc.na++;
            }
            ws.getRow(r).height = 22;
            [domaine.nom || domaine.code, dc.conforme, dc.nc_mineure, dc.nc_majeure, dc.na].forEach((v, ci) => {
                const cell = ws.getCell(r, ci + 1);
                cell.value = v;
                const style = ci === 0 ? { bg: C.light, fontColor: C.navyMid, bold: true, size: 9, align: 'left' }
                    : ci === 1 ? { bg: C.greenLight,  fontColor: C.greenFont,  size: 9, align: 'center', bold: false }
                    : ci === 2 ? { bg: C.orangeLight, fontColor: C.orangeFont, size: 9, align: 'center', bold: false }
                    : ci === 3 ? { bg: C.redLight,    fontColor: C.redFont,    size: 9, align: 'center', bold: false }
                    :            { bg: C.light,        fontColor: C.gray,       size: 9, align: 'center', bold: false };
                applyCell(cell, style);
            });
            ws.getRow(r).commit(); r++;
        }
        ws.addRow([]); r++;
    }

    if (confPieImg) {
        sectionRow(ws, r++, 'Répartition de la conformité', 5);
        const id = wb.addImage({ base64: confPieImg, extension: 'png' });
        ws.addImage(id, { tl: { col: 0, row: r - 1 }, ext: { width: 500, height: 433 } });
        for (let i = 0; i < 24; i++) { ws.addRow([]); r++; }
    }
}

// ─── ONGLET 5 ISO : SoA ────────────────────────────────────────────────────────
function addSoASheet(wb, referentiel, soaEntries) {
    const ws = wb.addWorksheet('Déclaration applicabilité');
    ws.columns = [
        { width: 26 }, // Domaine
        { width: 13 }, // Contrôle
        { width: 55 }, // Intitulé du contrôle
        { width: 12 }, // Applicable
        { width: 22 }, // Statut implémentation
        { width: 45 }, // Justification exclusion
        { width: 32 }, // Raisons inclusion
        { width: 22 }, // Référence document
    ];

    const soaMap = {};
    for (const s of soaEntries || []) soaMap[s.mesure_id] = s;

    const domaines = sortDomaines(referentiel?.domaines);

    let r = 1;
    titleRow(ws, r++, '5. Déclaration d\'Applicabilité (SoA) — Annexe A ISO/IEC 27001:2022', 8);
    ws.addRow([]); r++;
    headerRow(ws, r, ['Domaine','Contrôle','Intitulé du contrôle','Applicable','Statut implémentation','Justification d\'exclusion','Raisons d\'inclusion','Référence document']);
    r++;

    for (const domaine of domaines) {
        const domStart = r;
        const objectifs = [...(domaine.objectifs || [])].sort((a, b) =>
            (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
        );

        for (const objectif of objectifs) {
            const mesures = [...(objectif.mesures || [])].sort((a, b) =>
                (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
            );
            for (const mesure of mesures) {
                const soa = soaMap[mesure.id];
                const applicable = soa ? soa.applicable : true;
                const statutLabel = soa ? (SOA_STATUT_LABELS[soa.statut_implementation] || '—') : '—';
                const statutBg = { 'Implémenté':C.greenLight, 'Planifié':C.orangeLight, 'Partiel':C.orangeLight, 'Non implémenté':C.redLight };
                const statutFg = { 'Implémenté':C.greenFont,  'Planifié':C.orangeFont,  'Partiel':C.orangeFont,  'Non implémenté':C.redFont };

                ws.getRow(r).height = Math.max(
                    calcRowHeight(mesure.description || '', 55),
                    calcRowHeight(soa?.justification_exclusion || '', 45),
                    calcRowHeight(Array.isArray(soa?.raisons_inclusion) ? soa.raisons_inclusion.join(', ') : '', 32),
                    150
                );

                const c1 = ws.getCell(r, 1);
                if (r === domStart) {
                    c1.value = domaine.nom || domaine.code || '';
                    applyCell(c1, { bg: C.navy, fontColor: C.white, bold: true, size: 9, align: 'center' });
                } else {
                    applyCell(c1, { bg: C.navy, fontColor: C.white, size: 9 });
                }

                ws.getCell(r, 2).value = mesure.code || `M${mesure.id}`;
                applyCell(ws.getCell(r, 2), { bg: C.white, fontColor: C.navy, bold: true, size: 9, align: 'center' });

                ws.getCell(r, 3).value = mesure.description || mesure.code || '';
                applyCell(ws.getCell(r, 3), { bg: C.white, fontColor: C.navy, size: 9 });

                ws.getCell(r, 4).value = applicable ? 'Oui' : 'Non';
                applyCell(ws.getCell(r, 4), {
                    bg: applicable ? C.greenLight : C.redLight,
                    fontColor: applicable ? C.greenFont : C.redFont,
                    bold: true, size: 9, align: 'center'
                });

                ws.getCell(r, 5).value = applicable ? statutLabel : '—';
                applyCell(ws.getCell(r, 5), {
                    bg: applicable ? (statutBg[statutLabel] || C.light) : C.light,
                    fontColor: applicable ? (statutFg[statutLabel] || C.gray) : C.gray,
                    size: 9, align: 'center'
                });

                ws.getCell(r, 6).value = !applicable ? (soa?.justification_exclusion || '—') : '';
                applyCell(ws.getCell(r, 6), { bg: C.white, fontColor: C.gray, size: 9 });

                const raisons = soa?.raisons_inclusion;
                ws.getCell(r, 7).value = Array.isArray(raisons) ? raisons.join(', ') : (raisons || '');
                applyCell(ws.getCell(r, 7), { bg: C.white, fontColor: C.navy, size: 9 });

                ws.getCell(r, 8).value = soa?.reference_document || '';
                applyCell(ws.getCell(r, 8), { bg: C.white, fontColor: C.navy, size: 9 });

                ws.getRow(r).commit(); r++;
            }
        }

        if (r > domStart + 1) ws.mergeCells(domStart, 1, r - 1, 1);
        ws.getCell(domStart, 1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        ws.getRow(r - 1).eachCell({ includeEmpty: true }, (_, ci) => {
            ws.getCell(r - 1, ci).border = { ...bdr(), bottom: thick() };
        });
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

    const legendFont = { size: 22, family: 'Calibri' };
    const tickFont   = { size: 16, family: 'Calibri' };
    const chartBase  = { responsive: false, animation: false, layout: { padding: 16 } };

    const refType = getReferentielType(referentiel);

    // Graphiques communs
    const confLabelsChart = refType === 'iso27001' ? ISO_CONF_SHORT  : CONF_LABELS_SHORT;
    const confKeysChart   = refType === 'iso27001' ? ISO_CONF_KEYS   : CONF_KEYS;
    const confColorsChart = refType === 'iso27001' ? ISO_CONF_COLORS : CONF_COLORS;

    const chartPromises = [
        // Donut conformité
        chartToPNG({ type:'doughnut', data:{ labels:confLabelsChart, datasets:[{ data:confKeysChart.map(k=>cCounts[k]||0), backgroundColor:confColorsChart, borderWidth:3 }] }, options:{ ...chartBase, cutout:'65%', plugins:{ legend:{ position:'right', labels:{ font:legendFont, padding:16, boxWidth:18 } }, tooltip:{enabled:false} } } }, 900, 900),
        // Bar conformité horizontal
        chartToPNG({ type:'bar', data:{ labels:confLabelsChart, datasets:[{ data:confKeysChart.map(k=>cCounts[k]||0), backgroundColor:confColorsChart, borderRadius:6, borderSkipped:false }] }, options:{ ...chartBase, indexAxis:'y', plugins:{ legend:{display:false} }, scales:{ x:{beginAtZero:true,grid:{color:'#f3f4f6'},ticks:{font:tickFont}}, y:{grid:{display:false},ticks:{font:{...tickFont,weight:'600'}}} } } }, 1100, 700),
        // Bar maturité (DNSSI) ou null (ISO)
        refType === 'dnssi'
            ? chartToPNG({ type:'bar', data:{ labels:MAT_SHORT, datasets:[{ data:matCounts, backgroundColor:MAT_COLORS, borderRadius:6, borderSkipped:false }] }, options:{ ...chartBase, plugins:{ legend:{display:false} }, scales:{ y:{beginAtZero:true,grid:{color:'#f3f4f6'},ticks:{font:tickFont}}, x:{grid:{display:false},ticks:{font:tickFont}} } } }, 1100, 660)
            : Promise.resolve(null),
        // Pie conformité
        refType === 'dnssi'
            ? chartToPNG({ type:'pie', data:{ labels:Object.keys(dnssiCounts), datasets:[{ data:Object.values(dnssiCounts), backgroundColor:['#dc2626','#f97316','#16a34a','#9ca3af'], borderWidth:3 }] }, options:{ ...chartBase, plugins:{ legend:{ position:'right', labels:{ font:legendFont, padding:18, boxWidth:18 } }, tooltip:{enabled:false} } } }, 900, 780)
            : chartToPNG({ type:'pie', data:{ labels:ISO_CONF_SHORT, datasets:[{ data:ISO_CONF_KEYS.map(k=>cCounts[k]||0), backgroundColor:ISO_CONF_COLORS, borderWidth:3 }] }, options:{ ...chartBase, plugins:{ legend:{ position:'right', labels:{ font:legendFont, padding:18, boxWidth:18 } }, tooltip:{enabled:false} } } }, 900, 780),
    ];

    const [donut, bar, matBar, confPie] = await Promise.all(chartPromises);

    const wb    = new ExcelJS.Workbook();
    wb.creator  = 'DataProtect';
    wb.created  = new Date();

    await addSyntheseSheet(wb, audit, evaluations, planActions, { donut, bar });
    addIdentificationSheet(wb, audit);

    if (refType === 'dnssi') {
        addEvaluationSheet(wb, referentiel, evaluations);
        await addSyntheseMaturiteSheet(wb, evaluations, matBar, referentiel);
        await addSyntheseConformiteSheet(wb, evaluations, confPie, referentiel);
        addEtatAvancementSheet(wb, referentiel, evaluations, planActions, 'dnssi');
    } else {
        addEvaluationSheetISO(wb, referentiel, evaluations);
        await addSyntheseConformiteSheetISO(wb, evaluations, confPie, referentiel);
        addSoASheet(wb, referentiel, soaEntries);
        addEtatAvancementSheet(wb, referentiel, evaluations, planActions, 'iso27001');
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    const now2 = new Date();
    const dateStr2 = `${String(now2.getDate()).padStart(2,'0')}-${String(now2.getMonth()+1).padStart(2,'0')}-${now2.getFullYear()}`;
    const nomStr2  = (audit.nom || 'audit').replace(/[\\/:*?"<>|]/g, ' ').trim();
    a.href = url; a.download = `${nomStr2} - ${dateStr2}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}
