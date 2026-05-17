import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getAllAudits, getEvaluations, getSoA } from '../../services/endpoints/auditService';
import { getPlanActions } from '../../services/endpoints/planActionService';
import { getReferentielById } from '../../services/endpoints/referentielService';
import { exportAuditReportPDF } from '../../utils/exportReportPDF';
import { exportAuditReportExcel } from '../../utils/exportReportExcel';
import logoDataprotect from '../../assets/images/logoDataprotect.png';
import AppSelect from '../../components/common/AppSelect';
import ReportConfigModal from './components/ReportConfigModal';

const STATUT_LABELS = {
    brouillon: 'Brouillon',
    en_cours: 'En cours',
    termine: 'Terminé',
    archive: 'Archivé',
};

const PHASE_LABELS = {
    cadrage: 'Cadrage',
    prerequis: 'Prérequis',
    revue_documentaire: 'Revue documentaire',
    realisation: 'Réalisation',
    termine: 'Terminé',
};

const STATUT_BADGE = {
    brouillon: 'bg-gray-100 text-gray-600',
    en_cours: 'bg-blue-50 text-blue-700',
    termine: 'bg-green-50 text-green-700',
    archive: 'bg-amber-50 text-amber-700',
};

const PHASE_BADGE = {
    cadrage: 'bg-purple-50 text-purple-700',
    prerequis: 'bg-cyan-50 text-cyan-700',
    revue_documentaire: 'bg-indigo-50 text-indigo-700',
    realisation: 'bg-orange-50 text-orange-700',
    termine: 'bg-green-50 text-green-700',
};

function IconDownload() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function IconSpinner() {
    return (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

function IconTable() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

export default function RapportsPage() {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterPhase, setFilterPhase] = useState('');
    const [exporting, setExporting] = useState({});
    const [configModal, setConfigModal] = useState({ open: false, audit: null });

    useEffect(() => {
        getAllAudits()
            .then(res => setAudits((res.data.audits || []).filter(a => a.statut === 'termine')))
            .catch(() => toast.error('Erreur lors du chargement des audits'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = audits.filter(a => {
        const q = search.toLowerCase();
        if (q && !a.nom.toLowerCase().includes(q) && !a.client.toLowerCase().includes(q)) return false;
        if (filterPhase && a.phase !== filterPhase) return false;
        return true;
    });

    const handleExport = useCallback(async (audit, format, options = {}) => {
        setExporting(prev => ({ ...prev, [audit.id]: format }));
        try {
            const [evRes, planRes, soaRes, refRes] = await Promise.all([
                getEvaluations(audit.id),
                getPlanActions(audit.id),
                getSoA(audit.id),
                getReferentielById(audit.referentiel_id),
            ]);

            const payload = {
                audit,
                evaluations: evRes.data.evaluations || [],
                planActions: planRes.data.plans_actions || [],
                soaEntries: soaRes.data.soa || [],
                referentiel: refRes.data.referentiel,
                logoDataprotectUrl: logoDataprotect,
            };

            if (format === 'pdf') {
                await exportAuditReportPDF({ ...payload, options });
            } else {
                await exportAuditReportExcel(payload);
            }
            toast.success(`Rapport ${format.toUpperCase()} exporté`);
        } catch (err) {
            console.error(err);
            toast.error(`Erreur lors de l'export ${format.toUpperCase()}`);
        } finally {
            setExporting(prev => ({ ...prev, [audit.id]: null }));
        }
    }, []);

    const handlePdfConfirm = useCallback((options) => {
        const audit = configModal.audit;
        setConfigModal({ open: false, audit: null });
        handleExport(audit, 'pdf', options);
    }, [configModal.audit, handleExport]);

    const resetFilters = () => { setSearch(''); setFilterPhase(''); };
    const hasFilters = search || filterPhase;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Rapports & Exports</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Générez et téléchargez les rapports d'audit terminés au format PDF ou Excel.
                </p>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[220px]">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou client..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300"
                        />
                    </div>

                    <AppSelect
                        value={filterPhase}
                        onChange={v => setFilterPhase(v)}
                        options={[
                            { value: '', label: 'Toutes les phases' },
                            ...Object.entries(PHASE_LABELS).map(([v, l]) => ({ value: v, label: l }))
                        ]}
                        className="min-w-[160px]"
                    />

                    {hasFilters && (
                        <button
                            onClick={resetFilters}
                            className="text-sm text-gray-400 hover:text-gray-600 underline whitespace-nowrap"
                        >
                            Réinitialiser
                        </button>
                    )}

                    <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                        {filtered.length} audit{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-sm text-gray-400">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Chargement des audits...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-400">
                        {hasFilters ? 'Aucun audit ne correspond aux filtres.' : 'Aucun audit terminé disponible.'}
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Audit</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Référentiel</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phase</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Télécharger</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(audit => {
                                const exp = exporting[audit.id];
                                return (
                                    <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <span className="font-medium text-gray-900">{audit.nom}</span>
                                            {audit.date_debut && audit.date_fin && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {new Date(audit.date_debut).toLocaleDateString('fr-FR')} → {new Date(audit.date_fin).toLocaleDateString('fr-FR')}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-600">{audit.client}</td>
                                        <td className="px-4 py-3.5 text-gray-500 text-xs">{audit.referentiel?.nom || '—'}</td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PHASE_BADGE[audit.phase] || 'bg-gray-100 text-gray-600'}`}>
                                                {PHASE_LABELS[audit.phase] || audit.phase}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_BADGE[audit.statut] || 'bg-gray-100 text-gray-600'}`}>
                                                {STATUT_LABELS[audit.statut] || audit.statut}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* PDF */}
                                                <button
                                                    onClick={() => setConfigModal({ open: true, audit })}
                                                    disabled={!!exp}
                                                    title="Configurer et télécharger le rapport PDF"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#CC0000] text-white hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {exp === 'pdf' ? <IconSpinner /> : <IconDownload />}
                                                    {exp === 'pdf' ? 'Génération…' : 'PDF'}
                                                </button>

                                                {/* Excel */}
                                                <button
                                                    onClick={() => handleExport(audit, 'excel')}
                                                    disabled={!!exp}
                                                    title="Télécharger le rapport Excel"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {exp === 'excel' ? <IconSpinner /> : <IconTable />}
                                                    {exp === 'excel' ? 'Génération…' : 'Excel'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Info export */}
            <p className="mt-3 text-xs text-gray-400 text-center">
                Le rapport PDF est configurable — choisissez les sections à inclure avant la génération.
            </p>

            {configModal.open && (
                <ReportConfigModal
                    audit={configModal.audit}
                    onConfirm={handlePdfConfirm}
                    onClose={() => setConfigModal({ open: false, audit: null })}
                />
            )}
        </div>
    );
}
