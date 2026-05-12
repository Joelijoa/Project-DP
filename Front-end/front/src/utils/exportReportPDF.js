import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RED = [204, 0, 0];
const DARK = [17, 17, 17];
const GRAY_TEXT = [107, 114, 128];
const LIGHT_BG = [249, 250, 251];
const WHITE = [255, 255, 255];
const MARGIN = 20;

const CONFORMITE_LABELS = {
    conforme: 'Conforme',
    partiel: 'Partiellement conforme',
    non_conforme: 'Non conforme',
    nc_mineure: 'NC Mineure',
    nc_majeure: 'NC Majeure',
    na: 'N/A',
};

const PHASE_LABELS = {
    cadrage: 'Cadrage',
    prerequis: 'Prérequis',
    revue_documentaire: 'Revue documentaire',
    realisation: 'Réalisation',
    termine: 'Terminé',
};

const STATUT_LABELS = {
    brouillon: 'Brouillon',
    en_cours: 'En cours',
    termine: 'Terminé',
    archive: 'Archivé',
};

const MATURITE_LABELS = ['Aucun', 'Initial', 'Reproductible', 'Défini', 'Maîtrisé', 'Optimisé'];
const PRIORITE_LABELS = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' };
const STATUT_PLAN_LABELS = { a_faire: 'À faire', en_cours: 'En cours', cloture: 'Clôturé' };
const STATUT_SOA_LABELS = {
    non_implemente: 'Non implémenté',
    planifie: 'Planifié',
    partiel: 'Partiel',
    implemente: 'Implémenté',
};

async function imgToBase64(url) {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

function drawPageHeader(doc, logoDP) {
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(...RED);
    doc.rect(0, 0, W, 8, 'F');
    if (logoDP) {
        doc.addImage(logoDP, 'PNG', MARGIN, 10, 32, 9, '', 'FAST');
    }
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 22, W - MARGIN, 22);
}

function drawFooter(doc, pageNum, totalPages, refCode) {
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, H - 14, W - MARGIN, H - 14);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text(`© ${new Date().getFullYear()} DataProtect · Document confidentiel — Usage restreint aux parties concernées`, MARGIN, H - 8);
    doc.text(`${pageNum} / ${totalPages}`, W / 2, H - 8, { align: 'center' });
    doc.text(refCode, W - MARGIN, H - 8, { align: 'right' });
}

function buildMesureMap(referentiel) {
    const map = {};
    if (!referentiel?.domaines) return map;
    for (const domaine of referentiel.domaines) {
        for (const objectif of domaine.objectifs || []) {
            for (const mesure of objectif.mesures || []) {
                map[mesure.id] = { mesure, objectif, domaine };
            }
        }
    }
    return map;
}

function buildStats(evaluations) {
    const counts = { conforme: 0, partiel: 0, nc_mineure: 0, nc_majeure: 0, non_conforme: 0, na: 0 };
    let totalMaturite = 0;
    let countMaturite = 0;
    for (const ev of evaluations) {
        const c = ev.conformite || 'na';
        if (c in counts) counts[c]++;
        if (ev.niveau_maturite !== null && ev.niveau_maturite !== undefined && ev.niveau_maturite >= 0) {
            totalMaturite += ev.niveau_maturite;
            countMaturite++;
        }
    }
    return {
        counts,
        total: evaluations.length,
        maturiteMoyenne: countMaturite > 0 ? (totalMaturite / countMaturite).toFixed(1) : 'N/A',
        tauxConformite: evaluations.length > 0 ? Math.round((counts.conforme / evaluations.length) * 100) : 0,
    };
}

function conformiteColor(val) {
    if (val === 'Conforme') return [22, 163, 74];
    if (val === 'NC Majeure' || val === 'Non conforme') return [220, 38, 38];
    if (val === 'NC Mineure') return [234, 88, 12];
    if (val === 'Partiellement conforme') return [161, 98, 7];
    return GRAY_TEXT;
}

export async function exportAuditReportPDF({ audit, evaluations, planActions, soaEntries, referentiel, logoDataprotectUrl }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const logoDP = logoDataprotectUrl ? await imgToBase64(logoDataprotectUrl) : null;
    const year = new Date().getFullYear();
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const refCode = `RA-${audit.id}-${year}`;

    const mesureMap = buildMesureMap(referentiel);
    const { counts, total: totalEvals, maturiteMoyenne, tauxConformite } = buildStats(evaluations);
    const auditeurs = audit.auditeurs?.map(a => `${a.prenom} ${a.nom}`).join(', ') || '—';
    const periode = audit.date_debut && audit.date_fin
        ? `${new Date(audit.date_debut).toLocaleDateString('fr-FR')} → ${new Date(audit.date_fin).toLocaleDateString('fr-FR')}`
        : '—';

    const didDrawPageContinuation = (data) => {
        if (data.pageNumber > 1) drawPageHeader(doc, logoDP);
    };

    // ────────────────────────────────────────────────────────────────────────
    // PAGE 1 — COUVERTURE
    // ────────────────────────────────────────────────────────────────────────

    // Red top band
    doc.setFillColor(...RED);
    doc.rect(0, 0, W, 55, 'F');

    // Logo in band
    if (logoDP) {
        doc.addImage(logoDP, 'PNG', MARGIN, 13, 40, 12, '', 'FAST');
    }

    // CONFIDENTIEL badge
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('■ DOCUMENT CONFIDENTIEL', W - MARGIN, 20, { align: 'right' });

    // Subtitle label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 180, 180);
    doc.text('DataProtect — Rapport d\'audit de sécurité', MARGIN, 44);

    // Audit name
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    const nomLines = doc.splitTextToSize(audit.nom || 'Rapport d\'audit', W - 40);
    doc.text(nomLines, MARGIN, 72);

    const afterName = 72 + nomLines.length * 9;

    // Client
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY_TEXT);
    doc.text(audit.client || '', MARGIN, afterName + 4);

    // Red separator
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, afterName + 12, W - MARGIN, afterName + 12);

    // Info box
    const boxY = afterName + 18;
    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGIN, boxY, W - 40, 60, 3, 3, 'FD');

    const infoRows = [
        ['Référentiel', audit.referentiel?.nom || '—'],
        ['Phase', PHASE_LABELS[audit.phase] || audit.phase],
        ['Statut', STATUT_LABELS[audit.statut] || audit.statut],
        ['Période', periode],
        ['Auditeurs', auditeurs],
        ['Périmètre', audit.perimetre || '—'],
    ];

    doc.setFontSize(9);
    infoRows.forEach(([label, value], i) => {
        const iy = boxY + 9 + i * 8.5;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GRAY_TEXT);
        doc.text(label, MARGIN + 6, iy);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK);
        doc.text(String(value), MARGIN + 50, iy, { maxWidth: W - MARGIN - 50 - 10 });
    });

    // Generated date + ref
    const metaY = boxY + 68;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY_TEXT);
    doc.text(`Rapport généré le ${today}`, MARGIN, metaY);
    doc.text(`Référence document : ${refCode}`, MARGIN, metaY + 6);

    // ────────────────────────────────────────────────────────────────────────
    // PAGE 2 — SYNTHÈSE EXÉCUTIVE
    // ────────────────────────────────────────────────────────────────────────
    doc.addPage();
    drawPageHeader(doc, logoDP);

    let y = 32;

    // Section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Synthèse exécutive', MARGIN, y);
    doc.setDrawColor(...RED);
    doc.setLineWidth(1);
    doc.line(MARGIN, y + 3, MARGIN + 60, y + 3);
    y += 16;

    // KPI cards
    const kpiCards = [
        { label: 'Mesures évaluées', value: String(totalEvals) },
        { label: 'Conformes', value: String(counts.conforme) },
        { label: 'NC Majeures', value: String(counts.nc_majeure) },
        { label: 'Plans d\'actions', value: String(planActions.length) },
    ];
    const cardW = (W - 40 - 9) / 4;
    kpiCards.forEach((card, i) => {
        const cx = MARGIN + i * (cardW + 3);
        doc.setFillColor(...LIGHT_BG);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.4);
        doc.roundedRect(cx, y, cardW, 22, 2, 2, 'FD');
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...RED);
        doc.text(card.value, cx + cardW / 2, y + 12, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY_TEXT);
        doc.text(card.label, cx + cardW / 2, y + 18.5, { align: 'center' });
    });
    y += 30;

    // Taux + maturité
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY_TEXT);
    doc.text('Taux de conformité : ', MARGIN, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...RED);
    doc.text(`${tauxConformite} %`, MARGIN + 42, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY_TEXT);
    doc.text('   Maturité moyenne : ', MARGIN + 60, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...RED);
    doc.text(`${maturiteMoyenne} / 5`, MARGIN + 105, y);
    y += 8;

    // Conformité breakdown table
    autoTable(doc, {
        startY: y,
        head: [['Statut de conformité', 'Nb mesures', 'Pourcentage']],
        body: Object.entries(counts).map(([k, v]) => [
            CONFORMITE_LABELS[k] || k,
            String(v),
            `${totalEvals ? Math.round((v / totalEvals) * 100) : 0} %`,
        ]),
        styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
        headStyles: { fillColor: RED, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: LIGHT_BG },
        columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 35, halign: 'center' },
            2: { cellWidth: 35, halign: 'center' },
        },
        margin: { left: MARGIN, right: MARGIN },
        didDrawPage: didDrawPageContinuation,
    });

    y = doc.lastAutoTable.finalY + 14;

    // Synthèse par domaine
    if (referentiel?.domaines?.length > 0) {
        if (y > H - 80) { doc.addPage(); drawPageHeader(doc, logoDP); y = 32; }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text('Répartition par domaine', MARGIN, y);
        doc.setDrawColor(...RED);
        doc.setLineWidth(0.6);
        doc.line(MARGIN, y + 2, MARGIN + 70, y + 2);
        y += 8;

        const domaineRows = referentiel.domaines.map(domaine => {
            const ids = new Set();
            for (const obj of domaine.objectifs || []) for (const m of obj.mesures || []) ids.add(m.id);
            const evs = evaluations.filter(e => ids.has(e.mesure_id));
            const nb = evs.length;
            const conf = evs.filter(e => e.conformite === 'conforme').length;
            const ncMaj = evs.filter(e => e.conformite === 'nc_majeure').length;
            return [
                `${domaine.code} — ${domaine.nom || ''}`,
                String(nb),
                String(conf),
                String(ncMaj),
                nb > 0 ? `${Math.round((conf / nb) * 100)} %` : '—',
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Domaine', 'Mesures', 'Conformes', 'NC Maj.', 'Taux']],
            body: domaineRows,
            styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
            headStyles: { fillColor: DARK, textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: LIGHT_BG },
            columnStyles: {
                0: { cellWidth: 100 },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 22, halign: 'center' },
                3: { cellWidth: 18, halign: 'center' },
                4: { cellWidth: 20, halign: 'center' },
            },
            margin: { left: MARGIN, right: MARGIN, top: 28 },
            didDrawPage: didDrawPageContinuation,
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // PAGES ÉVALUATIONS PAR DOMAINE
    // ────────────────────────────────────────────────────────────────────────
    if (referentiel?.domaines) {
        for (const domaine of referentiel.domaines) {
            const ids = new Set();
            for (const obj of domaine.objectifs || []) for (const m of obj.mesures || []) ids.add(m.id);
            const domaineEvals = evaluations.filter(e => ids.has(e.mesure_id));
            if (domaineEvals.length === 0) continue;

            doc.addPage();
            drawPageHeader(doc, logoDP);
            y = 32;

            // Domain banner
            doc.setFillColor(...RED);
            doc.roundedRect(MARGIN, y, W - 40, 13, 2, 2, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...WHITE);
            doc.text(`${domaine.code} — ${domaine.nom || ''}`, MARGIN + 5, y + 8.5);
            y += 18;

            const evRows = domaineEvals.map(ev => {
                const info = mesureMap[ev.mesure_id];
                const mLabel = ev.niveau_maturite !== null && ev.niveau_maturite !== undefined && ev.niveau_maturite >= 0
                    ? `${ev.niveau_maturite} – ${MATURITE_LABELS[ev.niveau_maturite] || ''}`
                    : 'N/A';
                const cLabel = CONFORMITE_LABELS[ev.conformite] || ev.conformite;
                return [
                    info?.mesure?.code || `M${ev.mesure_id}`,
                    info?.mesure?.description || '—',
                    cLabel,
                    mLabel,
                    ev.commentaire || '—',
                    ev.recommandation || '—',
                ];
            });

            autoTable(doc, {
                startY: y,
                head: [['Code', 'Mesure', 'Conformité', 'Maturité', 'Constat', 'Recommandation']],
                body: evRows,
                styles: { fontSize: 7.5, cellPadding: 2.2, overflow: 'linebreak', font: 'helvetica' },
                headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                alternateRowStyles: { fillColor: LIGHT_BG },
                columnStyles: {
                    0: { cellWidth: 16 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 28 },
                    3: { cellWidth: 22 },
                    4: { cellWidth: 32 },
                    5: { cellWidth: 32 },
                },
                margin: { left: MARGIN, right: MARGIN, top: 28, bottom: 16 },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 2) {
                        const color = conformiteColor(data.cell.raw);
                        data.cell.styles.textColor = color;
                        if (data.cell.raw === 'NC Majeure' || data.cell.raw === 'Non conforme') {
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                },
                didDrawPage: (data) => {
                    if (data.pageNumber > 1) {
                        drawPageHeader(doc, logoDP);
                        // Redraw domain banner on continuation pages
                        const curY = doc.lastAutoTable?.settings?.margin?.top ?? 28;
                        doc.setFillColor(...RED);
                        doc.roundedRect(MARGIN, curY - 16, W - 40, 10, 2, 2, 'F');
                        doc.setFontSize(8.5);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(...WHITE);
                        doc.text(`${domaine.code} — ${domaine.nom || ''} (suite)`, MARGIN + 4, curY - 9);
                    }
                },
            });
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // PAGE PLANS D'ACTIONS
    // ────────────────────────────────────────────────────────────────────────
    if (planActions.length > 0) {
        doc.addPage();
        drawPageHeader(doc, logoDP);
        y = 32;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text('Plans d\'actions', MARGIN, y);
        doc.setDrawColor(...RED);
        doc.setLineWidth(1);
        doc.line(MARGIN, y + 3, MARGIN + 55, y + 3);
        y += 12;

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY_TEXT);
        doc.text(`${planActions.length} plan(s) d'action identifié(s)`, MARGIN, y);
        y += 8;

        const planRows = planActions.map(p => {
            const info = mesureMap[p.mesure_id];
            return [
                info?.mesure?.code || `M${p.mesure_id}`,
                p.description_nc || '—',
                p.action_corrective || '—',
                p.responsable || '—',
                p.delai ? new Date(p.delai).toLocaleDateString('fr-FR') : '—',
                PRIORITE_LABELS[p.priorite] || p.priorite || '—',
                STATUT_PLAN_LABELS[p.statut] || p.statut || '—',
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Code', 'Description NC', 'Action corrective', 'Responsable', 'Délai', 'Priorité', 'Statut']],
            body: planRows,
            styles: { fontSize: 7.5, cellPadding: 2.2, overflow: 'linebreak', font: 'helvetica' },
            headStyles: { fillColor: RED, textColor: 255, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: LIGHT_BG },
            columnStyles: {
                0: { cellWidth: 14 },
                1: { cellWidth: 32 },
                2: { cellWidth: 36 },
                3: { cellWidth: 24 },
                4: { cellWidth: 18 },
                5: { cellWidth: 18 },
                6: { cellWidth: 18 },
            },
            margin: { left: MARGIN, right: MARGIN, top: 28, bottom: 16 },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 5) {
                    if (data.cell.raw === 'Haute') {
                        data.cell.styles.textColor = [220, 38, 38];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.cell.raw === 'Moyenne') {
                        data.cell.styles.textColor = [234, 88, 12];
                    }
                }
            },
            didDrawPage: didDrawPageContinuation,
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // PAGE SOA
    // ────────────────────────────────────────────────────────────────────────
    if (soaEntries?.length > 0) {
        doc.addPage();
        drawPageHeader(doc, logoDP);
        y = 32;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text('Déclaration d\'Applicabilité (SoA)', MARGIN, y);
        doc.setDrawColor(...RED);
        doc.setLineWidth(1);
        doc.line(MARGIN, y + 3, MARGIN + 95, y + 3);
        y += 12;

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY_TEXT);
        const applicable = soaEntries.filter(s => s.applicable === true).length;
        const nonApplicable = soaEntries.filter(s => s.applicable === false).length;
        doc.text(`${soaEntries.length} mesure(s) — Applicable : ${applicable}  ·  Non applicable : ${nonApplicable}`, MARGIN, y);
        y += 8;

        const soaRows = soaEntries.map(s => {
            const info = mesureMap[s.mesure_id];
            const appLabel = s.applicable === true ? 'Oui' : s.applicable === false ? 'Non' : '—';
            const justif = s.applicable === false
                ? (s.justification_exclusion || '—')
                : (Array.isArray(s.raisons_inclusion) && s.raisons_inclusion.length > 0 ? s.raisons_inclusion.join(', ') : '—');
            return [
                info?.domaine?.code || '—',
                info?.mesure?.code || `M${s.mesure_id}`,
                info?.mesure?.description || '—',
                appLabel,
                justif,
                STATUT_SOA_LABELS[s.statut_implementation] || s.statut_implementation || '—',
                s.reference_document || '—',
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Dom.', 'Code', 'Mesure', 'Applicable', 'Justification / Raisons', 'Mise en œuvre', 'Référence']],
            body: soaRows,
            styles: { fontSize: 7.5, cellPadding: 2.2, overflow: 'linebreak', font: 'helvetica' },
            headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: LIGHT_BG },
            columnStyles: {
                0: { cellWidth: 14 },
                1: { cellWidth: 16 },
                2: { cellWidth: 44 },
                3: { cellWidth: 18, halign: 'center' },
                4: { cellWidth: 38 },
                5: { cellWidth: 24 },
                6: { cellWidth: 16 },
            },
            margin: { left: MARGIN, right: MARGIN, top: 28, bottom: 16 },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 3) {
                    if (data.cell.raw === 'Oui') data.cell.styles.textColor = [22, 163, 74];
                    if (data.cell.raw === 'Non') data.cell.styles.textColor = [220, 38, 38];
                }
            },
            didDrawPage: didDrawPageContinuation,
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // FOOTERS (loop final pour numérotation correcte)
    // ────────────────────────────────────────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        drawFooter(doc, p, totalPages, refCode);
    }

    const filename = `rapport-audit-${(audit.nom || 'audit').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${year}.pdf`;
    doc.save(filename);
}
