import { useEffect, useState } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser, resetPassword } from '../../services/endpoints/userService';
import { getAllEntites } from '../../services/endpoints/entiteService';
import { useAuth } from '../../store/auth/AuthContext';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/common/ConfirmModal';

const ROLES = ['admin', 'auditeur_senior', 'auditeur_junior', 'client'];

const ROLE_CONFIG = {
    admin:           { label: 'Administrateur',  badge: 'bg-red-50 text-red-700'          },
    auditeur_senior: { label: 'Auditeur Senior', badge: 'bg-blue-50 text-blue-700'        },
    auditeur_junior: { label: 'Auditeur Junior', badge: 'bg-purple-50 text-purple-700'    },
    client:          { label: 'Client',           badge: 'bg-emerald-50 text-emerald-700' },
};

const AVATAR_COLORS = {
    admin:           '#CC0000',
    auditeur_senior: '#3B82F6',
    auditeur_junior: '#8B5CF6',
    client:          '#10B981',
};

const emptyForm = { nom: '', prenom: '', email: '', role: 'auditeur_junior', organisation: '', telephone: '', entite_id: '' };

const getInitials = (prenom = '', nom = '') =>
    ((prenom[0] ?? '') + (nom[0] ?? '')).toUpperCase() || '?';

const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition';

// ─────────────────────────────────────────────────────────────────────────────

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

    const totalActifs  = users.filter(u => u.actif).length;
    const totalInactifs = users.filter(u => !u.actif).length;
    const totalPending = users.filter(u => u.must_change_password).length;

    return (
        <div>
            {/* En-tête */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Utilisateurs</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Gestion des comptes de la plateforme</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--brand-red)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Nouvel utilisateur
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-5">
                <StatCard value={users.length}  label="Total"                color="gray"  />
                <StatCard value={totalActifs}   label="Actifs"               color="green" />
                <StatCard value={totalInactifs} label="Inactifs"             color="red"   />
                <StatCard value={totalPending}  label="Att. 1ère connexion"  color="amber" />
            </div>

            {/* Filtres */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input type="text" placeholder="Rechercher par nom, email, organisation..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition" />
                </div>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 transition min-w-[160px]">
                    <option value="">Tous les rôles</option>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
                </select>
                <select value={filterActif} onChange={e => setFilterActif(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 transition min-w-[130px]">
                    <option value="">Tous statuts</option>
                    <option value="true">Actifs</option>
                    <option value="false">Inactifs</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-gray-500">Aucun utilisateur trouvé</p>
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
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                                                    style={{ backgroundColor: AVATAR_COLORS[u.role] ?? '#9CA3AF' }}>
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
                                        <td className="px-5 py-3">
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => handleToggleActif(u)}
                                                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full transition w-fit ${u.actif ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                    title={u.actif ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${u.actif ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                    {u.actif ? 'Actif' : 'Inactif'}
                                                </button>
                                                {u.must_change_password && (
                                                    <span className="text-[10px] text-amber-600 font-medium">Att. connexion</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(u)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Modifier">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => setResetTarget(u)}
                                                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Réinitialiser le mot de passe">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </button>
                                                {!isSelf && (
                                                    <button onClick={() => setDeleteTarget(u)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
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

            {/* Modal formulaire */}
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

/* ── Stat Card ─────────────────────────────────────────────────────────────── */
const COLOR_MAP = {
    gray:  { bg: 'bg-gray-50',  value: 'text-gray-900', label: 'text-gray-400'  },
    green: { bg: 'bg-green-50', value: 'text-green-700',label: 'text-green-500' },
    red:   { bg: 'bg-red-50',   value: 'text-red-700',  label: 'text-red-400'   },
    amber: { bg: 'bg-amber-50', value: 'text-amber-700',label: 'text-amber-500' },
};

const StatCard = ({ value, label, color = 'gray' }) => {
    const c = COLOR_MAP[color];
    return (
        <div className={`rounded-xl border border-gray-200 p-4 ${c.bg}`}>
            <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
            <p className={`text-xs mt-0.5 ${c.label}`}>{label}</p>
        </div>
    );
};

/* ── Form Modal ─────────────────────────────────────────────────────────────── */
const UserFormModal = ({ form, setF, editingId, submitting, entites, onSubmit, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">
                        {editingId ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
                    </h2>
                    {!editingId && (
                        <p className="text-xs text-gray-400 mt-0.5">Les identifiants seront envoyés par email automatiquement.</p>
                    )}
                </div>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Prénom" required>
                        <input type="text" required value={form.prenom} onChange={e => setF('prenom', e.target.value)} placeholder="Prénom" className={inputCls} />
                    </Field>
                    <Field label="Nom" required>
                        <input type="text" required value={form.nom} onChange={e => setF('nom', e.target.value)} placeholder="Nom" className={inputCls} />
                    </Field>
                </div>

                {!editingId && (
                    <Field label="Email" required>
                        <input type="email" required value={form.email} onChange={e => setF('email', e.target.value)} placeholder="prenom.nom@organisation.ma" className={inputCls} />
                    </Field>
                )}

                <Field label="Rôle" required>
                    <select required value={form.role} onChange={e => setF('role', e.target.value)} className={inputCls}>
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
                    </select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Organisation">
                        <input type="text" value={form.organisation} onChange={e => setF('organisation', e.target.value)} placeholder="Nom de l'organisation" className={inputCls} />
                    </Field>
                    <Field label="Téléphone">
                        <input type="text" value={form.telephone} onChange={e => setF('telephone', e.target.value)} placeholder="+212 6 00 00 00 00" className={inputCls} />
                    </Field>
                </div>

                {form.role === 'client' && (
                    <Field label="Entité auditée" required>
                        <select value={form.entite_id} onChange={e => setF('entite_id', e.target.value)} className={inputCls}>
                            <option value="">— Sélectionner une entité —</option>
                            {entites.map(e => (
                                <option key={e.id} value={e.id}>{e.nom}</option>
                            ))}
                        </select>
                    </Field>
                )}

                {editingId && (
                    <div className="flex items-center gap-3 py-1">
                        <button type="button" onClick={() => setF('actif', !form.actif)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.actif ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${form.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm text-gray-700">Compte {form.actif ? 'actif' : 'inactif'}</span>
                    </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button type="submit" disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {editingId ? 'Enregistrer' : 'Créer et envoyer'}
                    </button>
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    </div>
);

const Field = ({ label, required, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

export default UtilisateursPage;
