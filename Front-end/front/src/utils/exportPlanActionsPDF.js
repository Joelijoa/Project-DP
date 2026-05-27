import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const NAVY  = [15, 23, 42];
const RED   = [204, 0, 0];
const LIGHT = [248, 250, 252];
const BDR   = [226, 232, 240];
const GRAY  = [100, 116, 139];
const WHITE = [255, 255, 255];
const M = 18;

const PRIORITE    = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' };
const STATUT_PLAN = { a_faire: 'À faire', en_cours: 'En cours', cloture: 'Clôturé' };

const PRIORITE_COLOR = {
    haute:   [220, 38, 38],
    moyenne: [234, 88, 12],
    basse:   [59, 130, 246],
};

export function exportPlanActionsPDF({ plans, auditNom, clientNom, referentiel }) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297;

    // ── Header ────────────────────────────────────────────────────────────────
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 22, 'F');
    doc.setFillColor(...RED);
    doc.rect(0, 22, W, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...WHITE);
    doc.text('PLAN D\'ACTIONS', M, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Audit : ${auditNom || '—'}${clientNom ? `  |  Client : ${clientNom}` : ''}`, M, 19);
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, W - M, 19, { align: 'right' });

    // ── Stats summary ─────────────────────────────────────────────────────────
    const counts = { a_faire: 0, en_cours: 0, cloture: 0 };
    plans.forEach(p => { if (counts[p.statut] !== undefined) counts[p.statut]++; });

    const stats = [
        { label: 'Total', value: plans.length, color: NAVY },
        { label: 'À faire', value: counts.a_faire, color: [107, 114, 128] },
        { label: 'En cours', value: counts.en_cours, color: [234, 88, 12] },
        { label: 'Clôturés', value: counts.cloture, color: [22, 163, 74] },
    ];
    const boxW = 38;
    let bx = M;
    stats.forEach(s => {
        doc.setFillColor(...LIGHT);
        doc.roundedRect(bx, 28, boxW, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...s.color);
        doc.text(String(s.value), bx + boxW / 2, 36, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text(s.label, bx + boxW / 2, 40, { align: 'center' });
        bx += boxW + 4;
    });

    // ── Table ─────────────────────────────────────────────────────────────────
    const rows = plans.map(p => [
        p.mesure?.code || `#${p.mesure_id}`,
        p.action_corrective || p.description_nc || '—',
        p.responsable || '—',
        p.delai ? new Date(p.delai).toLocaleDateString('fr-FR') : '—',
        PRIORITE[p.priorite] || p.priorite || '—',
        STATUT_PLAN[p.statut] || p.statut || '—',
    ]);

    autoTable(doc, {
        startY: 46,
        head: [['Mesure', 'Action corrective', 'Responsable', 'Délai', 'Priorité', 'Statut']],
        body: rows,
        margin: { left: M, right: M },
        styles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, font: 'helvetica', textColor: NAVY, lineColor: BDR, lineWidth: 0.1 },
        headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5 },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: {
            0: { cellWidth: 48, fontStyle: 'bold' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 32 },
            3: { cellWidth: 24 },
            4: { cellWidth: 22 },
            5: { cellWidth: 24 },
        },
        didDrawCell(data) {
            if (data.section === 'body' && data.column.index === 4) {
                const plan = plans[data.row.index];
                const color = PRIORITE_COLOR[plan?.priorite];
                if (color && data.cell.text[0]) {
                    doc.setTextColor(...color);
                    doc.setFont('helvetica', 'bold');
                    doc.text(data.cell.text[0], data.cell.x + data.cell.padding('left'), data.cell.y + data.cell.height / 2 + 2.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(...NAVY);
                }
            }
        },
        willDrawCell(data) {
            if (data.section === 'body' && data.column.index === 4) {
                data.cell.text = [];
            }
        },
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text(`Page ${i} / ${pageCount}`, W / 2, 205, { align: 'center' });
    }

    const safeName = (auditNom || 'audit').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`plan_actions_${safeName}.pdf`);
}
