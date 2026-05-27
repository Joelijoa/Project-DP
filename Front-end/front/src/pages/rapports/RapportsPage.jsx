import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../store/auth/AuthContext';
import { getAllAudits, getArchivedAudits, getEvaluations, getSoA, archiverRapport } from '../../services/endpoints/auditService';
import { getPlanActions } from '../../services/endpoints/planActionService';
import { getReferentielById } from '../../services/endpoints/referentielService';
import { exportAuditReportPDF } from '../../utils/exportReportPDF';
import { exportAuditReportExcel } from '../../utils/exportReportExcel';
import logoDataprotect from '../../assets/images/logoDataprotect.png';
import ReportConfigModal from './components/ReportConfigModal';

const REF_OPTIONS = [
    { value: '',         label: 'Tous' },
    { value: 'DNSSI',    label: 'DNSSI' },
    { value: 'ISO27001', label: 'ISO 27001' },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

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
    const { user } = useAuth();
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRef, setFilterRef] = useState('');
    const [exporting, setExporting] = useState({});
    const [archivingRapportId, setArchivingRapportId] = useState(null);
    const [configModal, setConfigModal] = useState({ open: false, audit: null, referentiel: null, loadingRef: false });

    const canArchive = !!user;

    const load = useCallback(() => {
        setLoading(true);
        Promise.all([getAllAudits(), getArchivedAudits()])
            .then(([activeRes, archiveRes]) => {
                const termines = (activeRes.data.audits || []).filter(a => a.statut === 'termine');
                const archivesNonRapport = (archiveRes.data.audits || []).filter(a => !a.rapport_archive);
                const combined = [...termines, ...archivesNonRapport]
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                setAudits(combined);
            })
            .catch(() => toast.error('Erreur lors du chargement des audits'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => audits.filter(a => {
        const q = search.toLowerCase();
        if (q && !a.nom.toLowerCase().includes(q) && !a.client.toLowerCase().includes(q)) return false;
        if (filterRef && a.referentiel?.type !== filterRef) return false;
        return true;
    }), [audits, search, filterRef]);

    const handleArchiverRapport = useCallback(async (audit) => {
        setArchivingRapportId(audit.id);
        try {
            await archiverRapport(audit.id);
            toast.success(`Rapport de "${audit.nom}" archivé`);
            load();
        } catch {
            toast.error("Erreur lors de l'archivage du rapport");
        } finally {
            setArchivingRapportId(null);
        }
    }, [load]);

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

    const handleOpenConfigModal = useCallback(async (audit) => {
        setConfigModal({ open: true, audit, referentiel: null, loadingRef: true });
        try {
            const refRes = await getReferentielById(audit.referentiel_id);
            setConfigModal(prev => prev.open ? { ...prev, referentiel: refRes.data.referentiel, loadingRef: false } : prev);
        } catch {
            setConfigModal(prev => prev.open ? { ...prev, loadingRef: false } : prev);
        }
    }, []);

    const handlePdfConfirm = useCallback((options) => {
        const audit = configModal.audit;
        setConfigModal({ open: false, audit: null, referentiel: null, loadingRef: false });
        handleExport(audit, 'pdf', options);
    }, [configModal.audit, handleExport]);

    const hasFilters = search || filterRef;
    const resetFilters = () => { setSearch(''); setFilterRef(''); };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Rapports & Exports</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Générez et téléchargez les rapports d'audits terminés. Archivez les rapports pour les déplacer dans la section Archives.
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
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-1 py-1">
                        {REF_OPTIONS.map(opt => (
                            <button key={opt.value} onClick={() => setFilterRef(opt.value)}
                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${filterRef === opt.value ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {hasFilters && (
                        <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition whitespace-nowrap">
                            Réinitialiser
                        </button>
                    )}
                    <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                        {filtered.length} rapport{filtered.length !== 1 ? 's' : ''}
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
                        {audits.length === 0 ? 'Aucun rapport disponible.' : 'Aucun audit ne correspond aux filtres.'}
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Audit</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Référentiel</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clôturé le</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(audit => {
                                const exp = exporting[audit.id];
                                const isArchivingRapport = archivingRapportId === audit.id;
                                const isArchived = audit.statut === 'archive';
                                return (
                                    <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">{audit.nom}</span>
                                                {isArchived && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700">
                                                        Archivé
                                                    </span>
                                                )}
                                            </div>
                                            {audit.date_debut && audit.date_fin && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {fmtDate(audit.date_debut)} → {fmtDate(audit.date_fin)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-600">{audit.client}</td>
                                        <td className="px-4 py-3.5 text-gray-500 text-xs">{audit.referentiel?.nom || '—'}</td>
                                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                                            {fmtDate(audit.updatedAt)}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenConfigModal(audit)}
                                                    disabled={!!exp || isArchivingRapport}
                                                    title="Configurer et télécharger le rapport PDF"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#CC0000] text-white hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {exp === 'pdf' ? <IconSpinner /> : <IconDownload />}
                                                    {exp === 'pdf' ? 'Génération…' : 'PDF'}
                                                </button>
                                                <button
                                                    onClick={() => handleExport(audit, 'excel')}
                                                    disabled={!!exp || isArchivingRapport}
                                                    title="Télécharger le rapport Excel"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {exp === 'excel' ? <IconSpinner /> : <IconTable />}
                                                    {exp === 'excel' ? 'Génération…' : 'Excel'}
                                                </button>
                                                {canArchive && (
                                                    <button
                                                        onClick={() => handleArchiverRapport(audit)}
                                                        disabled={!!exp || isArchivingRapport}
                                                        title="Archiver ce rapport"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isArchivingRapport ? <IconSpinner /> : (
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                                            </svg>
                                                        )}
                                                        {isArchivingRapport ? 'Archivage…' : 'Archiver'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <p className="mt-3 text-xs text-gray-400 text-center">
                Le rapport PDF est configurable — choisissez les sections à inclure avant la génération.
            </p>

            {configModal.open && (
                <ReportConfigModal
                    audit={configModal.audit}
                    referentiel={configModal.referentiel}
                    loadingRef={configModal.loadingRef}
                    onConfirm={handlePdfConfirm}
                    onClose={() => setConfigModal({ open: false, audit: null, referentiel: null, loadingRef: false })}
                />
            )}
        </div>
    );
}
