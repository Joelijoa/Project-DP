import { INDICATEURS_DEF } from './auditConstants';
import { TabInfo } from './AuditBadges';

const TabIndicateurs = ({ indicateurs, setIndicateurs, synthese, onSave, saving, readOnly }) => {
    const set = (k, v) => setIndicateurs(prev => ({ ...prev, [k]: v }));

    // Calcul automatique des indicateurs "auto"
    const getAutoValue = (key) => {
        if (key === 'taux_organisation_ssi') {
            const org = synthese.find(d => d.nom?.toLowerCase().includes('organisation') || d.code?.includes('ORG') || d.code === '2');
            return org ? `${org.tauxConformite}%` : '—';
        }
        if (key === 'taux_actifs_info') {
            const actif = synthese.find(d => d.nom?.toLowerCase().includes('actif') || d.code === '4');
            return actif ? `${actif.tauxConformite}%` : '—';
        }
        return null;
    };

    return (
        <div className="space-y-4">
            <TabInfo text="Les indicateurs de la SSI énumérés dans ce document sont donnés à titre indicatif. Ils peuvent être complétés par l'entité ou l'IIV. Ces indicateurs permettent aux responsables des entités et des IIV de définir les axes de progrès et de s'inscrire dans un processus d'amélioration continue." />
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-1">6. Indicateurs de la SSI</h2>
                <p className="text-xs text-gray-400 mb-5">Liste non exhaustive d'indicateurs de performance de la sécurité des SI</p>

                <div className="space-y-3">
                    {INDICATEURS_DEF.map(({ key, label, unit, auto }) => {
                        const autoVal = auto ? getAutoValue(key) : null;
                        return (
                            <div key={key} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">{label}</p>
                                    {auto && <p className="text-xs text-gray-400 mt-0.5">Calculé automatiquement depuis la synthèse</p>}
                                </div>
                                {auto ? (
                                    <div className="w-40 px-3 py-2 text-sm font-semibold text-center rounded-xl" style={{ backgroundColor: 'var(--brand-red-light)', color: 'var(--brand-red)' }}>
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
                                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 text-right read-only:bg-gray-50 read-only:text-gray-600"
                                        />
                                        {unit && <span className="text-xs text-gray-400 flex-shrink-0">{unit}</span>}
                                    </div>
                                )}
                                {!auto && (
                                    <div className="w-48 text-xs text-gray-400 pl-1">
                                        {indicateurs[key] ? (
                                            <span>{indicateurs[key]}{unit}</span>
                                        ) : (
                                            <span>À renseigner</span>
                                        )}
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
                            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl transition disabled:opacity-60"
                            style={{ backgroundColor: 'var(--brand-red)' }}
                        >
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                            Enregistrer les indicateurs
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TabIndicateurs;
