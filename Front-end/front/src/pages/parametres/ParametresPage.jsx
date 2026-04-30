import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../store/auth/AuthContext';
import { getPreferences, updatePreferences } from '../../services/endpoints/userService';
import { getSettings, updateSettings } from '../../services/endpoints/settingsService';

const NOTIF_TYPES = [
    { key: 'AUDIT_ASSIGNE',    label: 'Audit assigné' },
    { key: 'AUDIT_EN_ATTENTE', label: 'Audit soumis pour validation' },
    { key: 'AUDIT_VALIDE',     label: 'Audit validé' },
    { key: 'AUDIT_REJETE',     label: 'Audit rejeté' },
    { key: 'PLAN_EN_ATTENTE',  label: "Plan d'action soumis" },
    { key: 'PLAN_VALIDE',      label: "Plan d'action validé" },
    { key: 'PLAN_REJETE',      label: "Plan d'action rejeté" },
];

const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition color-[#111827]';

/* ── Toggle Switch ─────────────────────────────────────────────────────────── */
const Toggle = ({ checked, onChange, id }) => (
    <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-red-200 ${checked ? '' : 'bg-gray-300'}`}
        style={checked ? { backgroundColor: 'var(--brand-red)' } : {}}
    >
        <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
    </button>
);

/* ── Section card wrapper ──────────────────────────────────────────────────── */
const Card = ({ title, description, children }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
        <div className="px-6 py-5">{children}</div>
    </div>
);

/* ── Field wrapper ─────────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {label}
        </label>
        {children}
    </div>
);

/* ══════════════════════════════════════════════════════════════════════════════
   ParametresPage
══════════════════════════════════════════════════════════════════════════════ */
const ParametresPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // ── Notification preferences state ──────────────────────────────────────
    const [prefs, setPrefs]             = useState({});
    const [loadingPrefs, setLoadingPrefs] = useState(true);
    const [savingPrefs, setSavingPrefs]   = useState(false);

    // ── App settings state (admin only) ─────────────────────────────────────
    const [settings, setSettings]           = useState({ org_nom: '', org_email: '', emails_enabled: 'true' });
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [savingSettings, setSavingSettings]   = useState(false);

    // ── Load preferences on mount ────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const res = await getPreferences();
                setPrefs(res.data.notification_prefs || {});
            } catch {
                toast.error('Erreur lors du chargement des préférences');
            } finally {
                setLoadingPrefs(false);
            }
        })();
    }, []);

    // ── Load app settings on mount (admin only) ──────────────────────────────
    useEffect(() => {
        if (!isAdmin) return;
        setLoadingSettings(true);
        (async () => {
            try {
                const res = await getSettings();
                const s = res.data.settings || {};
                setSettings({
                    org_nom:        s.org_nom        ?? '',
                    org_email:      s.org_email      ?? '',
                    emails_enabled: s.emails_enabled ?? 'true',
                });
            } catch {
                toast.error('Erreur lors du chargement des paramètres');
            } finally {
                setLoadingSettings(false);
            }
        })();
    }, [isAdmin]);

    // ── Toggle a notification type ────────────────────────────────────────────
    const togglePref = (key, value) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
    };

    // ── Save notification preferences ────────────────────────────────────────
    const handleSavePrefs = async (e) => {
        e.preventDefault();
        setSavingPrefs(true);
        try {
            await updatePreferences(prefs);
            toast.success('Préférences enregistrées');
        } catch {
            toast.error("Erreur lors de l'enregistrement des préférences");
        } finally {
            setSavingPrefs(false);
        }
    };

    // ── Save app settings ────────────────────────────────────────────────────
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            await updateSettings(settings);
            toast.success('Paramètres enregistrés');
        } catch {
            toast.error("Erreur lors de l'enregistrement des paramètres");
        } finally {
            setSavingSettings(false);
        }
    };

    return (
        <div>
            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Paramètres</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {isAdmin
                        ? 'Gérez vos préférences de notifications et la configuration globale de la plateforme.'
                        : 'Gérez vos préférences de notifications.'}
                </p>
            </div>

            {/* ── Section 1 : Préférences notifications ── */}
            <Card
                title="Préférences de notifications"
                description="Choisissez les événements pour lesquels vous souhaitez recevoir un email de notification."
            >
                {loadingPrefs ? (
                    <div className="flex justify-center py-8">
                        <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                    </div>
                ) : (
                    <form onSubmit={handleSavePrefs}>
                        <div className="space-y-4 mb-6">
                            {NOTIF_TYPES.map(({ key, label }) => {
                                const checked = prefs[key] !== false;
                                return (
                                    <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <label htmlFor={`pref-${key}`} className="text-sm text-gray-700 cursor-pointer select-none">
                                            {label}
                                        </label>
                                        <Toggle
                                            id={`pref-${key}`}
                                            checked={checked}
                                            onChange={(val) => togglePref(key, val)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={savingPrefs}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition hover:opacity-90"
                                style={{ backgroundColor: 'var(--brand-red)' }}
                            >
                                {savingPrefs && (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                Enregistrer
                            </button>
                        </div>
                    </form>
                )}
            </Card>

            {/* ── Section 2 : Configuration application (admin only) ── */}
            {isAdmin && (
                <Card
                    title="Configuration de l'application"
                    description="Paramètres généraux de la plateforme ZeroGap."
                >
                    {loadingSettings ? (
                        <div className="flex justify-center py-8">
                            <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                        </div>
                    ) : (
                        <form onSubmit={handleSaveSettings}>
                            <div className="space-y-4 mb-6">
                                <Field label="Nom de l'organisation">
                                    <input
                                        type="text"
                                        value={settings.org_nom}
                                        onChange={e => setSettings(s => ({ ...s, org_nom: e.target.value }))}
                                        placeholder="ex. DataProtect SA"
                                        className={inputCls}
                                        style={{ color: '#111827' }}
                                    />
                                </Field>

                                <Field label="Email de contact">
                                    <input
                                        type="email"
                                        value={settings.org_email}
                                        onChange={e => setSettings(s => ({ ...s, org_email: e.target.value }))}
                                        placeholder="ex. contact@dataprotect.ma"
                                        className={inputCls}
                                        style={{ color: '#111827' }}
                                    />
                                </Field>

                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Activer les emails de notification globalement</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Si désactivé, aucun email de notification ne sera envoyé à aucun utilisateur.</p>
                                    </div>
                                    <Toggle
                                        id="emails-enabled"
                                        checked={settings.emails_enabled !== 'false'}
                                        onChange={(val) => setSettings(s => ({ ...s, emails_enabled: val ? 'true' : 'false' }))}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition hover:opacity-90"
                                    style={{ backgroundColor: 'var(--brand-red)' }}
                                >
                                    {savingSettings && (
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    )}
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    )}
                </Card>
            )}
        </div>
    );
};

export default ParametresPage;
