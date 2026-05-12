import * as XLSX from 'xlsx';

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

function autoColWidth(rows) {
    if (!rows.length) return [];
    const cols = rows[0].length;
    return Array.from({ length: cols }, (_, c) =>
        ({ wch: Math.min(60, Math.max(10, ...rows.map(r => String(r[c] ?? '').length))) })
    );
}

export function exportAuditReportExcel({ audit, evaluations, planActions, soaEntries, referentiel }) {
    const wb = XLSX.utils.book_new();
    const mesureMap = buildMesureMap(referentiel);
    const today = new Date().toLocaleDateString('fr-FR');
    const year = new Date().getFullYear();

    // ─── Synthèse ──────────────────────────────────────────────────────────
    const counts = { conforme: 0, partiel: 0, nc_mineure: 0, nc_majeure: 0, non_conforme: 0, na: 0 };
    let totalMaturite = 0, countMaturite = 0;
    for (const ev of evaluations) {
        const c = ev.conformite || 'na';
        if (c in counts) counts[c]++;
        if (ev.niveau_maturite !== null && ev.niveau_maturite !== undefined && ev.niveau_maturite >= 0) {
            totalMaturite += ev.niveau_maturite;
            countMaturite++;
        }
    }
    const total = evaluations.length;
    const maturiteMoyenne = countMaturite > 0 ? (totalMaturite / countMaturite).toFixed(1) : 'N/A';
    const tauxConformite = total > 0 ? `${Math.round((counts.conforme / total) * 100)} %` : '0 %';
    const auditeurs = audit.auditeurs?.map(a => `${a.prenom} ${a.nom}`).join(', ') || '—';
    const periode = audit.date_debut && audit.date_fin
        ? `${new Date(audit.date_debut).toLocaleDateString('fr-FR')} → ${new Date(audit.date_fin).toLocaleDateString('fr-FR')}`
        : '—';

    const synthRows = [
        ['RAPPORT D\'AUDIT DE SÉCURITÉ', ''],
        ['', ''],
        ['Nom de l\'audit', audit.nom || ''],
        ['Client', audit.client || ''],
        ['Référentiel', audit.referentiel?.nom || '—'],
        ['Phase', PHASE_LABELS[audit.phase] || audit.phase],
        ['Statut', STATUT_LABELS[audit.statut] || audit.statut],
        ['Période', periode],
        ['Auditeurs', auditeurs],
        ['Périmètre', audit.perimetre || '—'],
        ['Date d\'export', today],
        ['', ''],
        ['SYNTHÈSE DE CONFORMITÉ', ''],
        ['Statut de conformité', 'Nb mesures', 'Pourcentage'],
        ...Object.entries(counts).map(([k, v]) => [
            CONFORMITE_LABELS[k] || k,
            v,
            total ? `${Math.round((v / total) * 100)} %` : '0 %',
        ]),
        ['', '', ''],
        ['Taux de conformité global', tauxConformite, ''],
        ['Maturité moyenne', maturiteMoyenne, ''],
        ['Total mesures évaluées', total, ''],
        ['Plans d\'actions', planActions.length, ''],
    ];

    const wsSynth = XLSX.utils.aoa_to_sheet(synthRows);
    wsSynth['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSynth, 'Synthèse');

    // ─── Évaluations ───────────────────────────────────────────────────────
    const evHeaders = [
        'Domaine', 'Code Domaine', 'Objectif', 'Code Mesure',
        'Description Mesure', 'Conformité', 'Niveau Maturité',
        'Libellé Maturité', 'Constat', 'Recommandation',
    ];
    const evRows = evaluations.map(ev => {
        const info = mesureMap[ev.mesure_id];
        const niv = ev.niveau_maturite;
        return [
            info?.domaine?.nom || '—',
            info?.domaine?.code || '—',
            info?.objectif?.description || info?.objectif?.code || '—',
            info?.mesure?.code || `M${ev.mesure_id}`,
            info?.mesure?.description || '—',
            CONFORMITE_LABELS[ev.conformite] || ev.conformite,
            niv !== null && niv !== undefined && niv >= 0 ? niv : '',
            niv !== null && niv !== undefined && niv >= 0 ? (MATURITE_LABELS[niv] || '') : 'N/A',
            ev.commentaire || '',
            ev.recommandation || '',
        ];
    });
    const wsEv = XLSX.utils.aoa_to_sheet([evHeaders, ...evRows]);
    wsEv['!cols'] = autoColWidth([evHeaders, ...evRows]);
    XLSX.utils.book_append_sheet(wb, wsEv, 'Évaluations');

    // ─── Plans d'actions ───────────────────────────────────────────────────
    const planHeaders = [
        'Code Mesure', 'Description Mesure', 'Description NC',
        'Action corrective', 'Responsable', 'Délai', 'Priorité',
        'Statut', 'Criticité', 'KPI',
    ];
    const planRows = planActions.map(p => {
        const info = mesureMap[p.mesure_id];
        return [
            info?.mesure?.code || `M${p.mesure_id}`,
            info?.mesure?.description || '—',
            p.description_nc || '',
            p.action_corrective || '',
            p.responsable || '',
            p.delai ? new Date(p.delai).toLocaleDateString('fr-FR') : '',
            PRIORITE_LABELS[p.priorite] || p.priorite || '',
            STATUT_PLAN_LABELS[p.statut] || p.statut || '',
            p.criticite ?? '',
            p.kpi || '',
        ];
    });
    const wsPlan = XLSX.utils.aoa_to_sheet([planHeaders, ...planRows]);
    wsPlan['!cols'] = autoColWidth([planHeaders, ...planRows]);
    XLSX.utils.book_append_sheet(wb, wsPlan, "Plans d'actions");

    // ─── SoA ───────────────────────────────────────────────────────────────
    if (soaEntries?.length > 0) {
        const soaHeaders = [
            'Domaine', 'Code Mesure', 'Description Mesure',
            'Applicable', 'Raisons d\'inclusion', 'Justification exclusion',
            'Statut mise en œuvre', 'Référence document',
        ];
        const soaRows = soaEntries.map(s => {
            const info = mesureMap[s.mesure_id];
            return [
                info?.domaine?.nom || '—',
                info?.mesure?.code || `M${s.mesure_id}`,
                info?.mesure?.description || '—',
                s.applicable === true ? 'Oui' : s.applicable === false ? 'Non' : 'Non décidé',
                Array.isArray(s.raisons_inclusion) && s.raisons_inclusion.length > 0 ? s.raisons_inclusion.join(', ') : '',
                s.justification_exclusion || '',
                STATUT_SOA_LABELS[s.statut_implementation] || s.statut_implementation || '',
                s.reference_document || '',
            ];
        });
        const wsSoa = XLSX.utils.aoa_to_sheet([soaHeaders, ...soaRows]);
        wsSoa['!cols'] = autoColWidth([soaHeaders, ...soaRows]);
        XLSX.utils.book_append_sheet(wb, wsSoa, 'SoA');
    }

    const filename = `rapport-audit-${(audit.nom || 'audit').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${year}.xlsx`;
    XLSX.writeFile(wb, filename);
}
