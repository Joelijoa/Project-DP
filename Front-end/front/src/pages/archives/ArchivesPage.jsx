import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth/AuthContext';
import { getArchivedAudits, desarchiverAudit } from '../../services/endpoints/auditService';
import { toast } from 'react-toastify';
import AppSelect from '../../components/common/AppSelect';
import ConfirmModal from '../../components/common/ConfirmModal';

const STATUT_BADGE = 'bg-amber-50 text-amber-700';

const REF_OPTIONS = [
    { value: '', label: 'Tous les référentiels' },
    { value: 'DNSSI', label: 'DNSSI' },
    { value: 'ISO27001', label: 'ISO 27001' },
];

const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const AuditCard = ({ audit, canDesarchiver, onDesarchiver }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${STATUT_BADGE}`}>
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
                    <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                        </svg>
                        {formatDate(audit.date_debut)} → {formatDate(audit.date_fin)}
                    </span>
                )}
                <span className="ml-auto flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    Archivé le {formatDate(audit.updatedAt)}
                </span>
            </div>
        </div>
    </div>
);

const ArchivesPage = () => {
    const { user } = useAuth();
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRef, setFilterRef] = useState('');
    const [confirmDesarchiver, setConfirmDesarchiver] = useState(null);
    const [desarchiving, setDesarchiving] = useState(false);

    const isAdmin = user?.role === 'admin';

    const load = async () => {
        try {
            const res = await getArchivedAudits();
            setAudits(res.data.audits || []);
        } catch {
            toast.error('Impossible de charger les archives');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => audits.filter(a => {
        if (search && !a.nom.toLowerCase().includes(search.toLowerCase()) &&
            !a.client.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterRef && a.referentiel?.type !== filterRef) return false;
        return true;
    }), [audits, search, filterRef]);

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

            {/* Filtres */}
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
                    <AppSelect
                        value={filterRef}
                        onChange={setFilterRef}
                        options={REF_OPTIONS}
                        size="sm"
                    />
                </div>
                {(search || filterRef) && (
                    <button
                        onClick={() => { setSearch(''); setFilterRef(''); }}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
                    >
                        Réinitialiser
                    </button>
                )}
            </div>

            {/* Liste */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                </div>
            ) : filtered.length === 0 ? (
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
                        {audits.length === 0
                            ? 'Les audits terminés et archivés apparaîtront ici.'
                            : 'Essayez de modifier les filtres de recherche.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(a => (
                        <AuditCard
                            key={a.id}
                            audit={a}
                            canDesarchiver={isAdmin}
                            onDesarchiver={setConfirmDesarchiver}
                        />
                    ))}
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
        </div>
    );
};

export default ArchivesPage;
