// ─── Helpers partagés AuditDetailPage ────────────────────────────────────────
import { NIVEAUX } from './auditConstants';

export const stripNumericPrefix = (str = '') => str.replace(/^\d+[\.\s\t]+/, '').trim();
export const stripObjectifPrefix = (str = '') =>
    str.replace(/^Objectif\s+\d+\s*:\s*/i, '').replace(/^[\d.]+\s*[—\-–]\s*/, '').trim();

export const fmtISODate = (iso) => {
    if (!iso) return '—';
    const parts = (iso.split('T')[0]).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso;
};

// Trie les domaines, objectifs et mesures par id (ordre d'insertion depuis le seed)
export const sortReferentiel = (ref) => {
    if (!ref) return ref;
    return {
        ...ref,
        domaines: [...(ref.domaines || [])].sort((a, b) => a.id - b.id).map(d => ({
            ...d,
            objectifs: [...(d.objectifs || [])].sort((a, b) => a.id - b.id).map(o => ({
                ...o,
                mesures: [...(o.mesures || [])].sort((a, b) => a.id - b.id),
            })),
        })),
    };
};

export const calcConformite = (niveau) => {
    if (niveau === null || niveau === undefined) return 'na'; // pas encore évalué
    if (niveau === -1 || niveau === -2) return 'na';          // domaine / mesure non applicable
    if (niveau <= 1) return 'non_conforme';
    if (niveau <= 3) return 'partiel';
    return 'conforme';
};

export const isoConformite = (niveau) => {
    if (niveau === null || niveau === undefined) return 'na';
    if (niveau === 5) return 'conforme';
    if (niveau === 2) return 'nc_mineure';
    return 'nc_majeure';
};

export const niveauLabel = (v) => NIVEAUX.find(n => n.value === v)?.label ?? 'N/A';

export const fileIcon = (mime) => {
    const FILE_ICONS = {
        'application/pdf': '📄',
        'application/msword': '📝',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
        'application/vnd.ms-excel': '📊',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
        'image/jpeg': '🖼️',
        'image/png': '🖼️',
    };
    return FILE_ICONS[mime] || '📎';
};

export const fmtSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

export const migrateEtapes = (etapes) =>
    (etapes || []).map(e =>
        typeof e === 'string'
            ? { nom: e, activites: '', date_debut: '', date_fin: '', duree: '', livrables: '' }
            : { activites: '', date_debut: '', date_fin: '', duree: '', livrables: '', ...e }
    );
