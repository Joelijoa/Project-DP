import { ISO_INDICATEURS_DEF } from './auditConstants';
import { TabInfo } from './AuditBadges';

const TabIndicateursISO = ({ referentiel, soaMap, localEvals, indicateurs, setIndicateurs, onSave, saving, readOnly }) => {
    const set = (k, v) => setIndicateurs(prev => ({ ...prev, [k]: v }));

    const allMesures = referentiel?.domaines?.flatMap(d => d.objectifs?.flatMap(o => o.mesures ?? []) ?? []) ?? [];
    const applicable = allMesures.filter(m => soaMap[m.id]?.applicable === true);
    const ncCount = applicable.filter(m => localEvals[m.id]?.niveau_maturite === 0).length;
    const confCount = applicable.filter(m => localEvals[m.id]?.niveau_maturite === 5).length;
    const implCount = allMesures.filter(m => ['implemente', 'partiel', 'planifie'].includes(soaMap[m.id]?.statut_implementation)).length;

    const getAutoValue = (key) => {
        if (!applicable.length) return '—';
        if (key === 'iso_taux_nc') return `${Math.round(ncCount / applicable.length * 100)}%`;
        if (key === 'iso_taux_conf') return `${Math.round(confCount / applicable.length * 100)}%`;
        if (key === 'iso_taux_impl') return allMesures.length > 0 ? `${Math.round(implCount / allMesures.length * 100)}%` : '—';
        return '—';
    };

    return (
        <div className="space-y-4">
            <TabInfo text="Indicateurs de performance du Système de Management de la Sécurité de l'Information (SMSI) selon ISO 27001:2022. Les indicateurs marqués « Auto » sont calculés depuis l'évaluation et la SoA." />
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-1">Indicateurs SMSI</h2>
                <p className="text-xs text-gray-400 mb-5">Indicateurs de pilotage de la sécurité de l'information</p>

                <div className="space-y-3">
                    {ISO_INDICATEURS_DEF.map(({ key, label, unit, auto }) => {
                        const autoVal = auto ? getAutoValue(key) : null;
                        return (
                            <div key={key} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">{label}</p>
                                    {auto && <p className="text-xs text-gray-400 mt-0.5">Calculé automatiquement</p>}
                                </div>
                                {auto ? (
                                    <div className="w-40 px-3 py-2 text-sm font-semibold text-center rounded-lg" style={{ backgroundColor: 'var(--brand-red-light)', color: 'var(--brand-red)' }}>
                                        {autoVal}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 w-48">
                                        <input
                                            type="number"
                                            value={indicateurs[key] || ''}
                                            onChange={e => !readOnly && set(key, e.target.value)}
                                            readOnly={readOnly}
                                            placeholder="—"
                                            className={`w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-right ${readOnly ? 'bg-gray-50 text-gray-600 cursor-default' : ''}`}
                                            style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                        />
                                        {unit && <span className="text-xs text-gray-400 flex-shrink-0">{unit}</span>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {!readOnly && (
                    <div className="flex justify-end mt-5">
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60"
                            style={{ backgroundColor: 'var(--brand-red)' }}
                        >
                            {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Enregistrer les indicateurs
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TabIndicateursISO;
