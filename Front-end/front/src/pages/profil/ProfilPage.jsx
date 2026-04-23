import { useEffect, useState } from 'react';
import { useAuth } from '../../store/auth/AuthContext';
import { getUserById, updateUser } from '../../services/endpoints/userService';
import { changePassword } from '../../services/endpoints/authService';
import { toast } from 'react-toastify';

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

const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition';

const ProfilPage = () => {
    const { user: authUser, updateUserContext } = useAuth();
    const [profile, setProfile]   = useState(null);
    const [loading, setLoading]   = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [infoForm, setInfoForm] = useState({ nom: '', prenom: '', organisation: '', telephone: '' });
    const [savingInfo, setSavingInfo] = useState(false);

    const [pwdForm, setPwdForm]   = useState({ old: '', new: '', confirm: '' });
    const [savingPwd, setSavingPwd] = useState(false);
    const [showPwd, setShowPwd]   = useState({ old: false, new: false, confirm: false });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getUserById(authUser.id);
                const u = res.data.user;
                setProfile(u);
                setInfoForm({ nom: u.nom || '', prenom: u.prenom || '', organisation: u.organisation || '', telephone: u.telephone || '' });
            } catch {
                toast.error('Erreur lors du chargement du profil');
            } finally {
                setLoading(false);
            }
        };
        if (authUser?.id) fetchProfile();
    }, [authUser?.id]);

    const handleSaveInfo = async (e) => {
        e.preventDefault();
        setSavingInfo(true);
        try {
            const res = await updateUser(profile.id, infoForm);
            const updated = res.data.user;
            setProfile(prev => ({ ...prev, ...updated }));
            updateUserContext(updated);
            setEditMode(false);
            toast.success('Profil mis à jour');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setSavingInfo(false);
        }
    };

    const handleChangePwd = async (e) => {
        e.preventDefault();
        if (pwdForm.new !== pwdForm.confirm) {
            toast.error('Les nouveaux mots de passe ne correspondent pas');
            return;
        }
        if (pwdForm.new.length < 6) {
            toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères');
            return;
        }
        setSavingPwd(true);
        try {
            await changePassword(pwdForm.old, pwdForm.new);
            setPwdForm({ old: '', new: '', confirm: '' });
            toast.success('Mot de passe modifié avec succès');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Mot de passe actuel incorrect');
        } finally {
            setSavingPwd(false);
        }
    };

    const cancelEdit = () => {
        setInfoForm({ nom: profile.nom || '', prenom: profile.prenom || '', organisation: profile.organisation || '', telephone: profile.telephone || '' });
        setEditMode(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
            </div>
        );
    }

    const rc = ROLE_CONFIG[profile?.role] ?? ROLE_CONFIG.client;
    const avatarColor = AVATAR_COLORS[profile?.role] ?? '#9CA3AF';
    const initials = ((profile?.prenom?.[0] ?? '') + (profile?.nom?.[0] ?? '')).toUpperCase() || '?';

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Mon profil</h1>
                <p className="text-sm text-gray-500 mt-0.5">Gérez vos informations personnelles et votre sécurité</p>
            </div>

            {/* ── Carte profil ── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
                {/* Bandeau coloré */}
                <div className="h-14" style={{ backgroundColor: avatarColor + '22' }} />

                <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold -mt-8 mb-4 shadow-md"
                        style={{ backgroundColor: avatarColor }}>
                        {initials}
                    </div>

                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {profile?.prenom} {profile?.nom}
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">{profile?.email}</p>
                            <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full ${rc.badge}`}>
                                {rc.label}
                            </span>
                        </div>
                        {!editMode && (
                            <button onClick={() => setEditMode(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                </svg>
                                Modifier
                            </button>
                        )}
                    </div>

                    {editMode ? (
                        <form onSubmit={handleSaveInfo} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Prénom">
                                    <input type="text" required value={infoForm.prenom}
                                        onChange={e => setInfoForm(p => ({ ...p, prenom: e.target.value }))}
                                        className={inputCls} />
                                </Field>
                                <Field label="Nom">
                                    <input type="text" required value={infoForm.nom}
                                        onChange={e => setInfoForm(p => ({ ...p, nom: e.target.value }))}
                                        className={inputCls} />
                                </Field>
                            </div>
                            <Field label="Organisation">
                                <input type="text" value={infoForm.organisation}
                                    onChange={e => setInfoForm(p => ({ ...p, organisation: e.target.value }))}
                                    placeholder="Nom de l'organisation"
                                    className={inputCls} />
                            </Field>
                            <Field label="Téléphone">
                                <input type="text" value={infoForm.telephone}
                                    onChange={e => setInfoForm(p => ({ ...p, telephone: e.target.value }))}
                                    placeholder="+212 6 00 00 00 00"
                                    className={inputCls} />
                            </Field>
                            <div className="flex gap-2 pt-1">
                                <button type="submit" disabled={savingInfo}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 hover:opacity-90 transition"
                                    style={{ backgroundColor: 'var(--brand-red)' }}>
                                    {savingInfo && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Enregistrer
                                </button>
                                <button type="button" onClick={cancelEdit}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                            <InfoItem label="Organisation" value={profile?.organisation || '—'} />
                            <InfoItem label="Téléphone"    value={profile?.telephone    || '—'} />
                            <InfoItem label="Email"        value={profile?.email        || '—'} />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Sécurité — changement de mot de passe ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Changer le mot de passe</h3>
                <p className="text-xs text-gray-400 mb-5">Utilisez un mot de passe fort d'au moins 6 caractères.</p>

                <form onSubmit={handleChangePwd} className="space-y-4">
                    <Field label="Mot de passe actuel">
                        <PasswordInput value={pwdForm.old} onChange={v => setPwdForm(p => ({ ...p, old: v }))}
                            show={showPwd.old} onToggle={() => setShowPwd(p => ({ ...p, old: !p.old }))}
                            placeholder="••••••••" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Nouveau mot de passe">
                            <PasswordInput value={pwdForm.new} onChange={v => setPwdForm(p => ({ ...p, new: v }))}
                                show={showPwd.new} onToggle={() => setShowPwd(p => ({ ...p, new: !p.new }))}
                                placeholder="••••••••" />
                        </Field>
                        <Field label="Confirmer">
                            <PasswordInput value={pwdForm.confirm} onChange={v => setPwdForm(p => ({ ...p, confirm: v }))}
                                show={showPwd.confirm} onToggle={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))}
                                placeholder="••••••••" />
                        </Field>
                    </div>
                    <button type="submit" disabled={savingPwd || !pwdForm.old || !pwdForm.new || !pwdForm.confirm}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        {savingPwd && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Changer le mot de passe
                    </button>
                </form>
            </div>
        </div>
    );
};

/* ── Petits composants ──────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
        {children}
    </div>
);

const InfoItem = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-gray-700">{value}</p>
    </div>
);

const PasswordInput = ({ value, onChange, show, onToggle, placeholder }) => (
    <div className="relative">
        <input type={show ? 'text' : 'password'} required value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition" />
        <button type="button" onClick={onToggle}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
            ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )}
        </button>
    </div>
);

export default ProfilPage;
