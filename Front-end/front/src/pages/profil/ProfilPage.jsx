import { useEffect, useState } from 'react';
import { useAuth } from '../../store/auth/AuthContext';
import { getProfile, updateProfile } from '../../services/endpoints/userService';
import { changePassword } from '../../services/endpoints/authService';
import { getLogs } from '../../services/endpoints/logService';
import { toast } from 'react-toastify';

const ACTION_LABELS = {
    LOGIN:              'Connexion',
    LOGIN_FAILED:       'Échec connexion',
    CREATE_AUDIT:       'Audit créé',
    UPDATE_AUDIT:       'Audit modifié',
    DELETE_AUDIT:       'Audit supprimé',
    CREATE_USER:        'Utilisateur créé',
    UPDATE_USER:        'Utilisateur modifié',
    DELETE_USER:        'Utilisateur supprimé',
    RESET_PASSWORD:     'Réinit. mot de passe',
    CHANGE_PASSWORD:    'Mot de passe changé',
    CREATE_ENTITE:      'Entité créée',
    UPDATE_ENTITE:      'Entité modifiée',
    DELETE_ENTITE:      'Entité supprimée',
    CREATE_PLAN_ACTION: 'Plan action créé',
    UPDATE_PLAN_ACTION: 'Plan action modifié',
    DELETE_PLAN_ACTION: 'Plan action supprimé',
};

const fmtDate = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const fmtDateShort = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const ROLE_CONFIG = {
    admin:           { label: 'Administrateur',  badge: 'bg-red-50 text-red-700'          },
    auditeur_senior: { label: 'Auditeur Senior', badge: 'bg-blue-50 text-blue-700'        },
    auditeur_junior: { label: 'Auditeur Junior', badge: 'bg-purple-50 text-purple-700'    },
    client:          { label: 'Client',           badge: 'bg-emerald-50 text-emerald-700' },
};

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 transition';

const ProfilPage = () => {
    const { user: authUser, updateUserContext } = useAuth();
    const [profile, setProfile]   = useState(null);
    const [loading, setLoading]   = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [infoForm, setInfoForm] = useState({ nom: '', prenom: '', organisation: '', telephone: '' });
    const [savingInfo, setSavingInfo] = useState(false);

    const [pwdForm, setPwdForm]     = useState({ old: '', new: '', confirm: '' });
    const [savingPwd, setSavingPwd] = useState(false);
    const [showPwd, setShowPwd]     = useState({ old: false, new: false, confirm: false });

    const [recentLogs, setRecentLogs]       = useState([]);
    const [loadingLogs, setLoadingLogs]     = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getProfile();
                const u = res.data.user;
                setProfile(u);
                setInfoForm({ nom: u.nom || '', prenom: u.prenom || '', organisation: u.organisation || '', telephone: u.telephone || '' });

                // Charger l'activité récente
                setLoadingLogs(true);
                try {
                    const logRes = await getLogs({ user_id: u.id, limit: 5 });
                    setRecentLogs(logRes.data.logs || []);
                } catch { /* silencieux */ } finally {
                    setLoadingLogs(false);
                }
            } catch {
                toast.error('Erreur lors du chargement du profil');
            } finally {
                setLoading(false);
            }
        };
        if (authUser) fetchProfile();
    }, [authUser]);

    const handleSaveInfo = async (e) => {
        e.preventDefault();
        setSavingInfo(true);
        try {
            const res = await updateProfile(infoForm);
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
    const initials = ((profile?.prenom?.[0] ?? '') + (profile?.nom?.[0] ?? '')).toUpperCase() || '?';

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>
                <p className="text-sm text-gray-400 mt-0.5">Gérez vos informations personnelles et votre sécurité</p>
            </div>

            <div className="grid grid-cols-3 gap-5 items-start">
            {/* ── Colonne gauche ── */}
            <div className="col-span-2 space-y-4">

            {/* ── Carte profil ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 pt-6 pb-6">
                    {/* Header sobre */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold bg-gray-100 text-gray-600 flex-shrink-0">
                                {initials}
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">
                                    {profile?.prenom} {profile?.nom}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">{profile?.email}</p>
                                <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${rc.badge}`}>
                                    {rc.label}
                                </span>
                            </div>
                        </div>
                        {!editMode && (
                            <button onClick={() => setEditMode(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                </svg>
                                Modifier
                            </button>
                        )}
                    </div>

                    {editMode ? (
                        <form onSubmit={handleSaveInfo} className="space-y-4 pt-4 border-t border-gray-100">
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
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60 hover:opacity-90 transition"
                                    style={{ backgroundColor: 'var(--brand-red)' }}>
                                    {savingInfo && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Enregistrer
                                </button>
                                <button type="button" onClick={cancelEdit}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 pt-4 border-t border-gray-100">
                            <InfoItem label="Organisation" value={profile?.organisation || '—'} />
                            <InfoItem label="Téléphone"    value={profile?.telephone    || '—'} />
                            <InfoItem label="Email"        value={profile?.email        || '—'} />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Informations du compte ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Informations du compte</h3>
                </div>
                <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-4">
                    <InfoItem label="Membre depuis" value={profile?.createdAt ? fmtDateShort(profile.createdAt) : '—'} />
                    <InfoItem label="Statut"
                        value={
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${profile?.actif ? 'bg-green-500' : 'bg-gray-300'}`} />
                                {profile?.actif ? 'Actif' : 'Inactif'}
                            </span>
                        }
                    />
                    <InfoItem label="Identifiant" value={`#${profile?.id}`} />
                    {profile?.must_change_password && (
                        <div className="col-span-2 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <p className="text-xs text-amber-700 font-medium">Vous utilisez encore un mot de passe temporaire. Veuillez le changer.</p>
                        </div>
                    )}
                </div>
            </div>

            </div>{/* fin col-span-2 */}

            {/* ── Colonne droite ── */}
            <div className="col-span-1 space-y-4">

            {/* ── Sécurité ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Changer le mot de passe</h3>
                <p className="text-xs text-gray-400 mb-5">Utilisez un mot de passe fort d'au moins 6 caractères.</p>

                <form onSubmit={handleChangePwd} className="space-y-4">
                    <Field label="Mot de passe actuel">
                        <PasswordInput value={pwdForm.old} onChange={v => setPwdForm(p => ({ ...p, old: v }))}
                            show={showPwd.old} onToggle={() => setShowPwd(p => ({ ...p, old: !p.old }))}
                            placeholder="••••••••" />
                    </Field>
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
                    <button type="submit" disabled={savingPwd || !pwdForm.old || !pwdForm.new || !pwdForm.confirm}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        {savingPwd && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Changer le mot de passe
                    </button>
                </form>
            </div>
            {/* ── Activité récente ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Activité récente</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Les 5 dernières actions effectuées sur votre compte</p>
                </div>
                <div className="divide-y divide-gray-50">
                    {loadingLogs ? (
                        <div className="flex justify-center py-8">
                            <div className="w-4 h-4 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                        </div>
                    ) : recentLogs.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-8 italic">Aucune activité enregistrée</p>
                    ) : (
                        recentLogs.map(log => {
                            const isDestructive = log.action?.startsWith('DELETE') || log.action === 'LOGIN_FAILED';
                            return (
                                <div key={log.id} className="flex items-center gap-3 px-6 py-3.5">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDestructive ? 'bg-red-50' : 'bg-gray-50'}`}>
                                        <svg className={`w-3.5 h-3.5 ${isDestructive ? 'text-red-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d={
                                                log.action === 'LOGIN' || log.action === 'LOGIN_FAILED'
                                                    ? 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9'
                                                    : log.action?.startsWith('DELETE')
                                                        ? 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'
                                                        : log.action?.startsWith('CREATE')
                                                            ? 'M12 4.5v15m7.5-7.5h-15'
                                                            : 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z'
                                            } />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800">
                                            {ACTION_LABELS[log.action] ?? log.action}
                                        </p>
                                        {log.details && (
                                            <p className="text-[10px] text-gray-400 truncate">{log.details}</p>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                                        {fmtDate(log.createdAt)}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            </div>{/* fin col droite */}
            </div>{/* fin grid */}
        </div>
    );
};

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
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 pr-9 focus:outline-none focus:ring-1 focus:ring-gray-300 transition" />
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
