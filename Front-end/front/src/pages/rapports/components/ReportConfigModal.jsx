import { useState } from 'react';

const DNSSI_SECTIONS = [
    { key: 'introduction',           label: 'Introduction',                      desc: "Contexte, périmètre, méthodologie, équipe d'audit" },
    { key: 'resume',                 label: 'Résumé exécutif',                   desc: 'KPIs et graphiques de conformité globaux' },
    { key: 'contexteReglementaire',  label: 'Contexte réglementaire',            desc: 'Cadre DNSSI, textes de référence, obligations' },
    { key: 'planAudit',              label: "Plan d'audit",                      desc: 'Informations générales et domaines couverts' },
    { key: 'faitsConstates',         label: 'Faits constatés',                   desc: 'Évaluations détaillées mesure par mesure' },
    { key: 'tableauDeBord',          label: 'Tableau de bord par thème',         desc: 'Scores et maturité par domaine DNSSI' },
    { key: 'recommandations',        label: "Recommandations & Plans d'actions", desc: 'Mesures correctives classées par priorité' },
    { key: 'conclusion',             label: 'Conclusion & Prochaines étapes',    desc: 'Synthèse finale et feuille de route' },
];

const ISO_SECTIONS = [
    { key: 'introduction',    label: 'Introduction',                      desc: "Contexte, périmètre, méthodologie, équipe d'audit" },
    { key: 'resume',          label: 'Résumé exécutif',                   desc: 'KPIs et graphiques de conformité globaux' },
    { key: 'terminologie',    label: 'Terminologie et définitions',       desc: 'Glossaire des termes utilisés dans le rapport' },
    { key: 'planAudit',       label: "Plan d'audit",                      desc: 'Informations générales et domaines couverts' },
    { key: 'faitsConstates',  label: 'Faits constatés',                   desc: 'Évaluations détaillées mesure par mesure' },
    { key: 'recommandations', label: "Recommandations & Plans d'actions", desc: 'Mesures correctives classées par priorité' },
    { key: 'conclusion',      label: 'Conclusion & Prochaines étapes',    desc: 'Synthèse finale et feuille de route' },
    { key: 'soa',             label: 'Annexe A — SoA',                    desc: "Déclaration d'applicabilité complète (clause 6.1.3)" },
];

function getRefType(referentiel) {
    const type = (referentiel?.type || '').toUpperCase();
    const nom  = (referentiel?.nom  || '').toLowerCase();
    if (type === 'DNSSI' || nom.includes('dnssi') || nom.includes('directive nationale')) return 'dnssi';
    return 'iso27001';
}

const ReportConfigModal = ({ audit, onConfirm, onClose }) => {
    const refType  = getRefType(audit?.referentiel);
    const sections = refType === 'dnssi' ? DNSSI_SECTIONS : ISO_SECTIONS;

    const [options, setOptions] = useState(Object.fromEntries(sections.map(s => [s.key, true])));

    const toggle = key => setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    const allChecked = sections.every(s => options[s.key]);
    const toggleAll  = () => setOptions(Object.fromEntries(sections.map(s => [s.key, !allChecked])));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md">

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Configurer le rapport PDF</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400 truncate max-w-[220px]">{audit.nom}</p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${refType === 'dnssi' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                {refType === 'dnssi' ? 'DNSSI' : 'ISO 27001'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {/* Toujours inclus */}
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            Inclus automatiquement
                        </p>
                        <div className="space-y-1">
                            {['Page de garde', 'Sommaire'].map(label => (
                                <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50">
                                    <div className="w-4 h-4 rounded flex items-center justify-center bg-gray-200 flex-shrink-0">
                                        <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-xs text-gray-400">{label}</span>
                                    <span className="ml-auto text-[10px] text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">
                                        Obligatoire
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contenu sélectionnable */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Contenu</p>
                            <button onClick={toggleAll}
                                className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
                                {allChecked ? 'Tout décocher' : 'Tout cocher'}
                            </button>
                        </div>
                        <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
                            {sections.map(s => (
                                <div key={s.key} onClick={() => toggle(s.key)}
                                    className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors select-none">
                                    <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${options[s.key] ? 'border-transparent' : 'border-gray-300 bg-white'}`}
                                        style={options[s.key] ? { backgroundColor: 'var(--brand-red)' } : {}}>
                                        {options[s.key] && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className={`text-xs font-medium leading-tight ${options[s.key] ? 'text-gray-800' : 'text-gray-400'}`}>
                                            {s.label}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button onClick={onClose}
                        className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                        Annuler
                    </button>
                    <button onClick={() => onConfirm(options)}
                        className="px-4 py-2 text-xs font-semibold text-white rounded-xl transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        Générer le PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportConfigModal;
