import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/auth/AuthContext';
import { getAllAudits } from '../../services/endpoints/auditService';
import { getAllPlanActions } from '../../services/endpoints/planActionService';
import { getAllReferentiels } from '../../services/endpoints/referentielService';

// ── Config ────────────────────────────────────────────────────────────────────

const STATUT_AUDIT = {
    brouillon: { label: 'Brouillon', color: '#9ca3af' },
    en_cours:  { label: 'En cours',  color: '#3b82f6' },
    termine:   { label: 'Terminé',   color: '#16a34a' },
    archive:   { label: 'Archivé',   color: '#d97706' },
};

const STATUT_BADGE = {
    brouillon: 'bg-gray-100 text-gray-600',
    en_cours:  'bg-blue-50 text-blue-700',
    termine:   'bg-green-50 text-green-700',
    archive:   'bg-yellow-50 text-yellow-700',
};

const PRIORITE = {
    critique: { label: 'Critique', color: '#CC0000', bar: '#CC0000',  badge: 'bg-red-50 text-red-700' },
    haute:    { label: 'Haute',    color: '#ea580c', bar: '#ea580c',  badge: 'bg-orange-50 text-orange-700' },
    moyenne:  { label: 'Moyenne',  color: '#d97706', bar: '#d97706',  badge: 'bg-amber-50 text-amber-700' },
    faible:   { label: 'Faible',   color: '#6b7280', bar: '#9ca3af', badge: 'bg-gray-100 text-gray-600' },
};

// ── SVG Donut ─────────────────────────────────────────────────────────────────

const DonutChart = ({ segments, total }) => {
    const cx = 60, cy = 60, r = 42, sw = 15;
    const circ = 2 * Math.PI * r;
    let cum = 0;
    const computed = segments.map(s => {
        const dash = total > 0 ? (s.value / total) * circ : 0;
        const item = { ...s, dash, offset: -cum };
        cum += dash;
        return item;
    });

    return (
        <svg width="130" height="130" viewBox="0 0 120 120">
            <g transform={`rotate(-90,${cx},${cy})`}>
                {total === 0
                    ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
                    : computed.filter(s => s.value > 0).map((s, i) => (
                        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                            stroke={s.color} strokeWidth={sw}
                            strokeDasharray={`${s.dash} ${circ - s.dash}`}
                            strokeDashoffset={s.offset}
                        />
                    ))
                }
            </g>
            <text x={cx} y={cy - 7} textAnchor="middle"
                style={{ fontSize: '23px', fontWeight: '700', fill: '#111827', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {total}
            </text>
            <text x={cx} y={cy + 13} textAnchor="middle"
                style={{ fontSize: '8.5px', fill: '#9ca3af', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.1em' }}>
                AUDITS
            </text>
        </svg>
    );
};

// ── SVG Ring ──────────────────────────────────────────────────────────────────

const RingChart = ({ pct }) => {
    const cx = 60, cy = 60, r = 42, sw = 15;
    const circ = 2 * Math.PI * r;
    const dash = (Math.min(pct, 100) / 100) * circ;

    return (
        <svg width="130" height="130" viewBox="0 0 120 120">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
            <circle cx={cx} cy={cy} r={r} fill="none"
                stroke="var(--brand-red)" strokeWidth={sw}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={circ * 0.25}
                strokeLinecap="round"
            />
            <text x={cx} y={cy - 7} textAnchor="middle"
                style={{ fontSize: '23px', fontWeight: '700', fill: '#111827', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {pct}%
            </text>
            <text x={cx} y={cy + 13} textAnchor="middle"
                style={{ fontSize: '8.5px', fill: '#9ca3af', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.1em' }}>
                CLÔTURÉES
            </text>
        </svg>
    );
};

// ── Skeleton loader ───────────────────────────────────────────────────────────

const Skeleton = ({ className }) => (
    <div className={`bg-gray-100 animate-pulse rounded ${className}`} />
);

// ── Main ──────────────────────────────────────────────────────────────────────

const DashboardPage = () => {
    const { user } = useAuth();
    const [audits, setAudits] = useState([]);
    const [plans, setPlans] = useState([]);
    const [referentiels, setReferentiels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getAllAudits(), getAllPlanActions(), getAllReferentiels()])
            .then(([a, p, r]) => {
                setAudits(a.data.audits || []);
                setPlans(p.data.plans_actions || []);
                setReferentiels(r.data.referentiels || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // ── Données dérivées ──────────────────────────────────────────────────────

    const today = new Date();

    const enCours  = audits.filter(a => a.statut === 'en_cours').length;
    const termines = audits.filter(a => a.statut === 'termine').length;

    const donutSegments = ['brouillon', 'en_cours', 'termine', 'archive'].map(s => ({
        label: STATUT_AUDIT[s].label,
        color: STATUT_AUDIT[s].color,
        value: audits.filter(a => a.statut === s).length,
    }));

    const actionsOuvertes  = plans.filter(p => p.statut === 'a_faire' || p.statut === 'en_cours').length;
    const actionsTerminees = plans.filter(p => p.statut === 'termine').length;
    const cloturePct = plans.length > 0 ? Math.round((actionsTerminees / plans.length) * 100) : 0;

    const plansByPrio = ['critique', 'haute', 'moyenne', 'faible'].map(key => ({
        key,
        ...PRIORITE[key],
        total:   plans.filter(p => p.priorite === key).length,
        ouvertes: plans.filter(p => p.priorite === key && (p.statut === 'a_faire' || p.statut === 'en_cours')).length,
    }));
    const maxPrio = Math.max(...plansByPrio.map(p => p.total), 1);

    const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const echeances = audits
        .filter(a => {
            if (!a.date_fin || a.statut === 'termine' || a.statut === 'archive') return false;
            const d = new Date(a.date_fin);
            return d >= today && d <= in30;
        })
        .sort((a, b) => new Date(a.date_fin) - new Date(b.date_fin))
        .slice(0, 5);

    const actionsCritiques = plans
        .filter(p => (p.priorite === 'critique' || p.priorite === 'haute') && (p.statut === 'a_faire' || p.statut === 'en_cours'))
        .sort((a, b) => (a.priorite === 'critique' ? -1 : 1))
        .slice(0, 5);

    const recents = [...audits]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5);

    const daysLeft = (dateFin) => Math.ceil((new Date(dateFin) - today) / 86400000);

    const daysColor = (n) =>
        n <= 3 ? { bg: 'bg-red-500',   text: 'text-red-600' }
      : n <= 7 ? { bg: 'bg-amber-400', text: 'text-amber-600' }
      :          { bg: 'bg-green-500', text: 'text-green-600' };

    const stats = [
        {
            label: 'Audits en cours',
            value: loading ? null : enCours,
            sub: `${audits.length} au total`,
            accent: true,
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
        },
        {
            label: 'Actions ouvertes',
            value: loading ? null : actionsOuvertes,
            sub: `${plans.length} au total`,
            accent: false,
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>,
        },
        {
            label: 'Référentiels',
            value: loading ? null : referentiels.length,
            sub: referentiels.map(r => r.type).join(', ') || 'Aucun',
            accent: false,
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
        },
        {
            label: 'Audits terminés',
            value: loading ? null : termines,
            sub: 'Évaluations complètes',
            accent: false,
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* ── Greeting ── */}
            <div>
                <h1 className="text-xl font-semibold text-gray-900">
                    Bonjour, {user?.prenom} {user?.nom}
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">
                    {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-5"
                        style={s.accent ? { borderTopWidth: '3px', borderTopColor: 'var(--brand-red)' } : {}}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</p>
                            <div className="p-1.5 rounded-lg"
                                style={{ backgroundColor: s.accent ? 'var(--brand-red-light)' : '#F3F4F6', color: s.accent ? 'var(--brand-red)' : '#6B7280' }}>
                                {s.icon}
                            </div>
                        </div>
                        {loading
                            ? <Skeleton className="h-8 w-12 mb-1" />
                            : <p className="text-3xl font-bold" style={{ color: s.accent ? 'var(--brand-red)' : '#111827' }}>{s.value}</p>
                        }
                        <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Charts row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Donut — répartition des audits */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm font-semibold text-gray-800 mb-4">Statuts des audits</p>
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                        </div>
                    ) : (
                        <div className="flex items-center gap-5">
                            <DonutChart segments={donutSegments} total={audits.length} />
                            <div className="space-y-2.5 flex-1 min-w-0">
                                {donutSegments.map((seg, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                                            <span className="text-xs text-gray-600 truncate">{seg.label}</span>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-800 flex-shrink-0">{seg.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Barres — plans par priorité */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm font-semibold text-gray-800 mb-4">Plans d'actions par priorité</p>
                    {loading ? (
                        <div className="space-y-4 pt-2">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {plansByPrio.map(p => (
                                <div key={p.key}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-700">{p.label}</span>
                                            {p.ouvertes > 0 && (
                                                <span className={`text-[10px] font-medium px-1.5 py-px rounded ${p.badge}`}>
                                                    {p.ouvertes} ouvertes
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-800">{p.total}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${(p.total / maxPrio) * 100}%`,
                                                backgroundColor: p.bar,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {plans.length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-6">Aucun plan d'action</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Ring — taux de clôture */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm font-semibold text-gray-800 mb-4">Taux de clôture</p>
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <RingChart pct={cloturePct} />
                            <div className="w-full space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs text-gray-500">Actions terminées</span>
                                    <span className="text-xs font-semibold text-gray-800">{actionsTerminees}</span>
                                </div>
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs text-gray-500">Actions ouvertes</span>
                                    <span className="text-xs font-semibold text-gray-800">{actionsOuvertes}</span>
                                </div>
                                <div className="h-px bg-gray-100 mx-1" />
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs text-gray-500">Total</span>
                                    <span className="text-xs font-semibold text-gray-800">{plans.length}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Contextual row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Échéances proches */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-gray-800">Échéances proches</p>
                        <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">30 prochains jours</span>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                        </div>
                    ) : echeances.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <svg className="w-8 h-8 text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <p className="text-xs text-gray-400">Aucune échéance dans les 30 prochains jours</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {echeances.map(audit => {
                                const left = daysLeft(audit.date_fin);
                                const { text, bg } = daysColor(left);
                                const totalDays = audit.date_debut
                                    ? Math.max(1, Math.ceil((new Date(audit.date_fin) - new Date(audit.date_debut)) / 86400000))
                                    : 30;
                                const progress = Math.max(5, Math.min(100, ((totalDays - left) / totalDays) * 100));
                                return (
                                    <Link key={audit.id} to={`/audits/${audit.id}`}
                                        className="block p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition group">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{audit.nom}</p>
                                                <p className="text-xs text-gray-400 truncate">{audit.client}</p>
                                            </div>
                                            <span className={`text-xs font-semibold ml-3 flex-shrink-0 ${text}`}>
                                                {left === 0 ? 'Aujourd\'hui' : `J-${left}`}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${bg}`} style={{ width: `${progress}%` }} />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Actions critiques ouvertes */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-gray-800">Actions prioritaires ouvertes</p>
                        {actionsCritiques.length > 0 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand-red-light)', color: 'var(--brand-red)' }}>
                                {actionsCritiques.length}
                            </span>
                        )}
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                        </div>
                    ) : actionsCritiques.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <svg className="w-8 h-8 text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                            <p className="text-xs text-gray-400">Aucune action critique ouverte</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {actionsCritiques.map((action, i) => (
                                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${action.priorite === 'critique' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                                    <span className={`text-[10px] font-semibold px-1.5 py-px rounded flex-shrink-0 mt-0.5 ${PRIORITE[action.priorite]?.badge}`}>
                                        {PRIORITE[action.priorite]?.label}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-relaxed">
                                            {action.description_nc || action.action_corrective || 'Sans description'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {action.responsable && (
                                                <span className="text-[10px] text-gray-400">{action.responsable}</span>
                                            )}
                                            {action.delai && (
                                                <span className="text-[10px] text-gray-400">
                                                    · Échéance {new Date(action.delai).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Link to="/plans-actions" className="block text-center text-xs mt-1 transition" style={{ color: 'var(--brand-red)' }}>
                                Voir tous les plans d'actions →
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bottom row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Accès rapides */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm font-semibold text-gray-800 mb-4">Accès rapides</p>
                    <div className="flex flex-col gap-2">
                        {[
                            { label: 'Lancer un nouvel audit', to: '/audits/nouveau', primary: true },
                            { label: 'Voir tous les audits',   to: '/audits' },
                            { label: "Plans d'actions",        to: '/plans-actions' },
                            { label: 'Graphiques & Rosace',    to: '/resultats' },
                        ].map((link, i) => (
                            <Link key={i} to={link.to}
                                className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                                style={link.primary
                                    ? { backgroundColor: 'var(--brand-red)', color: 'white' }
                                    : { backgroundColor: '#F9FAFB', color: '#374151' }
                                }
                                onMouseEnter={e => { if (!link.primary) e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                                onMouseLeave={e => { if (!link.primary) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                            >
                                <span>{link.label}</span>
                                <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Audits récents */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-gray-800">Audits récents</p>
                        <Link to="/audits" className="text-xs text-gray-400 hover:text-gray-600 transition">Voir tout →</Link>
                    </div>

                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : recents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--brand-red-light)' }}>
                                <svg className="w-5 h-5" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-500">Aucun audit pour le moment</p>
                            <p className="text-xs text-gray-400 mt-1">Créez votre premier audit pour commencer</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {recents.map(audit => {
                                const cfg = STATUT_BADGE[audit.statut] ?? STATUT_BADGE.brouillon;
                                const lbl = STATUT_AUDIT[audit.statut]?.label ?? 'Brouillon';
                                return (
                                    <Link key={audit.id} to={`/audits/${audit.id}`}
                                        className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition group">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800 truncate">{audit.nom}</p>
                                            <p className="text-xs text-gray-400 truncate">{audit.client}{audit.referentiel?.nom ? ` — ${audit.referentiel.nom}` : ''}</p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${cfg}`}>{lbl}</span>
                                            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DashboardPage;
