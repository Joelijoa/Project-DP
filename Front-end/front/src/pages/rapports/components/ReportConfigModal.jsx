import { useState, useEffect, useMemo } from 'react';

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

function sortDomains(domains) {
    return [...(domains || [])].sort((a, b) =>
        (a.code || '').localeCompare(b.code || '', undefined, { numeric: true })
    );
}

// ─── Sous-liste des domaines pour "Faits constatés" ───────────────────────────
function DomainSubList({ refType, referentiel, loadingRef, selectedDomains, setSelectedDomains }) {
    const allDomains = useMemo(() => sortDomains(referentiel?.domaines), [referentiel]);
    const mainBody   = useMemo(() => allDomains.filter(d => !d.code.startsWith('A.')), [allDomains]);
    const annexeA    = useMemo(() => allDomains.filter(d =>  d.code.startsWith('A.')), [allDomains]);

    // Initialize selection to all when referentiel loads
    useEffect(() => {
        if (allDomains.length > 0 && selectedDomains === null) {
            setSelectedDomains(new Set(allDomains.map(d => d.id)));
        }
    }, [allDomains]); // eslint-disable-line

    if (loadingRef) {
        return (
            <div className="mt-2 ml-7 flex items-center gap-2 text-[10px] text-gray-400">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Chargement des domaines…
            </div>
        );
    }

    if (allDomains.length === 0) return null;

    const selected = selectedDomains ?? new Set(allDomains.map(d => d.id));

    const toggle = (id) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedDomains(next);
    };

    const DomainItem = ({ domain }) => {
        const checked = selected.has(domain.id);
        return (
            <div onClick={() => toggle(domain.id)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer select-none group">
                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${checked ? 'border-transparent' : 'border-gray-300 bg-white'}`}
                    style={checked ? { backgroundColor: 'var(--brand-red)' } : {}}>
                    {checked && (
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <span className={`text-[10px] leading-tight ${checked ? 'text-gray-700' : 'text-gray-400'}`}>
                    <span className="font-semibold mr-1" style={{ color: checked ? 'var(--brand-red)' : undefined }}>{domain.code}</span>
                    {domain.nom.replace(/^[\dA-Z.]+\s*[.—\-–]\s*/i, '').trim() || domain.nom}
                </span>
            </div>
        );
    };

    const allChecked = allDomains.every(d => selected.has(d.id));
    const toggleAll  = () => setSelectedDomains(
        allChecked ? new Set() : new Set(allDomains.map(d => d.id))
    );

    return (
        <div className="mt-2 ml-7 border border-gray-100 rounded-xl bg-gray-50/60 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-white">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Domaines inclus</span>
                <button onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                    className="text-[10px] text-gray-400 hover:text-gray-600 underline underline-offset-2">
                    {allChecked ? 'Tout décocher' : 'Tout cocher'}
                </button>
            </div>
            <div className="p-1.5 space-y-0 max-h-48 overflow-y-auto">
                {refType === 'dnssi' ? (
                    allDomains.map(d => <DomainItem key={d.id} domain={d} />)
                ) : (
                    <>
                        {mainBody.length > 0 && (
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1 pb-0.5">
                                    Corps principal §4-10
                                </p>
                                {mainBody.map(d => <DomainItem key={d.id} domain={d} />)}
                            </div>
                        )}
                        {annexeA.length > 0 && (
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-2 pb-0.5">
                                    Annexe A
                                </p>
                                {annexeA.map(d => <DomainItem key={d.id} domain={d} />)}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Modale principale ────────────────────────────────────────────────────────
const ReportConfigModal = ({ audit, referentiel, loadingRef, onConfirm, onClose }) => {
    const refType  = getRefType(audit?.referentiel ?? referentiel);
    const sections = refType === 'dnssi' ? DNSSI_SECTIONS : ISO_SECTIONS;

    const [options, setOptions] = useState(Object.fromEntries(sections.map(s => [s.key, true])));
    const [fcExpanded, setFcExpanded] = useState(false);
    const [selectedDomains, setSelectedDomains] = useState(null); // null = not yet init

    const toggle = key => setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    const allChecked = sections.every(s => options[s.key]);
    const toggleAll  = () => setOptions(Object.fromEntries(sections.map(s => [s.key, !allChecked])));

    const handleConfirm = () => {
        const allDomains = sortDomains(referentiel?.domaines);
        const allSelected = allDomains.length === 0 || (selectedDomains !== null && selectedDomains.size === allDomains.length);
        onConfirm({
            ...options,
            domainesFC: allSelected ? null : (selectedDomains ? [...selectedDomains] : null),
        });
    };

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
                        <div className="space-y-0.5 max-h-96 overflow-y-auto pr-1">
                            {sections.map(s => {
                                const isFaits = s.key === 'faitsConstates';
                                return (
                                    <div key={s.key}>
                                        <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors select-none">
                                            {/* Checkbox */}
                                            <div onClick={() => toggle(s.key)} className="cursor-pointer mt-0.5 flex-shrink-0">
                                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${options[s.key] ? 'border-transparent' : 'border-gray-300 bg-white'}`}
                                                    style={options[s.key] ? { backgroundColor: 'var(--brand-red)' } : {}}>
                                                    {options[s.key] && (
                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Label */}
                                            <div className="flex-1 cursor-pointer" onClick={() => toggle(s.key)}>
                                                <p className={`text-xs font-medium leading-tight ${options[s.key] ? 'text-gray-800' : 'text-gray-400'}`}>
                                                    {s.label}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                                            </div>
                                            {/* Expand arrow pour Faits constatés */}
                                            {isFaits && options[s.key] && (
                                                <button
                                                    onClick={() => setFcExpanded(v => !v)}
                                                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                                                    title="Sélectionner les domaines"
                                                >
                                                    <svg className={`w-3.5 h-3.5 transition-transform ${fcExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        {/* Sous-liste domaines */}
                                        {isFaits && options[s.key] && fcExpanded && (
                                            <DomainSubList
                                                refType={refType}
                                                referentiel={referentiel}
                                                loadingRef={loadingRef}
                                                selectedDomains={selectedDomains}
                                                setSelectedDomains={setSelectedDomains}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button onClick={onClose}
                        className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                        Annuler
                    </button>
                    <button onClick={handleConfirm}
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
