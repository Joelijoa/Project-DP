import { useEffect, useState } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser, resetPassword } from '../../services/endpoints/userService';
import { getAllEntites } from '../../services/endpoints/entiteService';
import { useAuth } from '../../store/auth/AuthContext';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/common/ConfirmModal';
import UserStatCard from './components/UserStatCard';
import UserFormModal from './components/UserFormModal';
import AppSelect from '../../components/common/AppSelect';
import UserDetailPanel from './components/UserDetailPanel';
import Sk from '../../components/common/Sk';

const ROLES = ['admin', 'auditeur_senior', 'auditeur_junior', 'client'];

const ROLE_CONFIG = {
    admin:           { label: 'Administrateur',  badge: 'bg-red-50 text-red-700'          },
    auditeur_senior: { label: 'Auditeur Senior', badge: 'bg-blue-50 text-blue-700'        },
    auditeur_junior: { label: 'Auditeur Junior', badge: 'bg-purple-50 text-purple-700'    },
    client:          { label: 'Client',           badge: 'bg-emerald-50 text-emerald-700' },
};

const ROLE_OPTIONS = [
    { value: '', label: 'Tous les rôles' },
    ...ROLES.map(r => ({ value: r, label: ROLE_CONFIG[r].label })),
];

const ACTIF_OPTIONS = [
    { value: '', label: 'Tous statuts' },
    { value: 'true', label: 'Actifs' },
    { value: 'false', label: 'Inactifs' },
];

const emptyForm = { nom: '', prenom: '', email: '', role: 'auditeur_junior', organisation: '', telephone: '', entite_id: '' };

const getInitials = (prenom = '', nom = '') =>
    ((prenom[0] ?? '') + (nom[0] ?? '')).toUpperCase() || '?';

const UtilisateursPage = () => {
    const { user: me } = useAuth();
    const [users, setUsers]             = useState([]);
    const [entites, setEntites]         = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [filterRole, setFilterRole]   = useState('');
    const [filterActif, setFilterActif] = useState('');
    const [showForm, setShowForm]       = useState(false);
    const [editingId, setEditingId]     = useState(null);
    const [form, setForm]               = useState({ ...emptyForm });
    const [submitting, setSubmitting]   = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [resetTarget, setResetTarget]   = useState(null);
    const [selectedId, setSelectedId]     = useState(null);

    const load = async () => {
        try {
            const [usersRes, entitesRes] = await Promise.all([getAllUsers(), getAllEntites()]);
            setUsers(usersRes.data.users || []);
            setEntites(entitesRes.data.entites || []);
        } catch {
            toast.error('Erreur lors du chargement des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const openCreate = () => {
        setForm({ ...emptyForm });
        setEditingId(null);
        setShowForm(true);
        setSelectedId(null);
    };

    const openEdit = (u) => {
        setForm({
            nom: u.nom || '', prenom: u.prenom || '',
            email: u.email || '', role: u.role || 'auditeur_junior',
            organisation: u.organisation || '', telephone: u.telephone || '',
            entite_id: u.entite_id || '',
            actif: u.actif ?? true,
        });
        setEditingId(u.id);
        setShowForm(true);
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                const { email, ...updateData } = form;
                const res = await updateUser(editingId, updateData);
                setUsers(prev => prev.map(u => u.id === editingId ? { ...u, ...res.data.user } : u));
                toast.success('Utilisateur mis à jour');
            } else {
                await createUser(form);
                toast.success(`Compte créé — identifiants envoyés à ${form.email}`);
                await load();
            }
            setShowForm(false);
            setEditingId(null);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActif = async (u) => {
        try {
            const res = await updateUser(u.id, { actif: !u.actif });
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, actif: res.data.user?.actif ?? !u.actif } : x));
            toast.success(u.actif ? 'Compte désactivé' : 'Compte activé');
        } catch {
            toast.error('Erreur lors de la mise à jour du statut');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteUser(deleteTarget.id);
            setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
            if (selectedId === deleteTarget.id) setSelectedId(null);
            toast.success('Compte supprimé');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur lors de la suppression');
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleReset = async () => {
        if (!resetTarget) return;
        try {
            await resetPassword(resetTarget.id);
            toast.success(`Nouveau mot de passe temporaire envoyé à ${resetTarget.email}`);
        } catch {
            toast.error('Erreur lors de la réinitialisation');
        } finally {
            setResetTarget(null);
        }
    };

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch  = !search || u.nom?.toLowerCase().includes(q) || u.prenom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.organisation?.toLowerCase().includes(q);
        const matchRole    = !filterRole  || u.role === filterRole;
        const matchActif   = !filterActif || String(u.actif) === filterActif;
        return matchSearch && matchRole && matchActif;
    });

    const totalActifs   = users.filter(u => u.actif).length;
    const totalInactifs = users.filter(u => !u.actif).length;
    const totalPending  = users.filter(u => u.must_change_password).length;

    return (
        <div>
            {/* En-tête */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Utilisateurs</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Gestion des comptes de la plateforme</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-xl transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--brand-red)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Nouvel utilisateur
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-5">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-2">
                            <Sk className="h-3 w-28" />
                            <Sk className="h-7 w-12" />
                        </div>
                    ))
                ) : (
                    <>
                        <UserStatCard value={users.length}  label="Total utilisateurs"  iconPath="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        <UserStatCard value={totalActifs}   label="Comptes actifs"       iconPath="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <UserStatCard value={totalInactifs} label="Comptes inactifs"     iconPath="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        <UserStatCard value={totalPending}  label="Att. 1ère connexion"  iconPath="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </>
                )}
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input type="text" placeholder="Rechercher par nom, email, organisation..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 transition" />
                    </div>
                    <AppSelect
                        value={filterRole}
                        onChange={v => setFilterRole(v)}
                        options={ROLE_OPTIONS}
                        className="min-w-[160px]"
                    />
                    <AppSelect
                        value={filterActif}
                        onChange={v => setFilterActif(v)}
                        options={ACTIF_OPTIONS}
                        className="min-w-[130px]"
                    />
                </div>
            </div>

            {/* Table + panneau détail */}
            <div className="flex gap-5">
            <div className={`${selectedId ? 'flex-1 min-w-0' : 'w-full'} bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
                {loading ? (
                    <div className="divide-y divide-gray-50">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                                <Sk className="w-8 h-8 rounded-full flex-shrink-0" />
                                <div className="flex-1 min-w-0 space-y-1.5">
                                    <Sk className="h-3.5 w-36" />
                                    <Sk className="h-3 w-44" />
                                </div>
                                <Sk className="h-5 w-20 rounded-full" />
                                <Sk className="h-3.5 w-24 hidden md:block" />
                                <Sk className="h-5 w-14 rounded-full" />
                                <div className="flex gap-1 ml-2">
                                    <Sk className="w-7 h-7 rounded-lg" />
                                    <Sk className="w-7 h-7 rounded-lg" />
                                    <Sk className="w-7 h-7 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-gray-400">Aucun utilisateur trouvé</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Utilisateur</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Rôle</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Organisation</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Statut</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(u => {
                                const rc    = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.client;
                                const isSelf = me?.id === u.id;
                                return (
                                    <tr key={u.id}
                                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedId === u.id ? 'bg-gray-50' : ''}`}
                                        onClick={() => setSelectedId(selectedId === u.id ? null : u.id)}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-600">
                                                    {getInitials(u.prenom, u.nom)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {u.prenom} {u.nom}
                                                        {isSelf && <span className="ml-1.5 text-[10px] text-gray-400 font-normal">(vous)</span>}
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rc.badge}`}>
                                                {rc.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 hidden md:table-cell">
                                            <span className="text-sm text-gray-500">{u.organisation || '—'}</span>
                                        </td>
                                        <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => handleToggleActif(u)}
                                                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full transition w-fit ${u.actif ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                    title={u.actif ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${u.actif ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                    {u.actif ? 'Actif' : 'Inactif'}
                                                </button>
                                                {u.must_change_password && (
                                                    <span className="text-[10px] text-gray-400 font-medium">Att. connexion</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 w-px whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openEdit(u)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Modifier">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => setResetTarget(u)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Réinitialiser le mot de passe">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </button>
                                                {!isSelf && (
                                                    <button onClick={() => setDeleteTarget(u)}
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

            {/* Panneau détail */}
            {selectedId && (() => {
                const u = users.find(x => x.id === selectedId);
                return u ? (
                    <div className="w-72 flex-shrink-0">
                        <UserDetailPanel
                            user={u}
                            onClose={() => setSelectedId(null)}
                            onEdit={() => openEdit(u)}
                        />
                    </div>
                ) : null;
            })()}
            </div>

            {showForm && (
                <UserFormModal
                    form={form} setF={setF}
                    editingId={editingId}
                    submitting={submitting}
                    entites={entites}
                    onSubmit={handleSubmit}
                    onClose={() => { setShowForm(false); setEditingId(null); }}
                />
            )}

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Supprimer l'utilisateur"
                message={`Le compte de ${deleteTarget?.prenom} ${deleteTarget?.nom} sera supprimé définitivement.`}
                confirmLabel="Supprimer" danger
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            <ConfirmModal
                isOpen={!!resetTarget}
                title="Réinitialiser le mot de passe"
                message={`Un nouveau mot de passe temporaire sera envoyé à ${resetTarget?.email}.`}
                confirmLabel="Envoyer"
                onConfirm={handleReset}
                onCancel={() => setResetTarget(null)}
            />
        </div>
    );
};

export default UtilisateursPage;
