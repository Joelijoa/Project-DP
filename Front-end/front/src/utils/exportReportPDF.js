import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import Chart from 'chart.js/auto';

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const NAVY  = [30, 41, 59];
const RED   = [204, 0, 0];
const DARK  = [17, 24, 39];
const GRAY  = [107, 114, 128];
const LIGHT = [248, 250, 252];
const BDR   = [226, 232, 240];
const WHITE = [255, 255, 255];
const M = 20;
const W = 210;
const H = 297;
const CW = W - 2 * M; // 170mm

const CONFORMITE = {
    conforme: 'Conforme', partiel: 'Partiellement conforme',
    non_conforme: 'Non conforme', nc_mineure: 'NC Mineure',
    nc_majeure: 'NC Majeure', na: 'N/A',
};
const PHASE = {
    cadrage: 'Cadrage', prerequis: 'Prérequis',
    revue_documentaire: 'Revue documentaire', realisation: 'Réalisation', termine: 'Terminé',
};
const STATUT   = { brouillon: 'Brouillon', en_cours: 'En cours', termine: 'Terminé', archive: 'Archivé' };
const MATURITE = ['Aucun (0)', 'Initial (1)', 'Reproductible (2)', 'Défini (3)', 'Maîtrisé (4)', 'Optimisé (5)'];
const PRIORITE = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' };
const STATUT_PLAN = { a_faire: 'À faire', en_cours: 'En cours', cloture: 'Clôturé' };
const STATUT_SOA  = { non_implemente: 'Non implémenté', planifie: 'Planifié', partiel: 'Partiel', implemente: 'Implémenté' };

const CONF_KEYS   = ['conforme', 'partiel', 'nc_mineure', 'nc_majeure', 'non_conforme', 'na'];
const CONF_LABELS = ['Conforme', 'Partiellement conf.', 'NC Mineure', 'NC Majeure', 'Non conforme', 'N/A'];
const CONF_COLORS = ['#16a34a', '#ca8a04', '#ea580c', '#dc2626', '#991b1b', '#9ca3af'];

// ─── UTILITAIRES ──────────────────────────────────────────────────────────────
async function imgToBase64(url) {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise(r => { const fr = new FileReader(); fr.onloadend = () => r(fr.result); fr.readAsDataURL(blob); });
    } catch { return null; }
}

async function loadLogo(url) {
    const b64 = await imgToBase64(url);
    if (!b64) return { b64: null, ar: 4 };
    return new Promise(r => {
        const img = new Image();
        img.onload  = () => r({ b64, ar: img.width / Math.max(img.height, 1) });
        img.onerror = () => r({ b64, ar: 4 });
        img.src = b64;
    });
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
        return url;
    } finally {
        if (document.body.contains(canvas)) document.body.removeChild(canvas);
    }
}

function sortedDomaines(referentiel) {
    return [...(referentiel?.domaines || [])].sort((a, b) =>
        (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
    );
}

function buildMesureMap(referentiel) {
    const map = {};
    for (const d of referentiel?.domaines || [])
        for (const o of d.objectifs || [])
            for (const m of o.mesures || [])
                map[m.id] = { mesure: m, objectif: o, domaine: d };
    return map;
}

function buildStats(evaluations) {
    const counts = Object.fromEntries(CONF_KEYS.map(k => [k, 0]));
    let sumM = 0, nM = 0;
    for (const ev of evaluations) {
        const c = ev.conformite || 'na';
        if (c in counts) counts[c]++;
        if (ev.niveau_maturite != null && ev.niveau_maturite >= 0) { sumM += ev.niveau_maturite; nM++; }
    }
    const total = evaluations.length;
    return { counts, total, tauxConformite: total ? Math.round(counts.conforme / total * 100) : 0, maturiteMoyenne: nM ? (sumM / nM).toFixed(1) : 'N/A' };
}

// ─── PRIMITIVES PDF ───────────────────────────────────────────────────────────
function addLogo(doc, logo, x, y, h) {
    if (!logo.b64) return;
    const w = Math.min(h * logo.ar, 50);
    doc.setFillColor(...WHITE);
    doc.rect(x - 1, y - 1, w + 2, h + 2, 'F');
    doc.addImage(logo.b64, 'PNG', x, y, w, w / logo.ar, '', 'FAST');
}

function drawHeader(doc, logo, section) {
    doc.setFillColor(...RED);
    doc.rect(0, 0, W, 7, 'F');
    addLogo(doc, logo, M, 10, 10);
    if (section) {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...GRAY);
        doc.text(section, W - M, 16, { align: 'right' });
    }
    doc.setDrawColor(...BDR); doc.setLineWidth(0.3);
    doc.line(M, 23, W - M, 23);
}

function drawFooter(doc, p, total, ref) {
    doc.setDrawColor(...BDR); doc.setLineWidth(0.3);
    doc.line(M, H - 14, W - M, H - 14);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(156, 163, 175);
    doc.text(`© ${new Date().getFullYear()} DataProtect · Document confidentiel`, M, H - 8);
    doc.text(`${p} / ${total}`, W / 2, H - 8, { align: 'center' });
    doc.text(ref, W - M, H - 8, { align: 'right' });
}

function sectionTitle(doc, num, title, y) {
    doc.setFillColor(...RED); doc.rect(M, y, 3, 10, 'F');
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text(`${num}. ${title}`, M + 7, y + 8);
    return y + 16;
}

function subTitle(doc, title, y) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY);
    doc.text(title, M, y);
    doc.setDrawColor(...BDR); doc.setLineWidth(0.3);
    doc.line(M, y + 2, W - M, y + 2);
    return y + 9;
}

function bodyText(doc, text, y, maxW) {
    doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(text, maxW ?? CW);
    doc.text(lines, M, y);
    return y + lines.length * 4.8 + 4;
}

// ─── PAGE DE COUVERTURE ───────────────────────────────────────────────────────
function renderCover(doc, audit, logo, refCode, today) {
    const SPLIT = 145; // frontière navy / blanc

    // ── Zone navy (haut)
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, SPLIT, 'F');

    // Barre rouge gauche (accent vertical)
    doc.setFillColor(...RED);
    doc.rect(0, 0, 5, SPLIT, 'F');

    // Logo en haut à gauche
    addLogo(doc, logo, 14, 14, 14);

    // CONFIDENTIEL — discret, haut droite
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...RED);
    doc.text('CONFIDENTIEL', W - M, 20, { align: 'right' });

    // Label type rapport
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('RAPPORT D\'AUDIT DE SÉCURITÉ', 14, 55);

    // Séparateur rouge court sous le label
    doc.setFillColor(...RED);
    doc.rect(14, 58, 22, 1.5, 'F');

    // Titre principal — nom de l'audit
    const nomLines = doc.splitTextToSize(audit.nom || 'Rapport d\'Audit', W - 34);
    doc.setFontSize(26); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
    doc.text(nomLines.slice(0, 3), 14, 70);

    const afterNom = 70 + Math.min(nomLines.length, 3) * 11;

    // Client
    doc.setFontSize(12); doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(audit.client || '', 14, afterNom + 6);

    // Référentiel (plus petit, italic)
    if (audit.referentiel?.nom) {
        doc.setFontSize(8.5); doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text(audit.referentiel.nom, 14, afterNom + 15);
    }

    // ── Bande rouge séparatrice
    doc.setFillColor(...RED);
    doc.rect(0, SPLIT, W, 3, 'F');

    // ── Zone blanche (bas)
    doc.setFillColor(...WHITE);
    doc.rect(0, SPLIT + 3, W, H - SPLIT - 3, 'F');

    // Barre rouge gauche prolongée sur zone blanche
    doc.setFillColor(...RED);
    doc.rect(0, SPLIT + 3, 5, H - SPLIT - 3, 'F');

    const auditeurs = audit.auditeurs?.map(a => `${a.prenom} ${a.nom}`).join(', ') || '—';
    const periode   = audit.date_debut && audit.date_fin
        ? `${new Date(audit.date_debut).toLocaleDateString('fr-FR')} – ${new Date(audit.date_fin).toLocaleDateString('fr-FR')}`
        : '—';

    // Bloc "Préparé pour"
    let y = SPLIT + 18;
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRAY);
    doc.text('PRÉPARÉ POUR', 14, y);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text(audit.client || '—', 14, y + 9);

    // Ligne séparatrice légère
    y += 18;
    doc.setDrawColor(...BDR); doc.setLineWidth(0.3);
    doc.line(14, y, W - M, y);
    y += 10;

    // Deux colonnes : Auditeur | Période
    const col2 = W / 2 + 5;
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...RED);
    doc.text('AUDITEUR(S)', 14, y);
    doc.text('PÉRIODE D\'AUDIT', col2, y);

    y += 7;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    const audLines = doc.splitTextToSize(auditeurs, W / 2 - 20);
    doc.text(audLines.slice(0, 2), 14, y);
    doc.text(periode, col2, y);

    // Ligne séparatrice
    y += Math.max(audLines.slice(0, 2).length, 1) * 5 + 8;
    doc.setDrawColor(...BDR); doc.setLineWidth(0.3);
    doc.line(14, y, W - M, y);
    y += 10;

    // Périmètre
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...RED);
    doc.text('PÉRIMÈTRE DE L\'AUDIT', 14, y);
    y += 7;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
    const perLines = doc.splitTextToSize(audit.perimetre || 'Non défini.', CW - 6);
    doc.text(perLines.slice(0, 4), 14, y);

    // ── Pied de couverture
    const footY = H - 16;
    doc.setFillColor(248, 250, 252);
    doc.rect(5, footY - 6, W - 5, 22, 'F');
    doc.setDrawColor(...BDR); doc.setLineWidth(0.3);
    doc.line(14, footY - 6, W - M, footY - 6);

    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
    doc.text(`Réf. : ${refCode}`, 14, footY + 2);
    doc.text(`Généré le ${today}`, W / 2, footY + 2, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...RED);
    doc.text('CONFIDENTIEL', W - M, footY + 2, { align: 'right' });
}

// ─── SOMMAIRE (rendu en dernier) ──────────────────────────────────────────────
function renderTOC(doc, logo, sections, tocPage) {
    doc.setPage(tocPage);
    drawHeader(doc, logo, 'Sommaire');
    let y = 32;

    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text('Sommaire', M, y);
    y += 4;
    doc.setFillColor(...RED); doc.rect(M, y, 20, 2, 'F');
    y += 10;

    for (const s of sections) {
        doc.setFontSize(s.sub ? 9 : 10);
        doc.setFont('helvetica', s.sub ? 'normal' : 'bold');
        doc.setTextColor(...(s.sub ? GRAY : DARK));
        const tx = s.sub ? M + 6 : M;
        doc.text(s.title, tx, y);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...RED);
        doc.text(String(s.page), W - M, y, { align: 'right' });

        // Pointillés
        const startX = tx + doc.getTextWidth(s.title) + 2;
        const endX = W - M - doc.getTextWidth(String(s.page)) - 3;
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(209, 213, 219);
        for (let x = startX; x < endX; x += 2.5) doc.text('.', x, y);

        y += s.sub ? 7 : 9;
        doc.setDrawColor(243, 244, 246); doc.setLineWidth(0.2);
        doc.line(M, y - 1.5, W - M, y - 1.5);
    }
}

// ─── INTRODUCTION ─────────────────────────────────────────────────────────────
function renderIntroduction(doc, audit, logo) {
    drawHeader(doc, logo, '1. Introduction');
    let y = 32;
    y = sectionTitle(doc, 1, 'Introduction', y);

    y = subTitle(doc, '1.1  Contexte et objectifs', y);
    y = bodyText(doc, `Le présent document constitue le rapport d'audit de sécurité des systèmes d'information conduit auprès de ${audit.client || 'l\'entité auditée'}. Cet audit a été réalisé conformément au référentiel ${audit.referentiel?.nom || 'applicable'} dans le cadre d'une démarche d'évaluation et d'amélioration continue de la posture de sécurité.\n\nL'objectif est d'évaluer le niveau de conformité des mesures en place, d'identifier les écarts et risques associés, et de formuler des recommandations adaptées.`, y);

    y = subTitle(doc, '1.2  Périmètre d\'audit', y);
    y = bodyText(doc, audit.perimetre || 'Le périmètre n\'a pas été formellement défini.', y);

    y = subTitle(doc, '1.3  Normes de référence', y);
    y = bodyText(doc, `Référentiel : ${audit.referentiel?.nom || '—'}${audit.referentiel?.type ? `  ·  Type : ${audit.referentiel.type}` : ''}`, y);

    y = subTitle(doc, '1.4  Méthodologie', y);
    y = bodyText(doc, `L'audit a été conduit selon une approche structurée :\n— Collecte et analyse documentaire des politiques et procédures existantes\n— Entretiens avec les responsables et équipes techniques concernées\n— Évaluation des contrôles en place sur la base du référentiel\n— Identification des écarts et classification par niveau de criticité\n— Formulation de recommandations et plans d'actions correctifs`, y);

    if (audit.auditeurs?.length > 0) {
        y = subTitle(doc, '1.5  Équipe d\'audit', y);
        autoTable(doc, {
            startY: y,
            head: [['Nom & Prénom', 'Contact']],
            body: audit.auditeurs.map(a => [`${a.prenom} ${a.nom}`, a.email || '—']),
            styles: { fontSize: 9, cellPadding: 2.5 },
            headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: LIGHT },
            columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 90 } },
            margin: { left: M, right: M, top: 28 },
            didDrawPage: () => drawHeader(doc, logo, '1. Introduction'),
        });
    }
}

// ─── RÉSUMÉ EXÉCUTIF ──────────────────────────────────────────────────────────
async function renderResume(doc, audit, stats, evaluations, planActions, referentiel, logo) {
    drawHeader(doc, logo, '2. Résumé exécutif');
    let y = 32;
    y = sectionTitle(doc, 2, 'Résumé exécutif', y);

    // Synthèse textuelle
    const ncMaj = stats.counts.nc_majeure;
    y = bodyText(doc, `L'audit « ${audit.nom} » a permis d'évaluer ${stats.total} mesure(s). Le taux de conformité global s'établit à ${stats.tauxConformite} %. ${ncMaj > 0 ? `${ncMaj} non-conformité(s) majeure(s) requièrent une attention immédiate.` : 'Aucune non-conformité majeure n\'a été identifiée.'} ${planActions.length} plan(s) d'action ont été définis.`, y);

    // KPI cards
    const kpis = [
        { val: stats.total,              label: 'Mesures évaluées',  bg: NAVY },
        { val: `${stats.tauxConformite}%`, label: 'Taux de conformité', bg: [22, 163, 74] },
        { val: stats.counts.nc_majeure,  label: 'NC Majeures',       bg: [220, 38, 38] },
        { val: planActions.length,       label: 'Plans d\'actions',  bg: RED },
    ];
    const kW = (CW - 9) / 4;
    kpis.forEach((k, i) => {
        const kx = M + i * (kW + 3);
        doc.setFillColor(...k.bg); doc.roundedRect(kx, y, kW, 21, 2, 2, 'F');
        doc.setFontSize(17); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
        doc.text(String(k.val), kx + kW / 2, y + 12, { align: 'center' });
        doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text(k.label, kx + kW / 2, y + 18, { align: 'center' });
    });
    y += 27;

    // Graphiques
    const [donutPNG, barPNG] = await Promise.all([
        chartToPNG({
            type: 'doughnut',
            data: {
                datasets: [{ data: [stats.tauxConformite, 100 - stats.tauxConformite], backgroundColor: ['#16a34a', '#e5e7eb'], borderWidth: 0 }],
            },
            options: { cutout: '74%', plugins: { legend: { display: false }, tooltip: { enabled: false } } },
        }, 260, 260),
        chartToPNG({
            type: 'bar',
            data: {
                labels: CONF_LABELS,
                datasets: [{ data: CONF_KEYS.map(k => stats.counts[k]), backgroundColor: CONF_COLORS, borderRadius: 4, borderSkipped: false }],
            },
            options: {
                indexAxis: 'y',
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, color: '#6b7280' }, beginAtZero: true },
                    y: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' }, color: '#1e293b' } },
                },
                layout: { padding: { right: 10 } },
            },
        }, 580, 310),
    ]);

    const donutMM = 45, barH = 50, barW = CW - donutMM - 8;
    doc.addImage(donutPNG, 'PNG', M, y, donutMM, donutMM);
    // Texte centre donut
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(22, 163, 74);
    doc.text(`${stats.tauxConformite}%`, M + donutMM / 2, y + donutMM / 2 + 2, { align: 'center' });
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
    doc.text('conformité', M + donutMM / 2, y + donutMM / 2 + 7, { align: 'center' });
    doc.addImage(barPNG, 'PNG', M + donutMM + 8, y, barW, barH);
    y += Math.max(donutMM, barH) + 8;

    // Maturité moyenne
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
    doc.text(`Maturité moyenne : `, M, y);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY);
    doc.text(`${stats.maturiteMoyenne} / 5`, M + 38, y);
    y += 9;

    // Tableau par domaine
    const doms = sortedDomaines(referentiel);
    if (doms.length > 0) {
        y = subTitle(doc, '2.1  Résultats par domaine', y);
        const domRows = doms.map(d => {
            const ids = new Set();
            for (const o of d.objectifs || []) for (const m of o.mesures || []) ids.add(m.id);
            const evs = evaluations.filter(e => ids.has(e.mesure_id));
            const conf = evs.filter(e => e.conformite === 'conforme').length;
            const ncMaj = evs.filter(e => e.conformite === 'nc_majeure').length;
            const ncMin = evs.filter(e => e.conformite === 'nc_mineure').length;
            return [
                d.nom || d.code || '',
                String(evs.length),
                String(conf),
                String(ncMin),
                String(ncMaj),
                evs.length ? `${Math.round(conf / evs.length * 100)} %` : '—',
            ];
        });
        autoTable(doc, {
            startY: y,
            head: [['Domaine', 'Mesures', 'Conformes', 'NC Min.', 'NC Maj.', 'Taux']],
            body: domRows,
            styles: { fontSize: 8, cellPadding: 2.5 },
            headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: LIGHT },
            columnStyles: {
                0: { cellWidth: 96 }, 1: { cellWidth: 18, halign: 'center' },
                2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 16, halign: 'center' },
                4: { cellWidth: 16, halign: 'center' }, 5: { cellWidth: 14, halign: 'center' },
            },
            margin: { left: M, right: M, top: 28 },
            didParseCell: d => {
                if (d.section === 'body') {
                    if (d.column.index === 4 && Number(d.cell.raw) > 0) { d.cell.styles.textColor = [220, 38, 38]; d.cell.styles.fontStyle = 'bold'; }
                    if (d.column.index === 3 && Number(d.cell.raw) > 0) d.cell.styles.textColor = [234, 88, 12];
                }
            },
            didDrawPage: () => drawHeader(doc, logo, '2. Résumé exécutif'),
        });
    }
}

// ─── TERMINOLOGIE ─────────────────────────────────────────────────────────────
function renderTerminologie(doc, logo) {
    drawHeader(doc, logo, '3. Terminologie');
    let y = 32;
    y = sectionTitle(doc, 3, 'Terminologie et définitions', y);
    autoTable(doc, {
        startY: y,
        head: [['Terme', 'Définition']],
        body: [
            ['Audit de sécurité', 'Évaluation systématique des mesures de sécurité d\'un SI par rapport à un référentiel défini.'],
            ['Conformité', 'État d\'un contrôle satisfaisant pleinement les exigences du référentiel.'],
            ['NC Mineure', 'Non-conformité à impact limité, ne compromettant pas significativement la sécurité. Correction planifiée requise.'],
            ['NC Majeure', 'Non-conformité critique présentant un risque élevé. Action corrective urgente requise.'],
            ['Partiellement conforme', 'Contrôle partiellement mis en œuvre, avec des lacunes identifiées à corriger.'],
            ['N/A (Non Applicable)', 'Mesure ne s\'appliquant pas au contexte de l\'entité auditée.'],
            ['Niveau de maturité', 'Indicateur de 0 à 5 mesurant le degré d\'implémentation d\'une mesure (0 = Aucun, 5 = Optimisé).'],
            ['Plan d\'action', 'Ensemble de mesures correctives pour remédier à une non-conformité identifiée.'],
            ['SoA', 'Déclaration d\'Applicabilité — liste des mesures et leur applicabilité à l\'entité auditée.'],
            ['Périmètre d\'audit', 'Ensemble des systèmes, processus et ressources inclus dans le champ de l\'audit.'],
            ['Constat', 'Observation factuelle résultant des travaux d\'audit sur une mesure évaluée.'],
            ['Recommandation', 'Mesure corrective ou préventive proposée pour améliorer la posture de sécurité.'],
        ],
        styles: { fontSize: 8.5, cellPadding: 3, overflow: 'linebreak' },
        headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: { 0: { cellWidth: 46, fontStyle: 'bold', textColor: NAVY }, 1: { cellWidth: 124 } },
        margin: { left: M, right: M, top: 28 },
        didDrawPage: () => drawHeader(doc, logo, '3. Terminologie'),
    });
}

// ─── PLAN D'AUDIT ─────────────────────────────────────────────────────────────
function renderPlanAudit(doc, audit, referentiel, logo) {
    drawHeader(doc, logo, '4. Plan d\'audit');
    let y = 32;
    y = sectionTitle(doc, 4, 'Plan d\'audit', y);

    y = subTitle(doc, '4.1  Informations générales', y);
    autoTable(doc, {
        startY: y,
        body: [
            ['Dénomination', audit.nom || '—'],
            ['Entité auditée', audit.client || '—'],
            ['Référentiel', audit.referentiel?.nom || '—'],
            ['Phase', PHASE[audit.phase] || audit.phase],
            ['Date de début', audit.date_debut ? new Date(audit.date_debut).toLocaleDateString('fr-FR') : '—'],
            ['Date de fin', audit.date_fin ? new Date(audit.date_fin).toLocaleDateString('fr-FR') : '—'],
            ['Périmètre', audit.perimetre || '—'],
            ['Auditeur(s)', audit.auditeurs?.map(a => `${a.prenom} ${a.nom}`).join(', ') || '—'],
        ],
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', textColor: GRAY, fillColor: LIGHT }, 1: { cellWidth: 120 } },
        margin: { left: M, right: M },
        didDrawPage: () => drawHeader(doc, logo, '4. Plan d\'audit'),
    });
    y = doc.lastAutoTable.finalY + 10;

    if (sortedDomaines(referentiel).length > 0) {
        y = subTitle(doc, '4.2  Domaines et objectifs couverts', y);
        const rows = sortedDomaines(referentiel).flatMap(d => [
            [{ content: d.nom || d.code || '', colSpan: 2, styles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 } }],
            ...(d.objectifs || []).map(o => [
                { content: o.code || '', styles: { fontStyle: 'bold', textColor: NAVY } },
                o.description || o.nom || '',
            ]),
        ]);
        autoTable(doc, {
            startY: y,
            body: rows,
            styles: { fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak' },
            columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 146 } },
            margin: { left: M, right: M, top: 28 },
            didDrawPage: () => drawHeader(doc, logo, '4. Plan d\'audit'),
        });
    }
}

// ─── FAITS CONSTATÉS ──────────────────────────────────────────────────────────
function renderFaitsConstates(doc, audit, evaluations, mesureMap, referentiel, logo) {
    // Intro page
    drawHeader(doc, logo, '5. Faits constatés');
    let y = 32;
    y = sectionTitle(doc, 5, 'Faits constatés', y);
    y = bodyText(doc, `Cette section présente le détail des évaluations réalisées pour chaque domaine du référentiel ${audit.referentiel?.nom || ''}. Pour chaque mesure sont consignés : le niveau de conformité, la maturité observée, les constats et les recommandations.`, y);

    // Stats récapitulatives
    const totalNc = evaluations.filter(e => ['nc_majeure', 'nc_mineure', 'non_conforme'].includes(e.conformite)).length;
    const totalOk = evaluations.filter(e => e.conformite === 'conforme').length;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
    doc.text(`Mesures évaluées : ${evaluations.length}  ·  Conformes : ${totalOk}  ·  Non conformités : ${totalNc}`, M, y);
    y += 10;

    // Par domaine
    for (const domaine of sortedDomaines(referentiel)) {
        const ids = new Set();
        for (const o of domaine.objectifs || []) for (const m of o.mesures || []) ids.add(m.id);
        const evs = evaluations.filter(e => ids.has(e.mesure_id));
        if (evs.length === 0) continue;

        doc.addPage();
        drawHeader(doc, logo, '5. Faits constatés');
        y = 28;

        // Bandeau domaine
        doc.setFillColor(...NAVY);
        doc.roundedRect(M, y, CW, 13, 2, 2, 'F');
        doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
        doc.text(domaine.nom || domaine.code || '', M + 6, y + 9);
        const conf = evs.filter(e => e.conformite === 'conforme').length;
        const ncMaj = evs.filter(e => e.conformite === 'nc_majeure').length;
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
        doc.text(`${evs.length} mesures · Conformes : ${conf} · NC Maj. : ${ncMaj}`, W - M - 5, y + 9, { align: 'right' });
        y += 18;

        autoTable(doc, {
            startY: y,
            head: [['Code', 'Mesure / Exigence', 'Conformité', 'Mat.', 'Constat', 'Recommandation']],
            body: evs.map(ev => {
                const inf = mesureMap[ev.mesure_id];
                const mat = ev.niveau_maturite != null && ev.niveau_maturite >= 0 ? `${ev.niveau_maturite}/5` : 'N/A';
                return [
                    inf?.mesure?.code || `M${ev.mesure_id}`,
                    inf?.mesure?.description || '—',
                    CONFORMITE[ev.conformite] || ev.conformite,
                    mat,
                    ev.commentaire || '—',
                    ev.recommandation || '—',
                ];
            }),
            styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [40, 40, 40], textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: LIGHT },
            columnStyles: {
                0: { cellWidth: 16 }, 1: { cellWidth: 37 }, 2: { cellWidth: 27 },
                3: { cellWidth: 11, halign: 'center' }, 4: { cellWidth: 39 }, 5: { cellWidth: 40 },
            },
            margin: { left: M, right: M, top: 28, bottom: 16 },
            didParseCell: d => {
                if (d.section === 'body' && d.column.index === 2) {
                    const v = d.cell.raw;
                    if (v === 'NC Majeure' || v === 'Non conforme') { d.cell.styles.textColor = [220, 38, 38]; d.cell.styles.fontStyle = 'bold'; }
                    else if (v === 'NC Mineure') d.cell.styles.textColor = [234, 88, 12];
                    else if (v === 'Conforme') d.cell.styles.textColor = [22, 163, 74];
                    else if (v === 'Partiellement conforme') d.cell.styles.textColor = [161, 98, 7];
                }
            },
            didDrawPage: d => {
                if (d.pageNumber > 1) {
                    drawHeader(doc, logo, '5. Faits constatés');
                    doc.setFillColor(...NAVY);
                    doc.roundedRect(M, 26, CW, 9, 1.5, 1.5, 'F');
                    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
                    doc.text(`${domaine.nom || domaine.code || ''} (suite)`, M + 5, 32);
                }
            },
        });
    }
}

// ─── RECOMMANDATIONS ──────────────────────────────────────────────────────────
function renderRecommandations(doc, planActions, mesureMap, logo) {
    drawHeader(doc, logo, '6. Recommandations');
    let y = 32;
    y = sectionTitle(doc, 6, 'Recommandations et plans d\'actions', y);
    y = bodyText(doc, `${planActions.length} plan(s) d'action ont été définis à l'issue de cet audit. Ils sont classés par priorité décroissante afin de guider l'entité dans la mise en œuvre des mesures correctives.`, y);

    const pCards = [
        { label: 'Haute priorité', val: planActions.filter(p => p.priorite === 'haute').length,   color: [220, 38, 38] },
        { label: 'Priorité moyenne', val: planActions.filter(p => p.priorite === 'moyenne').length, color: [234, 88, 12] },
        { label: 'Basse priorité', val: planActions.filter(p => p.priorite === 'basse').length,   color: [22, 163, 74] },
    ];
    const pcW = (CW - 8) / 3;
    pCards.forEach((pc, i) => {
        const px = M + i * (pcW + 4);
        doc.setFillColor(...LIGHT); doc.setDrawColor(...pc.color); doc.setLineWidth(1);
        doc.roundedRect(px, y, pcW, 16, 1.5, 1.5, 'FD');
        doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(...pc.color);
        doc.text(String(pc.val), px + pcW / 2, y + 9.5, { align: 'center' });
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
        doc.text(pc.label, px + pcW / 2, y + 14, { align: 'center' });
    });
    y += 22;

    if (planActions.length === 0) return;

    autoTable(doc, {
        startY: y,
        head: [['Code', 'Description NC', 'Action corrective', 'Responsable', 'Délai', 'Priorité', 'Statut']],
        body: planActions.map(p => {
            const inf = mesureMap[p.mesure_id];
            return [
                inf?.mesure?.code || `M${p.mesure_id}`,
                p.description_nc || '—',
                p.action_corrective || '—',
                p.responsable || '—',
                p.delai ? new Date(p.delai).toLocaleDateString('fr-FR') : '—',
                PRIORITE[p.priorite] || p.priorite || '—',
                STATUT_PLAN[p.statut] || p.statut || '—',
            ];
        }),
        styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: RED, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: {
            0: { cellWidth: 14 }, 1: { cellWidth: 31 }, 2: { cellWidth: 38 },
            3: { cellWidth: 24 }, 4: { cellWidth: 18 }, 5: { cellWidth: 18 }, 6: { cellWidth: 16 },
        },
        margin: { left: M, right: M, top: 28, bottom: 16 },
        didParseCell: d => {
            if (d.section === 'body' && d.column.index === 5) {
                if (d.cell.raw === 'Haute') { d.cell.styles.textColor = [220, 38, 38]; d.cell.styles.fontStyle = 'bold'; }
                else if (d.cell.raw === 'Moyenne') d.cell.styles.textColor = [234, 88, 12];
            }
        },
        didDrawPage: () => drawHeader(doc, logo, '6. Recommandations'),
    });
}

// ─── SOA ──────────────────────────────────────────────────────────────────────
function renderSoA(doc, soaEntries, mesureMap, logo) {
    drawHeader(doc, logo, 'Annexe A — SoA');
    let y = 32;

    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text('Annexe A — Déclaration d\'Applicabilité (SoA)', M, y);
    doc.setFillColor(...RED); doc.rect(M, y + 4, 20, 1.5, 'F');
    y += 14;

    const app = soaEntries.filter(s => s.applicable === true).length;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
    doc.text(`${soaEntries.length} mesure(s)  ·  Applicable : ${app}  ·  Non applicable : ${soaEntries.filter(s => s.applicable === false).length}`, M, y);
    y += 8;

    autoTable(doc, {
        startY: y,
        head: [['Dom.', 'Code', 'Mesure', 'App.', 'Justification / Raisons', 'Mise en œuvre', 'Référence']],
        body: soaEntries.map(s => {
            const inf = mesureMap[s.mesure_id];
            const justif = s.applicable === false
                ? (s.justification_exclusion || '—')
                : (Array.isArray(s.raisons_inclusion) && s.raisons_inclusion.length ? s.raisons_inclusion.join(', ') : '—');
            return [
                inf?.domaine?.code || '—',
                inf?.mesure?.code || `M${s.mesure_id}`,
                inf?.mesure?.description || '—',
                s.applicable === true ? 'Oui' : s.applicable === false ? 'Non' : '—',
                justif,
                STATUT_SOA[s.statut_implementation] || s.statut_implementation || '—',
                s.reference_document || '—',
            ];
        }),
        styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [40, 40, 40], textColor: WHITE, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: {
            0: { cellWidth: 14 }, 1: { cellWidth: 16 }, 2: { cellWidth: 42 },
            3: { cellWidth: 14, halign: 'center' }, 4: { cellWidth: 38 }, 5: { cellWidth: 24 }, 6: { cellWidth: 22 },
        },
        margin: { left: M, right: M, top: 28, bottom: 16 },
        didParseCell: d => {
            if (d.section === 'body' && d.column.index === 3) {
                if (d.cell.raw === 'Oui') d.cell.styles.textColor = [22, 163, 74];
                if (d.cell.raw === 'Non') d.cell.styles.textColor = [220, 38, 38];
            }
        },
        didDrawPage: () => drawHeader(doc, logo, 'Annexe A — SoA'),
    });
}

// ─── EXPORT PRINCIPAL ─────────────────────────────────────────────────────────
export async function exportAuditReportPDF({ audit, evaluations, planActions, soaEntries, referentiel, logoDataprotectUrl }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const logo    = logoDataprotectUrl ? await loadLogo(logoDataprotectUrl) : { b64: null, ar: 4 };
    const year    = new Date().getFullYear();
    const today   = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const refCode = `RA-${audit.id}-${year}`;
    const mesureMap = buildMesureMap(referentiel);
    const stats     = buildStats(evaluations);

    // ── 1. Couverture (page 1)
    renderCover(doc, audit, logo, refCode, today);

    // ── 2. Sommaire placeholder (page 2)
    doc.addPage();
    const TOC_PAGE = doc.internal.getNumberOfPages();

    // ── 3. Introduction (page 3+)
    doc.addPage();
    const introPage = doc.internal.getNumberOfPages();
    renderIntroduction(doc, audit, logo);

    // ── 4. Résumé exécutif
    doc.addPage();
    const resumePage = doc.internal.getNumberOfPages();
    await renderResume(doc, audit, stats, evaluations, planActions, referentiel, logo);

    // ── 5. Terminologie
    doc.addPage();
    const termsPage = doc.internal.getNumberOfPages();
    renderTerminologie(doc, logo);

    // ── 6. Plan d'audit
    doc.addPage();
    const planPage = doc.internal.getNumberOfPages();
    renderPlanAudit(doc, audit, referentiel, logo);

    // ── 7. Faits constatés
    doc.addPage();
    const factsPage = doc.internal.getNumberOfPages();
    renderFaitsConstates(doc, audit, evaluations, mesureMap, referentiel, logo);

    // ── 8. Recommandations
    doc.addPage();
    const recoPage = doc.internal.getNumberOfPages();
    renderRecommandations(doc, planActions, mesureMap, logo);

    // ── Annexe SoA (optionnelle)
    let soaPage = null;
    if (soaEntries?.length > 0) {
        doc.addPage();
        soaPage = doc.internal.getNumberOfPages();
        renderSoA(doc, soaEntries, mesureMap, logo);
    }

    // ── Footers (toutes les pages)
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        drawFooter(doc, p, totalPages, refCode);
    }

    // ── Sommaire (retour page 2, numéros connus)
    console.log('[PDF] TOC...');
    const sections = [
        { title: '1. Introduction',                                    page: introPage },
        { title: '2. Résumé exécutif',                                 page: resumePage },
        { title: '3. Terminologie et définitions',                     page: termsPage },
        { title: '4. Plan d\'audit',                                   page: planPage },
        { title: '5. Faits constatés',                                 page: factsPage },
        { title: '6. Recommandations et plans d\'actions',             page: recoPage },
        ...(soaPage ? [{ title: 'Annexe A — Déclaration d\'Applicabilité', page: soaPage, sub: false }] : []),
    ];
    renderTOC(doc, logo, sections, TOC_PAGE);

    console.log('[PDF] saving...');
    doc.save(`rapport-audit-${(audit.nom || 'audit').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${year}.pdf`);
    console.log('[PDF] done');
}
