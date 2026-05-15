export const sortRef = (ref) => {
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

export const calcConformite = (n) => {
    if (n === null || n === undefined) return 'na';
    if (n >= 3) return 'conforme';
    if (n >= 1) return 'partiel';
    return 'non_conforme';
};

export const buildSynthese = (referentiel, evMap) => {
    if (!referentiel) return [];
    return referentiel.domaines.map(domaine => {
        const mesures = domaine.objectifs.flatMap(o => o.mesures);
        const evaluated = mesures.filter(m => evMap[m.id]?.niveau_maturite !== null && evMap[m.id]?.niveau_maturite !== undefined);
        const scores = evaluated.map(m => evMap[m.id].niveau_maturite);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        let conforme = 0, partiel = 0, non_conforme = 0, na = 0;
        mesures.forEach(m => {
            const c = calcConformite(evMap[m.id]?.niveau_maturite ?? null);
            if (c === 'conforme') conforme++;
            else if (c === 'partiel') partiel++;
            else if (c === 'non_conforme') non_conforme++;
            else na++;
        });
        const applicables = conforme + partiel + non_conforme;
        const tauxConformite = applicables > 0 ? Math.round(((conforme + partiel * 0.5) / applicables) * 100) : 0;

        return {
            ...domaine,
            total: mesures.length,
            evaluatedCount: evaluated.length,
            avgScore: Math.round(avgScore * 10) / 10,
            conforme, partiel, non_conforme, na, tauxConformite,
        };
    });
};

export const scoreColor = (s) => {
    if (s >= 4) return '#16a34a';
    if (s >= 3) return '#2563eb';
    if (s >= 2) return '#d97706';
    if (s >= 1) return '#ea580c';
    return '#CC0000';
};

export const scoreLabel = (s) => {
    if (s >= 4) return 'Optimisé';
    if (s >= 3) return 'Défini';
    if (s >= 2) return 'Reproductible';
    if (s >= 1) return 'Initial';
    return 'Inexistant';
};

export const stripPrefix = (str) => (str || '').replace(/^\d+[\.\-\s]+/, '');
