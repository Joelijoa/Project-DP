import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth/AuthContext';
import { getAllAudits, deleteAudit } from '../../services/endpoints/auditService';
import { toast } from 'react-toastify';

// ── Config ────────────────────────────────────────────────────────────────────

const STATUT_CONFIG = {
    brouillon: { label: 'Brouillon', bg: 'bg-gray-100',  text: 'text-gray-600' },
    en_cours:  { label: 'En cours',  bg: 'bg-blue-50',   text: 'text-blue-700' },
    termine:   { label: 'Terminé',   bg: 'bg-green-50',  text: 'text-green-700' },
    archive:   { label: 'Archivé',   bg: 'bg-amber-50',  text: 'text-amber-700' },
};

const PHASE_CONFIG = {
    cadrage:            { label: 'Cadrage' },
    prerequis:          { label: 'Prérequis' },
    revue_documentaire: { label: 'Revue doc.' },
    realisation:        { label: 'Réalisation' },
    termine:            { label: 'Terminé' },
};

// ── Composants ────────────────────────────────────────────────────────────────

const StatutBadge = ({ statut }) => {
    const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.brouillon;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
};

const FilterSelect = ({ value, onChange, children }) => (
    <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer"
        style={{ '--tw-ring-color': 'var(--brand-red)' }}
    >
        {children}
    </select>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const AuditsListPage = () => {
    const navigate  = useNavigate();
    const { user }  = useAuth();
    const isJunior  = user?.role === 'auditeur_junior';
    const isClient  = user?.role === 'client';
    const canAdmin  = !isJunior && !isClient;

    const [audits, setAudits]               = useState([]);
    const [loading, setLoading]             = useState(true);
    const [search, setSearch]               = useState('');
    const [filterStatut, setFilterStatut]   = useState('');
    const [filterRef, setFilterRef]         = useState('');
    const [filterPhase, setFilterPhase]     = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const load = async () => {
        try {
            const res = await getAllAudits();
            const all = res.data.audits || [];
            setAudits(isJunior
                ? all.filter(a => a.auditeurs?.some(au => au.id === user.id))
                : all
            );
        } catch {
            toast.error('Impossible de charger les audits');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id) => {
        try {
            await deleteAudit(id);
            toast.success('Audit supprimé');
            setConfirmDelete(null);
            load();
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const hasActiveFilters = search || filterStatut || filterRef || filterPhase;

    const filtered = audits.filter(a => {
        if (search && !a.nom.toLowerCase().includes(search.toLowerCase()) &&
                      !a.client.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterStatut && a.statut !== filterStatut) return false;
        if (filterRef    && a.referentiel?.type !== filterRef) return false;
        if (filterPhase  && a.phase !== filterPhase) return false;
        return true;
    });

    // Stats rapides
    const stats = [
        { label: 'Total',      value: audits.length },
        { label: 'En cours',   value: audits.filter(a => a.statut === 'en_cours').length },
        { label: 'Terminés',   value: audits.filter(a => a.statut === 'termine').length },
        { label: 'Brouillons', value: audits.filter(a => a.statut === 'brouillon').length },
    ];

    return (
        <div className="space-y-5">

            {/* ── En-tête ── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Tous les audits</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {isJunior ? 'Audits qui vous sont assignés' : isClient ? 'Audits de votre entité' : 'Liste de tous les audits de conformité'}
                    </p>
                </div>
                {canAdmin && (
                    <Link to="/audits/nouveau"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nouvel audit
                    </Link>
                )}
            </div>

            {/* ── Stats rapides ── */}
            {!loading && (
                <div className="grid grid-cols-4 gap-3">
                    {stats.map((s, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                            <p className="text-xs font-medium text-gray-400 mb-1">{s.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Filtres ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Recherche */}
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou client..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                            style={{ '--tw-ring-color': 'var(--brand-red)' }}
                        />
                    </div>

                    <div className="h-5 w-px bg-gray-200 hidden sm:block" />

                    {/* Statut */}
                    <FilterSelect value={filterStatut} onChange={setFilterStatut}>
                        <option value="">Tous les statuts</option>
                        <option value="brouillon">Brouillon</option>
                        <option value="en_cours">En cours</option>
                        <option value="termine">Terminé</option>
                        <option value="archive">Archivé</option>
                    </FilterSelect>

                    {/* Référentiel */}
                    <FilterSelect value={filterRef} onChange={setFilterRef}>
                        <option value="">Tous les référentiels</option>
                        <option value="DNSSI">DNSSI</option>
                        <option value="ISO27001">ISO 27001</option>
                    </FilterSelect>

                    {/* Phase */}
                    <FilterSelect value={filterPhase} onChange={setFilterPhase}>
                        <option value="">Toutes les phases</option>
                        <option value="cadrage">Cadrage</option>
                        <option value="prerequis">Prérequis</option>
                        <option value="revue_documentaire">Revue documentaire</option>
                        <option value="realisation">Réalisation</option>
                        <option value="termine">Terminé</option>
                    </FilterSelect>

                    {/* Reset */}
                    {hasActiveFilters && (
                        <button
                            onClick={() => { setSearch(''); setFilterStatut(''); setFilterRef(''); setFilterPhase(''); }}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition px-2 py-2">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Réinitialiser
                        </button>
                    )}

                    <span className="ml-auto text-xs text-gray-400 hidden sm:block">
                        {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* ── Tableau ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin"
                            style={{ borderTopColor: 'var(--brand-red)' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-gray-100">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">
                            {hasActiveFilters ? 'Aucun résultat pour ces filtres' : 'Aucun audit pour le moment'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {hasActiveFilters ? 'Essayez de modifier ou réinitialiser vos filtres' : 'Créez votre premier audit pour commencer'}
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={() => { setSearch(''); setFilterStatut(''); setFilterRef(''); setFilterPhase(''); }}
                                className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Audit</th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Entité</th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Référentiel</th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Phase</th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Statut</th>
                                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Période</th>
                                {canAdmin && (
                                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Créateur</th>
                                )}
                                <th className="px-4 py-3 w-20" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(audit => {
                                const phase = PHASE_CONFIG[audit.phase];
                                return (
                                    <tr key={audit.id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                        onClick={() => navigate(`/audits/${audit.id}`)}>

                                        {/* Nom */}
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center bg-gray-100">
                                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24"
                                                        stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate max-w-[200px]">{audit.nom}</p>
                                                    {audit.perimetre && (
                                                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{audit.perimetre}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Entité */}
                                        <td className="px-4 py-3.5">
                                            <p className="text-sm text-gray-700 truncate max-w-[140px]">{audit.client}</p>
                                        </td>

                                        {/* Référentiel */}
                                        <td className="px-4 py-3.5">
                                            {audit.referentiel ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700">
                                                    {audit.referentiel.type}
                                                </span>
                                            ) : <span className="text-gray-300">—</span>}
                                        </td>

                                        {/* Phase */}
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs text-gray-500">
                                                {phase?.label ?? '—'}
                                            </span>
                                        </td>

                                        {/* Statut */}
                                        <td className="px-4 py-3.5">
                                            <StatutBadge statut={audit.statut} />
                                        </td>

                                        {/* Période */}
                                        <td className="px-4 py-3.5">
                                            <p className="text-xs text-gray-500">
                                                {audit.date_debut
                                                    ? new Date(audit.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : '—'}
                                            </p>
                                            {audit.date_fin && (
                                                <p className="text-xs text-gray-400">
                                                    {new Date(audit.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            )}
                                        </td>

                                        {/* Créateur */}
                                        {canAdmin && (
                                            <td className="px-4 py-3.5">
                                                <p className="text-xs text-gray-500">
                                                    {audit.createur ? `${audit.createur.prenom} ${audit.createur.nom}` : '—'}
                                                </p>
                                            </td>
                                        )}

                                        {/* Actions */}
                                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <Link to={`/audits/${audit.id}`}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                                                    title="Ouvrir">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                                    </svg>
                                                </Link>
                                                {canAdmin && (
                                                    <button
                                                        onClick={() => setConfirmDelete(audit)}
                                                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                                                        title="Supprimer">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
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

            {/* ── Modal suppression ── */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 flex-shrink-0">
                                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Supprimer l'audit</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Cette action est irréversible</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-5">
                            Voulez-vous vraiment supprimer <strong className="text-gray-900">{confirmDelete.nom}</strong> ? Toutes les évaluations associées seront perdues.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                                Annuler
                            </button>
                            <button onClick={() => handleDelete(confirmDelete.id)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition">
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AuditsListPage;
