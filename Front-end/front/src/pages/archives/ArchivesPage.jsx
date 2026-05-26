import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/auth/AuthContext';
import { getArchivedAudits, desarchiverAudit, desarchiverRapport, getEvaluations, getSoA } from '../../services/endpoints/auditService';
import { getPlanActions } from '../../services/endpoints/planActionService';
import { getReferentielById } from '../../services/endpoints/referentielService';
import { exportAuditReportPDF } from '../../utils/exportReportPDF';
import { exportAuditReportExcel } from '../../utils/exportReportExcel';
import logoDataprotect from '../../assets/images/logoDataprotect.png';
import { toast } from 'react-toastify';
import AppSelect from '../../components/common/AppSelect';
import ConfirmModal from '../../components/common/ConfirmModal';
import ReportConfigModal from '../rapports/components/ReportConfigModal';

const REF_OPTIONS = [
    { value: '', label: 'Tous les référentiels' },
    { value: 'DNSSI', label: 'DNSSI' },
    { value: 'ISO27001', label: 'ISO 27001' },
];

const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

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

// ─── Onglet 1 : Audits archivés ───────────────────────────────────────────────

const AuditCard = ({ audit, canDesarchiver, onDesarchiver }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700">
                            Archivé
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {audit.referentiel?.type === 'ISO27001' ? 'ISO 27001' : 'DNSSI'}
                        </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{audit.nom}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{audit.client}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {canDesarchiver && (
                        <button
                            onClick={() => onDesarchiver(audit)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition"
                            title="Remettre en statut Terminé"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Désarchiver
                        </button>
                    )}
                    <Link
                        to={`/audits/${audit.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-xl transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.574-3.007-9.964-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Consulter
                    </Link>
                </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                {audit.createur && (
                    <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        {audit.createur.prenom} {audit.createur.nom}
                    </span>
                )}
                {audit.date_debut && (
                    <span>{fmtDate(audit.date_debut)} → {fmtDate(audit.date_fin)}</span>
                )}
                <span className="ml-auto">Archivé le {fmtDate(audit.updatedAt)}</span>
            </div>
        </div>
    </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────

const ArchivesPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('audits');
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRef, setFilterRef] = useState('');
    const [confirmDesarchiver, setConfirmDesarchiver] = useState(null);
    const [desarchiving, setDesarchiving] = useState(false);

    // Rapports tab
    const [exporting, setExporting] = useState({});
    const [configModal, setConfigModal] = useState({ open: false, audit: null, referentiel: null, loadingRef: false });

    const isAdmin = user?.role === 'admin';

    const load = useCallback(async () => {
        try {
            const res = await getArchivedAudits();
            setAudits(res.data.audits || []);
        } catch {
            toast.error('Impossible de charger les archives');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const applyFilters = useCallback((list) => list.filter(a => {
        if (search && !a.nom.toLowerCase().includes(search.toLowerCase()) &&
            !a.client.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterRef && a.referentiel?.type !== filterRef) return false;
        return true;
    }), [search, filterRef]);

    const filteredAudits   = useMemo(() => applyFilters(audits), [audits, applyFilters]);
    const filteredRapports = useMemo(() => applyFilters(audits.filter(a => a.rapport_archive)), [audits, applyFilters]);

    const handleDesarchiver = async () => {
        if (!confirmDesarchiver) return;
        setDesarchiving(true);
        try {
            await desarchiverAudit(confirmDesarchiver.id);
            toast.success(`"${confirmDesarchiver.nom}" remis en statut Terminé`);
            setConfirmDesarchiver(null);
            load();
        } catch {
            toast.error('Erreur lors du désarchivage');
        } finally {
            setDesarchiving(false);
        }
    };

    // ── Export rapports ───────────────────────────────────────────────────────
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

    const TABS = [
        { id: 'audits', label: 'Audits archivés' },
        { id: 'rapports', label: 'Rapports d\'archives' },
    ];

    return (
        <div className="space-y-5">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Archives</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Audits clôturés et archivés — consultation uniquement</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <span className="text-xs font-semibold text-amber-700">{audits.length} archivé{audits.length > 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            activeTab === t.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Filtres communs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Rechercher un audit ou client..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                    />
                </div>
                <div className="w-48">
                    <AppSelect value={filterRef} onChange={setFilterRef} options={REF_OPTIONS} size="sm" />
                </div>
                {(search || filterRef) && (
                    <button onClick={() => { setSearch(''); setFilterRef(''); }}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition">
                        Réinitialiser
                    </button>
                )}
                <span className="ml-auto text-xs text-gray-400">
                    {activeTab === 'audits' ? filteredAudits.length : filteredRapports.length} résultat{(activeTab === 'audits' ? filteredAudits.length : filteredRapports.length) > 1 ? 's' : ''}
                </span>
            </div>

            {/* ── Onglet Audits archivés ── */}
            {activeTab === 'audits' && (
                loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                    </div>
                ) : filteredAudits.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                            {audits.length === 0 ? 'Aucun audit archivé' : 'Aucun résultat pour ces filtres'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {audits.length === 0 ? 'Les audits terminés et archivés apparaîtront ici.' : 'Essayez de modifier les filtres.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredAudits.map(a => (
                            <AuditCard key={a.id} audit={a} canDesarchiver={isAdmin} onDesarchiver={setConfirmDesarchiver} />
                        ))}
                    </div>
                )
            )}

            {/* ── Onglet Rapports d'archives ── */}
            {activeTab === 'rapports' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 gap-2 text-sm text-gray-400">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Chargement…
                        </div>
                    ) : filteredRapports.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400">
                            {audits.filter(a => a.rapport_archive).length === 0
                                ? 'Aucun rapport archivé. Archivez des rapports depuis la page Rapports & Exports.'
                                : 'Aucun rapport ne correspond aux filtres.'}
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Audit</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Référentiel</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Archivé le</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRapports.map(audit => {
                                    const exp = exporting[audit.id];
                                    return (
                                        <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <span className="font-medium text-gray-900">{audit.nom}</span>
                                                {audit.date_debut && audit.date_fin && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {fmtDate(audit.date_debut)} → {fmtDate(audit.date_fin)}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-gray-600">{audit.client}</td>
                                            <td className="px-4 py-3.5 text-gray-500 text-xs">{audit.referentiel?.nom || '—'}</td>
                                            <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(audit.updatedAt)}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenConfigModal(audit)}
                                                        disabled={!!exp}
                                                        title="Rapport PDF"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#CC0000] text-white hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {exp === 'pdf' ? <IconSpinner /> : <IconDownload />}
                                                        {exp === 'pdf' ? 'Génération…' : 'PDF'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleExport(audit, 'excel')}
                                                        disabled={!!exp}
                                                        title="Rapport Excel"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {exp === 'excel' ? <IconSpinner /> : <IconTable />}
                                                        {exp === 'excel' ? 'Génération…' : 'Excel'}
                                                    </button>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await desarchiverRapport(audit.id);
                                                                    toast.success(`Rapport de "${audit.nom}" désarchivé`);
                                                                    load();
                                                                } catch {
                                                                    toast.error('Erreur lors du désarchivage du rapport');
                                                                }
                                                            }}
                                                            disabled={!!exp}
                                                            title="Désarchiver ce rapport"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-gray-200 text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                            </svg>
                                                            Désarchiver
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
            )}

            {/* Modal désarchivage */}
            <ConfirmModal
                isOpen={!!confirmDesarchiver}
                title="Désarchiver cet audit ?"
                message={confirmDesarchiver ? `L'audit "${confirmDesarchiver.nom}" sera remis en statut Terminé et réapparaîtra dans la liste des audits.` : ''}
                confirmLabel={desarchiving ? 'Désarchivage…' : 'Désarchiver'}
                cancelLabel="Annuler"
                onConfirm={handleDesarchiver}
                onCancel={() => setConfirmDesarchiver(null)}
            />

            {/* Modal config PDF */}
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
};

export default ArchivesPage;
