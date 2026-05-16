import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
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

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 transition';

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
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
                <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                    {isAdmin
                        ? 'Gérez vos préférences de notifications et la configuration globale de la plateforme.'
                        : 'Gérez vos préférences de notifications.'}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-5 items-start">
            {/* ── Colonne gauche ── */}
            <div className="col-span-2 space-y-5">

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
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60 transition hover:opacity-90"
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
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60 transition hover:opacity-90"
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

            </div>{/* fin col gauche */}

            {/* ── Colonne droite : Aide ── */}
            <div className="col-span-1 space-y-4">
                <HelpPanel isAdmin={isAdmin} />
            </div>

            </div>{/* fin grid */}
        </div>
    );
};

/* ── FAQ item accordion ────────────────────────────────────────────────────── */
const FaqItem = ({ question, children }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between py-3 text-left gap-3 group"
            >
                <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition">{question}</span>
                <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            {open && (
                <p className="text-xs text-gray-500 leading-relaxed pb-3">{children}</p>
            )}
        </div>
    );
};

/* ── Help Panel ─────────────────────────────────────────────────────────────── */
const QUICK_LINKS = [
    { label: 'Audits',          to: '/audits',      icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z' },
    { label: 'Entités',         to: '/entites',     icon: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
    { label: 'Plans d\'actions', to: '/plans-actions', icon: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75' },
    { label: 'Rapports',        to: '/rapports',    icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3' },
    { label: 'Journaux',        to: '/journaux',    icon: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z' },
];

const HelpPanel = ({ isAdmin }) => (
    <div className="space-y-4">
        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Questions fréquentes</h3>
            </div>
            <div className="px-5">
                <FaqItem question="Comment créer un nouvel audit ?">
                    Rendez-vous dans la section <strong>Audits</strong>, cliquez sur <em>Nouvel audit</em>, renseignez le nom, le client, le référentiel et les dates, puis validez.
                </FaqItem>
                <FaqItem question="Comment ajouter un utilisateur ?">
                    Dans <strong>Utilisateurs</strong>, cliquez sur <em>Nouvel utilisateur</em>. Un email avec les identifiants temporaires est envoyé automatiquement à l'adresse renseignée.
                </FaqItem>
                <FaqItem question="Comment exporter un rapport ?">
                    Allez dans <strong>Rapports & Exports</strong>, sélectionnez un audit terminé et cliquez sur <em>PDF</em> ou <em>Excel</em>. L'audit doit être au statut <em>Terminé</em>.
                </FaqItem>
                <FaqItem question="Comment valider un plan d'action ?">
                    Dans <strong>Travaux soumis</strong>, onglet <em>Plans d'actions</em>, ouvrez le plan concerné et changez son statut via le menu déroulant.
                </FaqItem>
                {isAdmin && (
                    <FaqItem question="Les emails de notification ne partent pas ?">
                        Vérifiez que l'option <em>Activer les emails globalement</em> est bien activée dans la section Configuration ci-dessus, et que les préférences de l'utilisateur concerné sont configurées.
                    </FaqItem>
                )}
            </div>
        </div>

        {/* Accès rapide */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Accès rapide</h3>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
                {QUICK_LINKS.map(({ label, to, icon }) => (
                    <Link key={to} to={to}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition group">
                        <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                            </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition">{label}</span>
                    </Link>
                ))}
            </div>
        </div>
    </div>
);

export default ParametresPage;
