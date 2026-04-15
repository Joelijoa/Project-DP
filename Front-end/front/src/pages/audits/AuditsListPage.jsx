import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllAudits, deleteAudit } from '../../services/endpoints/auditService';
import { toast } from 'react-toastify';

const STATUT_CONFIG = {
    brouillon:  { label: 'Brouillon',  bg: 'bg-gray-100',   text: 'text-gray-600' },
    en_cours:   { label: 'En cours',   bg: 'bg-blue-50',    text: 'text-blue-700' },
    termine:    { label: 'Terminé',    bg: 'bg-green-50',   text: 'text-green-700' },
    archive:    { label: 'Archivé',    bg: 'bg-yellow-50',  text: 'text-yellow-700' },
};

const StatutBadge = ({ statut }) => {
    const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.brouillon;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
};

const AuditsListPage = () => {
    const navigate = useNavigate();
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatut, setFilterStatut] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const load = async () => {
        try {
            const res = await getAllAudits();
            setAudits(res.data.audits);
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

    const filtered = audits.filter(a => {
        const matchSearch = !search ||
            a.nom.toLowerCase().includes(search.toLowerCase()) ||
            a.client.toLowerCase().includes(search.toLowerCase());
        const matchStatut = !filterStatut || a.statut === filterStatut;
        return matchSearch && matchStatut;
    });

    return (
        <div>
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Audits</h1>
                    <p className="text-sm text-gray-500 mt-1">Liste de tous les audits de conformité</p>
                </div>
                <Link
                    to="/audits/nouveau"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition"
                    style={{ backgroundColor: 'var(--brand-red)' }}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Nouvel audit
                </Link>
            </div>

            {/* Filtres */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou client..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': 'var(--brand-red)' }}
                    />
                </div>
                <select
                    value={filterStatut}
                    onChange={e => setFilterStatut(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 bg-white"
                >
                    <option value="">Tous les statuts</option>
                    <option value="brouillon">Brouillon</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                    <option value="archive">Archivé</option>
                </select>
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--brand-red-light)' }}>
                            <svg className="w-6 h-6" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                            {search || filterStatut ? 'Aucun résultat trouvé' : 'Aucun audit pour le moment'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {search || filterStatut ? 'Modifiez vos filtres' : 'Créez votre premier audit pour commencer'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50/60">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entité auditée</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Référentiel</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Période</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Créateur</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(audit => (
                                <tr
                                    key={audit.id}
                                    className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/audits/${audit.id}`)}
                                >
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-gray-900">{audit.nom}</p>
                                        {audit.perimetre && (
                                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{audit.perimetre}</p>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-700">{audit.client}</td>
                                    <td className="px-5 py-3.5">
                                        {audit.referentiel ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                                {audit.referentiel.type}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <StatutBadge statut={audit.statut} />
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                                        {audit.date_debut ? new Date(audit.date_debut).toLocaleDateString('fr-FR') : '—'}
                                        {audit.date_fin ? ` → ${new Date(audit.date_fin).toLocaleDateString('fr-FR')}` : ''}
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-600">
                                        {audit.createur ? `${audit.createur.prenom} ${audit.createur.nom}` : '—'}
                                    </td>
                                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-2 justify-end">
                                            <Link
                                                to={`/audits/${audit.id}`}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                                                title="Ouvrir"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => setConfirmDelete(audit)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                                title="Supprimer"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Compteur */}
            {!loading && filtered.length > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                    {filtered.length} audit{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
                </p>
            )}

            {/* Modal confirmation suppression */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50">
                                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Supprimer l'audit</h3>
                                <p className="text-xs text-gray-500">Cette action est irréversible</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-5">
                            Voulez-vous vraiment supprimer <strong>{confirmDelete.nom}</strong> ? Toutes les évaluations associées seront perdues.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleDelete(confirmDelete.id)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                            >
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
