import { useEffect, useState } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser, resetPassword } from '../../services/endpoints/userService';
import { useAuth } from '../../store/auth/AuthContext';
import { toast } from 'react-toastify';

const ROLE_CONFIG = {
    admin:            { label: 'Admin',            bg: 'bg-red-50',     text: 'text-red-700' },
    auditeur_senior:  { label: 'Auditeur senior',  bg: 'bg-purple-50',  text: 'text-purple-700' },
    auditeur:         { label: 'Auditeur',         bg: 'bg-blue-50',    text: 'text-blue-700' },
    consultant:       { label: 'Consultant',       bg: 'bg-gray-100',   text: 'text-gray-600' },
};

const ROLES = Object.entries(ROLE_CONFIG).map(([value, { label }]) => ({ value, label }));

const emptyForm = { prenom: '', nom: '', email: '', role: 'auditeur', organisation: '', telephone: '' };

const UserModal = ({ user, onClose, onSave }) => {
    const isEdit = !!user?.id;
    const [form, setForm] = useState(isEdit ? {
        prenom: user.prenom || '', nom: user.nom || '', email: user.email || '',
        role: user.role || 'auditeur', organisation: user.organisation || '',
        telephone: user.telephone || '', actif: user.actif ?? true,
    } : { ...emptyForm });
    const [saving, setSaving] = useState(false);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(form);
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900">
                        {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prénom *</label>
                            <input type="text" value={form.prenom} onChange={e => set('prenom', e.target.value)} required
                                className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom *</label>
                            <input type="text" value={form.nom} onChange={e => set('nom', e.target.value)} required
                                className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email *</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                            className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle *</label>
                        <select value={form.role} onChange={e => set('role', e.target.value)}
                            className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1">
                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisation</label>
                        <input type="text" value={form.organisation} onChange={e => set('organisation', e.target.value)}
                            className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</label>
                        <input type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)}
                            className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                    </div>

                    {isEdit && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.actif} onChange={e => set('actif', e.target.checked)}
                                className="w-4 h-4 rounded accent-red-600" />
                            <span className="text-sm text-gray-700">Compte actif</span>
                        </label>
                    )}

                    {!isEdit && (
                        <p className="text-xs text-gray-400 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                            Un mot de passe temporaire sera généré et envoyé par email à l'utilisateur.
                        </p>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-60"
                            style={{ backgroundColor: 'var(--brand-red)' }}>
                            {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {isEdit ? 'Enregistrer' : 'Créer le compte'}
                        </button>
                        <button type="button" onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UtilisateursPage = () => {
    const { user: me } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [modalUser, setModalUser] = useState(null);  // null = closed, {} = new, user = edit
    const [resettingId, setResettingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const load = async () => {
        try {
            const res = await getAllUsers();
            setUsers(res.data.users || []);
        } catch {
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = users.filter(u => {
        if (filterRole && u.role !== filterRole) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                u.nom?.toLowerCase().includes(q) ||
                u.prenom?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.organisation?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const handleCreate = async (form) => {
        const res = await createUser(form);
        setUsers(prev => [res.data.user, ...prev]);
        toast.success('Compte créé — mot de passe temporaire envoyé par email');
    };

    const handleUpdate = async (form) => {
        const res = await updateUser(modalUser.id, form);
        setUsers(prev => prev.map(u => u.id === modalUser.id ? res.data.user : u));
        toast.success('Utilisateur mis à jour');
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Supprimer le compte de ${user.prenom} ${user.nom} ?`)) return;
        setDeletingId(user.id);
        try {
            await deleteUser(user.id);
            setUsers(prev => prev.filter(u => u.id !== user.id));
            toast.success('Compte supprimé');
        } catch {
            toast.error('Erreur lors de la suppression');
        } finally {
            setDeletingId(null);
        }
    };

    const handleResetPassword = async (user) => {
        if (!window.confirm(`Réinitialiser le mot de passe de ${user.prenom} ${user.nom} ? Un nouveau mot de passe temporaire sera envoyé.`)) return;
        setResettingId(user.id);
        try {
            await resetPassword(user.id);
            toast.success('Mot de passe réinitialisé — email envoyé');
        } catch {
            toast.error('Erreur lors de la réinitialisation');
        } finally {
            setResettingId(null);
        }
    };

    const isAdmin = me?.role === 'admin';

    return (
        <div>
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Utilisateurs</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{users.length} compte(s) enregistré(s)</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setModalUser({})}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nouvel utilisateur
                    </button>
                )}
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
                <input type="text" placeholder="Rechercher (nom, email, organisation)..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-48 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
                    <option value="">Tous les rôles</option>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {(search || filterRole) && (
                    <button onClick={() => { setSearch(''); setFilterRole(''); }}
                        className="text-sm text-gray-500 hover:text-gray-700 px-2">Réinitialiser</button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-sm text-gray-500">Aucun utilisateur trouvé</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisation</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                {isAdmin && <th className="px-4 py-3" />}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(u => {
                                const roleCfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.consultant;
                                const isSelf = me?.id === u.id || me?.userId === u.id;
                                return (
                                    <tr key={u.id} className="hover:bg-gray-50/40">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                    style={{ backgroundColor: 'var(--brand-red)' }}>
                                                    {u.prenom?.[0]}{u.nom?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{u.prenom} {u.nom} {isSelf && <span className="text-xs text-gray-400">(vous)</span>}</p>
                                                    <p className="text-xs text-gray-400">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${roleCfg.bg} ${roleCfg.text}`}>
                                                {roleCfg.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">{u.organisation || '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${u.actif ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {u.actif ? 'Actif' : 'Inactif'}
                                            </span>
                                            {u.must_change_password && (
                                                <span className="ml-1 inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700" title="L'utilisateur doit changer son mot de passe">
                                                    MDP temp.
                                                </span>
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => setModalUser(u)} title="Modifier"
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => handleResetPassword(u)} disabled={resettingId === u.id} title="Réinitialiser le mot de passe"
                                                        className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition disabled:opacity-40">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                        </svg>
                                                    </button>
                                                    {!isSelf && (
                                                        <button onClick={() => handleDelete(u)} disabled={deletingId === u.id} title="Supprimer"
                                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-40">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {modalUser !== null && (
                <UserModal
                    user={modalUser?.id ? modalUser : null}
                    onClose={() => setModalUser(null)}
                    onSave={modalUser?.id ? handleUpdate : handleCreate}
                />
            )}
        </div>
    );
};

export default UtilisateursPage;
