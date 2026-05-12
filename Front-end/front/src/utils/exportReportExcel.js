import * as XLSX from 'xlsx';

const PHASE_LABELS  = { cadrage: 'Cadrage', prerequis: 'Prérequis', revue_documentaire: 'Revue documentaire', realisation: 'Réalisation', termine: 'Terminé' };
const STATUT_LABELS = { brouillon: 'Brouillon', en_cours: 'En cours', termine: 'Terminé', archive: 'Archivé' };
const CONF_LABELS   = { conforme: 'Conforme', partiel: 'Partiellement conforme', non_conforme: 'Non conforme', nc_mineure: 'NC Mineure', nc_majeure: 'NC Majeure', na: 'N/A' };
const MAT_LABELS    = ['Aucun', 'Initial', 'Reproductible', 'Défini', 'Maîtrisé', 'Optimisé'];
const STATUT_PLAN   = { a_faire: 'À faire', en_cours: 'En cours', cloture: 'Clôturé' };

// Mapping vers les 3 niveaux DNSSI
const CONF_DNSSI = { conforme: 'Totale', partiel: 'Partielle', non_conforme: 'Non conforme', nc_mineure: 'Non conforme', nc_majeure: 'Non conforme', na: 'N/A' };

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

function buildPlanMap(planActions, mesureMap) {
    const map = {};
    for (const p of planActions) {
        const mid = p.mesure_id;
        if (!map[mid]) map[mid] = [];
        map[mid].push(p);
    }
    return map;
}

function autoColWidth(rows) {
    if (!rows.length) return [];
    const cols = Math.max(...rows.map(r => r.length));
    return Array.from({ length: cols }, (_, c) =>
        ({ wch: Math.min(60, Math.max(12, ...rows.map(r => String(r[c] ?? '').length))) })
    );
}

// ─── ONGLET 1 : Synthèse audit (différent du modèle DNSSI) ────────────────────
function buildSyntheseSheet(audit, evaluations, planActions) {
    const counts = { conforme: 0, partiel: 0, nc_mineure: 0, nc_majeure: 0, non_conforme: 0, na: 0 };
    let sumMat = 0, nMat = 0;
    for (const ev of evaluations) {
        const c = ev.conformite || 'na';
        if (c in counts) counts[c]++;
        if (ev.niveau_maturite != null && ev.niveau_maturite >= 0) { sumMat += ev.niveau_maturite; nMat++; }
    }
    const total    = evaluations.length;
    const matMoy   = nMat > 0 ? (sumMat / nMat).toFixed(1) : 'N/A';
    const tauxConf = total > 0 ? `${Math.round(counts.conforme / total * 100)} %` : '0 %';
    const auditeurs = audit.auditeurs?.map(a => `${a.prenom} ${a.nom}`).join(', ') || '—';
    const periode   = audit.date_debut && audit.date_fin
        ? `${new Date(audit.date_debut).toLocaleDateString('fr-FR')} → ${new Date(audit.date_fin).toLocaleDateString('fr-FR')}`
        : '—';

    const rows = [
        ['RAPPORT D\'AUDIT DE SÉCURITÉ'],
        [],
        ['INFORMATIONS GÉNÉRALES'],
        ['Nom de l\'audit',    audit.nom       || '—'],
        ['Entité / Client',    audit.client    || '—'],
        ['Référentiel',        audit.referentiel?.nom || '—'],
        ['Phase',              PHASE_LABELS[audit.phase]  || audit.phase],
        ['Statut',             STATUT_LABELS[audit.statut] || audit.statut],
        ['Période',            periode],
        ['Auditeur(s)',        auditeurs],
        ['Périmètre',          audit.perimetre || '—'],
        ['Date d\'export',     new Date().toLocaleDateString('fr-FR')],
        [],
        ['SYNTHÈSE DE CONFORMITÉ'],
        ['Niveau de conformité', 'Nb mesures', '% du total'],
        ...Object.entries(counts).map(([k, v]) => [
            CONF_LABELS[k] || k,
            v,
            total ? `${Math.round(v / total * 100)} %` : '0 %',
        ]),
        [],
        ['Taux de conformité global', tauxConf],
        ['Maturité moyenne (0–5)',     matMoy],
        ['Total mesures évaluées',     total],
        ['Nombre de plans d\'actions', planActions.length],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 34 }, { wch: 22 }, { wch: 14 }];
    return ws;
}

// ─── ONGLET 2 : Identification entité ou IIV ──────────────────────────────────
function buildIdentificationSheet(audit) {
    const auditeurs = audit.auditeurs?.map(a => `${a.prenom} ${a.nom}`).join(', ') || '—';
    const rssi      = audit.rssi ? `${audit.rssi.prenom || ''} ${audit.rssi.nom || ''}`.trim() : '—';

    const rows = [
        ['1. Identification de l\'entité ou de l\'IIV'],
        [],
        ['Informations générales'],
        ['Dénomination',           audit.client             || '—'],
        ['Département d\'appartenance', '—'],
        ['Adresse',                audit.entite?.adresse    || '—'],
        ['Ville',                  audit.entite?.ville      || '—'],
        ['Adresse du site web',    audit.entite?.site_web   || '—'],
        [],
        ['Responsable de la Sécurité des SI'],
        ['Nom et Prénom',          rssi],
        ['Rattachement',           '—'],
        ['e-mail',                 audit.rssi?.email        || '—'],
        ['Téléphone',              '—'],
        [],
        ['Gestion du document'],
        ['Auteur de l\'évaluation', auditeurs],
        ['Date de l\'évaluation',  audit.date_debut ? new Date(audit.date_debut).toLocaleDateString('fr-FR') : '—'],
        ['Validé par',             '—'],
        ['Date de validation',     audit.date_fin   ? new Date(audit.date_fin).toLocaleDateString('fr-FR')   : '—'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 32 }, { wch: 50 }];
    return ws;
}

// ─── ONGLET 3 : Evaluation_MO_DNSSI ──────────────────────────────────────────
function buildEvaluationSheet(referentiel, evaluations) {
    const evalMap = buildEvalMap(evaluations);
    const header  = ['2. Evaluation de la mise en oeuvre des règles de la DNSSI'];
    const colHead = ['Chapitre', 'Objectif', 'Règle', 'Niveau de maturité', 'Libellé maturité', 'Conformité', 'Constat / Justificatif', 'Recommandation'];

    const rows = [header, [], colHead];

    for (const domaine of referentiel?.domaines || []) {
        let firstDom = true;
        for (const objectif of domaine.objectifs || []) {
            let firstObj = true;
            for (const mesure of objectif.mesures || []) {
                const ev  = evalMap[mesure.id];
                const niv = ev?.niveau_maturite;
                const matLib = (niv != null && niv >= 0) ? (MAT_LABELS[niv] || '') : 'N/A';
                rows.push([
                    firstDom ? `${domaine.code} — ${domaine.nom || ''}` : '',
                    firstObj ? (objectif.description || objectif.code || '') : '',
                    mesure.code || `M${mesure.id}`,
                    (niv != null && niv >= 0) ? niv : 'N/A',
                    matLib,
                    ev ? (CONF_LABELS[ev.conformite] || ev.conformite) : 'N/A',
                    ev?.commentaire     || '',
                    ev?.recommandation  || '',
                ]);
                firstDom = false;
                firstObj = false;
            }
        }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = autoColWidth(rows.slice(2));
    return ws;
}

// ─── ONGLET 4 : Synthèse niveau de maturité ───────────────────────────────────
function buildSyntheseMaturiteSheet(evaluations) {
    const counts = [0, 0, 0, 0, 0, 0];
    let na = 0;
    for (const ev of evaluations) {
        const n = ev.niveau_maturite;
        if (n != null && n >= 0 && n <= 5) counts[n]++;
        else na++;
    }
    const total = evaluations.length || 1;

    const rows = [
        ['3. Synthèse du niveau de maturité SSI par rapport aux règles de la DNSSI'],
        [],
        [],
        ['État de la mise en œuvre par niveau de maturité', 'Nombre de règles', '% des règles'],
        ...MAT_LABELS.map((label, i) => [
            label, counts[i], `${Math.round(counts[i] / total * 100)} %`,
        ]),
        ['N/A', na, `${Math.round(na / total * 100)} %`],
        [],
        ['Total', evaluations.length, '100 %'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 14 }];
    return ws;
}

// ─── ONGLET 5 : Synthèse niveau de conformité ────────────────────────────────
function buildSyntheseConformiteSheet(evaluations) {
    const dnssiCounts = { 'Non conforme': 0, 'Partielle': 0, 'Totale': 0, 'N/A': 0 };
    for (const ev of evaluations) {
        const mapped = CONF_DNSSI[ev.conformite || 'na'] || 'N/A';
        dnssiCounts[mapped] = (dnssiCounts[mapped] || 0) + 1;
    }
    const total = evaluations.length || 1;

    const rows = [
        ['4. Synthèse du niveau de conformité à la DNSSI'],
        [],
        [],
        ['État de la mise en œuvre par niveau de conformité', 'Nombre de règles', '% des règles'],
        ...Object.entries(dnssiCounts).map(([k, v]) => [k, v, `${Math.round(v / total * 100)} %`]),
        [],
        ['Total', evaluations.length, '100 %'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 44 }, { wch: 18 }, { wch: 14 }];
    return ws;
}

// ─── ONGLET 6 : État d'avancement ─────────────────────────────────────────────
function buildEtatAvancementSheet(referentiel, evaluations, planActions) {
    const evalMap = buildEvalMap(evaluations);
    const planMap = buildPlanMap(planActions);

    const header  = ['5. État d\'avancement'];
    const colHead = [
        'Chapitre', 'Objectif', 'Règle',
        'Niveau de conformité', 'Niveau de maturité',
        'Actions achevées', 'Actions programmées',
        'Délai de réalisation', 'État d\'avancement', 'Commentaires',
    ];

    const rows = [header, [], colHead];

    for (const domaine of referentiel?.domaines || []) {
        let firstDom = true;
        for (const objectif of domaine.objectifs || []) {
            let firstObj = true;
            for (const mesure of objectif.mesures || []) {
                const ev     = evalMap[mesure.id];
                const plans  = planMap[mesure.id] || [];
                const niv    = ev?.niveau_maturite;

                const achevees    = plans.filter(p => p.statut === 'cloture').map(p => p.action_corrective || '').join(' | ') || '';
                const programmees = plans.filter(p => p.statut !== 'cloture').map(p => p.action_corrective || '').join(' | ') || '';
                const delais      = plans.filter(p => p.delai).map(p => new Date(p.delai).toLocaleDateString('fr-FR')).join(', ') || '';
                const etats       = [...new Set(plans.map(p => STATUT_PLAN[p.statut] || p.statut))].join(', ') || '—';
                const commentaires = plans.map(p => p.description_nc || '').filter(Boolean).join(' | ') || '';

                rows.push([
                    firstDom ? `${domaine.code} — ${domaine.nom || ''}` : '',
                    firstObj ? (objectif.description || objectif.code || '') : '',
                    mesure.code || `M${mesure.id}`,
                    ev ? (CONF_DNSSI[ev.conformite] || 'N/A') : 'N/A',
                    (niv != null && niv >= 0) ? niv : 'N/A',
                    achevees,
                    programmees,
                    delais,
                    etats,
                    commentaires,
                ]);
                firstDom = false;
                firstObj = false;
            }
        }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = autoColWidth(rows.slice(2));
    return ws;
}

// ─── EXPORT PRINCIPAL ─────────────────────────────────────────────────────────
export function exportAuditReportExcel({ audit, evaluations, planActions, soaEntries, referentiel }) {
    const wb   = XLSX.utils.book_new();
    const year = new Date().getFullYear();

    XLSX.utils.book_append_sheet(wb, buildSyntheseSheet(audit, evaluations, planActions),         'Synthèse');
    XLSX.utils.book_append_sheet(wb, buildIdentificationSheet(audit),                             'Identification entité');
    XLSX.utils.book_append_sheet(wb, buildEvaluationSheet(referentiel, evaluations),              'Evaluation_MO_DNSSI');
    XLSX.utils.book_append_sheet(wb, buildSyntheseMaturiteSheet(evaluations),                     'Synthèse maturité');
    XLSX.utils.book_append_sheet(wb, buildSyntheseConformiteSheet(evaluations),                   'Synthèse conformité');
    XLSX.utils.book_append_sheet(wb, buildEtatAvancementSheet(referentiel, evaluations, planActions), "État d'avancement");

    XLSX.writeFile(wb, `rapport-audit-${(audit.nom || 'audit').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${year}.xlsx`);
}
