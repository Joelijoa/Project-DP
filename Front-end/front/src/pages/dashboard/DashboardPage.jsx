import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/auth/AuthContext';
import { getAllAudits } from '../../services/endpoints/auditService';
import { getAllPlanActions } from '../../services/endpoints/planActionService';
import { getAllReferentiels } from '../../services/endpoints/referentielService';

// ── Config ────────────────────────────────────────────────────────────────────

const STATUT_AUDIT = {
    brouillon: { label: 'Brouillon', color: '#9ca3af', bg: 'bg-gray-100',   text: 'text-gray-600' },
    en_cours:  { label: 'En cours',  color: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-700' },
    termine:   { label: 'Terminé',   color: '#16a34a', bg: 'bg-green-50',   text: 'text-green-700' },
    archive:   { label: 'Archivé',   color: '#d97706', bg: 'bg-yellow-50',  text: 'text-yellow-700' },
};

const PRIORITE = {
    critique: { label: 'Critique', color: '#CC0000', badge: 'bg-red-50 text-red-700',     dot: 'bg-red-500' },
    haute:    { label: 'Haute',    color: '#ea580c', badge: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
    moyenne:  { label: 'Moyenne',  color: '#d97706', badge: 'bg-amber-50 text-amber-700',  dot: 'bg-amber-500' },
    faible:   { label: 'Faible',   color: '#6b7280', badge: 'bg-gray-100 text-gray-600',  dot: 'bg-gray-400' },
};

// ── SVG Donut ─────────────────────────────────────────────────────────────────

const DonutChart = ({ segments, total }) => {
    const cx = 56, cy = 56, r = 40, sw = 14;
    const circ = 2 * Math.PI * r;
    let cum = 0;
    const computed = segments.map(s => {
        const dash = total > 0 ? (s.value / total) * circ : 0;
        const item = { ...s, dash, offset: -cum };
        cum += dash;
        return item;
    });
    return (
        <svg width="112" height="112" viewBox="0 0 112 112">
            <g transform={`rotate(-90,${cx},${cy})`}>
                {total === 0
                    ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={sw} />
                    : computed.filter(s => s.value > 0).map((s, i) => (
                        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                            stroke={s.color} strokeWidth={sw}
                            strokeDasharray={`${s.dash} ${circ - s.dash}`}
                            strokeDashoffset={s.offset}
                        />
                    ))
                }
            </g>
            <text x={cx} y={cy - 6} textAnchor="middle"
                style={{ fontSize: '22px', fontWeight: '800', fill: '#111827', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {total}
            </text>
            <text x={cx} y={cx + 12} textAnchor="middle"
                style={{ fontSize: '8px', fill: '#9ca3af', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                audits
            </text>
        </svg>
    );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const Sk = ({ className }) => <div className={`bg-gray-100 animate-pulse rounded-lg ${className}`} />;

// ── Spinner ───────────────────────────────────────────────────────────────────

const Spin = () => (
    <div className="flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
    </div>
);

// ── Section header ────────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">{children}</p>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const DashboardPage = () => {
    const { user } = useAuth();
    const [audits, setAudits]         = useState([]);
    const [plans, setPlans]           = useState([]);
    const [referentiels, setReferentiels] = useState([]);
    const [loading, setLoading]       = useState(true);

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

    const enCours       = audits.filter(a => a.statut === 'en_cours').length;
    const termines      = audits.filter(a => a.statut === 'termine').length;
    const brouillons    = audits.filter(a => a.statut === 'brouillon').length;

    const donutSegments = ['brouillon', 'en_cours', 'termine', 'archive'].map(s => ({
        label: STATUT_AUDIT[s].label,
        color: STATUT_AUDIT[s].color,
        bg:    STATUT_AUDIT[s].bg,
        text:  STATUT_AUDIT[s].text,
        value: audits.filter(a => a.statut === s).length,
    }));

    const actionsOuvertes   = plans.filter(p => p.statut === 'a_faire' || p.statut === 'en_cours').length;
    const actionsCloturees  = plans.filter(p => p.statut === 'cloture').length;
    const cloturePct        = plans.length > 0 ? Math.round((actionsCloturees / plans.length) * 100) : 0;

    const plansByPrio = ['critique', 'haute', 'moyenne', 'faible'].map(key => ({
        key,
        ...PRIORITE[key],
        total:    plans.filter(p => p.priorite === key).length,
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

    const daysLeft  = (d) => Math.ceil((new Date(d) - today) / 86400000);
    const daysColor = (n) =>
        n <= 3 ? { bg: 'bg-red-500',   text: 'text-red-600',   badge: 'bg-red-50 text-red-600 border-red-100' }
      : n <= 7 ? { bg: 'bg-amber-400', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-600 border-amber-100' }
      :          { bg: 'bg-green-500', text: 'text-green-600', badge: 'bg-green-50 text-green-600 border-green-100' };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-7">

            {/* ── Greeting banner ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">
                        Bonjour, {user?.prenom} {user?.nom} 👋
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5 capitalize">
                        {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <Link to="/audits/nouveau"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--brand-red)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Nouvel audit
                </Link>
            </div>

            {/* ── KPI cards ── */}
            <div>
                <SectionLabel>Vue d'ensemble</SectionLabel>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Audits en cours',
                            value: enCours,
                            sub: `${brouillons} en brouillon`,
                            accent: true,
                            icon: (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                                </svg>
                            ),
                        },
                        {
                            label: 'Actions ouvertes',
                            value: actionsOuvertes,
                            sub: `${plans.length} actions au total`,
                            accent: false,
                            icon: (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                                </svg>
                            ),
                        },
                        {
                            label: 'Audits terminés',
                            value: termines,
                            sub: `sur ${audits.length} au total`,
                            accent: false,
                            icon: (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ),
                        },
                        {
                            label: 'Taux de clôture',
                            value: `${cloturePct}%`,
                            sub: `${actionsCloturees} actions clôturées`,
                            accent: false,
                            icon: (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                </svg>
                            ),
                        },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
                            style={s.accent ? { borderLeft: '3px solid var(--brand-red)' } : {}}>
                            <div className="flex items-start justify-between mb-5">
                                <div className="p-2 rounded-xl"
                                    style={s.accent
                                        ? { backgroundColor: 'var(--brand-red-light)', color: 'var(--brand-red)' }
                                        : { backgroundColor: '#F9FAFB', color: '#6B7280' }}>
                                    {s.icon}
                                </div>
                            </div>
                            {loading
                                ? <Sk className="h-8 w-16 mb-1.5" />
                                : <p className="text-3xl font-extrabold tracking-tight"
                                    style={{ color: s.accent ? 'var(--brand-red)' : '#111827' }}>{s.value}</p>
                            }
                            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Charts + Priorités ── */}
            <div>
                <SectionLabel>Répartition & Activité</SectionLabel>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                    {/* Donut statuts audits — col-span-2 */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-gray-800">Statuts des audits</p>
                            {audits.length > 0 && (
                                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">
                                    {audits.length} total
                                </span>
                            )}
                        </div>
                        {loading ? <Spin /> : (
                            <div className="flex items-center gap-6">
                                <div className="flex-shrink-0">
                                    <DonutChart segments={donutSegments} total={audits.length} />
                                </div>
                                <div className="flex-1 space-y-3 min-w-0">
                                    {donutSegments.map((seg, i) => (
                                        <div key={i} className="flex items-center gap-2.5">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                                            <span className="text-xs text-gray-600 flex-1 truncate">{seg.label}</span>
                                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${seg.bg} ${seg.text}`}>{seg.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Barres priorités — col-span-3 */}
                    <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-gray-800">Plans d'actions par priorité</p>
                            {actionsOuvertes > 0 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                                    style={{ backgroundColor: 'var(--brand-red-light)', color: 'var(--brand-red)' }}>
                                    {actionsOuvertes} ouvertes
                                </span>
                            )}
                        </div>
                        {loading ? (
                            <div className="space-y-4 pt-1">
                                {[...Array(4)].map((_, i) => <Sk key={i} className="h-9" />)}
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <svg className="w-8 h-8 text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5" />
                                </svg>
                                <p className="text-xs text-gray-400">Aucun plan d'action</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {plansByPrio.map(p => (
                                    <div key={p.key}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                                                <span className="text-xs font-medium text-gray-700">{p.label}</span>
                                                {p.ouvertes > 0 && (
                                                    <span className={`text-[10px] font-semibold px-1.5 py-px rounded ${p.badge}`}>
                                                        {p.ouvertes} ouvertes
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-gray-700">{p.total}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${(p.total / maxPrio) * 100}%`, backgroundColor: p.color }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Échéances + Actions critiques ── */}
            <div>
                <SectionLabel>Surveillance</SectionLabel>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Échéances proches */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-gray-800">Échéances proches</p>
                            <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-2 py-0.5">
                                30 prochains jours
                            </span>
                        </div>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => <Sk key={i} className="h-16" />)}
                            </div>
                        ) : echeances.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 bg-gray-50">
                                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Aucune échéance</p>
                                <p className="text-xs text-gray-400 mt-0.5">Pas d'audit à échéance dans les 30 prochains jours</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {echeances.map(audit => {
                                    const left = daysLeft(audit.date_fin);
                                    const { bg, badge } = daysColor(left);
                                    const totalDays = audit.date_debut
                                        ? Math.max(1, Math.ceil((new Date(audit.date_fin) - new Date(audit.date_debut)) / 86400000))
                                        : 30;
                                    const progress = Math.max(5, Math.min(100, ((totalDays - left) / totalDays) * 100));
                                    return (
                                        <Link key={audit.id} to={`/audits/${audit.id}`}
                                            className="block p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition group">
                                            <div className="flex items-start justify-between mb-2.5">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{audit.nom}</p>
                                                    <p className="text-xs text-gray-400 truncate mt-0.5">{audit.client}</p>
                                                </div>
                                                <span className={`text-[11px] font-bold ml-3 flex-shrink-0 px-2 py-0.5 rounded-lg border ${badge}`}>
                                                    {left === 0 ? "Auj." : `J-${left}`}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${bg}`} style={{ width: `${progress}%` }} />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Actions critiques */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-gray-800">Actions prioritaires ouvertes</p>
                            {actionsCritiques.length > 0 && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                                    style={{ backgroundColor: 'var(--brand-red-light)', color: 'var(--brand-red)' }}>
                                    {actionsCritiques.length}
                                </span>
                            )}
                        </div>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => <Sk key={i} className="h-16" />)}
                            </div>
                        ) : actionsCritiques.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 bg-green-50">
                                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Tout est sous contrôle</p>
                                <p className="text-xs text-gray-400 mt-0.5">Aucune action critique ou haute ouverte</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {actionsCritiques.map((action, i) => {
                                    const prio = PRIORITE[action.priorite];
                                    return (
                                        <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 bg-gray-50">
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${prio?.dot}`} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-semibold px-1.5 py-px rounded ${prio?.badge}`}>
                                                        {prio?.label}
                                                    </span>
                                                    {action.delai && (
                                                        <span className="text-[10px] text-gray-400">
                                                            · {new Date(action.delai).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                                                    {action.description_nc || action.action_corrective || 'Sans description'}
                                                </p>
                                                {action.responsable && (
                                                    <p className="text-[10px] text-gray-400 mt-1">{action.responsable}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <Link to="/plans-actions"
                                    className="block text-center text-xs font-medium mt-2 py-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition text-gray-500 hover:text-gray-700">
                                    Voir tous les plans d'actions →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Accès rapides + Audits récents ── */}
            <div>
                <SectionLabel>Activité récente</SectionLabel>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

                    {/* Accès rapides — col-span-1 */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm font-semibold text-gray-800 mb-4">Accès rapides</p>
                        <div className="flex flex-col gap-2">
                            {[
                                { label: 'Nouvel audit',         to: '/audits/nouveau',   primary: true,
                                  icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /> },
                                { label: 'Tous les audits',      to: '/audits',           primary: false,
                                  icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /> },
                                { label: "Plans d'actions",      to: '/plans-actions',    primary: false,
                                  icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /> },
                                { label: 'Graphiques & Rosace',  to: '/resultats',        primary: false,
                                  icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /> },
                            ].map((link, i) => (
                                <Link key={i} to={link.to}
                                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition"
                                    style={link.primary
                                        ? { backgroundColor: 'var(--brand-red)', color: 'white' }
                                        : { backgroundColor: '#F9FAFB', color: '#374151', border: '1px solid #F3F4F6' }
                                    }
                                    onMouseEnter={e => { if (!link.primary) e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                                    onMouseLeave={e => { if (!link.primary) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        {link.icon}
                                    </svg>
                                    <span className="flex-1 truncate">{link.label}</span>
                                    <svg className="w-3.5 h-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Audits récents — col-span-3 */}
                    <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-gray-800">Audits récents</p>
                            <Link to="/audits" className="text-xs text-gray-400 hover:text-gray-600 transition font-medium">
                                Voir tout →
                            </Link>
                        </div>
                        {loading ? (
                            <div className="space-y-2.5">
                                {[...Array(4)].map((_, i) => <Sk key={i} className="h-14" />)}
                            </div>
                        ) : recents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                                    style={{ backgroundColor: 'var(--brand-red-light)' }}>
                                    <svg className="w-6 h-6" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Aucun audit pour le moment</p>
                                <p className="text-xs text-gray-400 mt-1">Créez votre premier audit pour commencer</p>
                                <Link to="/audits/nouveau" className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
                                    style={{ backgroundColor: 'var(--brand-red)' }}>
                                    Créer un audit
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {recents.map(audit => {
                                    const cfg = STATUT_AUDIT[audit.statut] ?? STATUT_AUDIT.brouillon;
                                    return (
                                        <Link key={audit.id} to={`/audits/${audit.id}`}
                                            className="flex items-center justify-between py-3 px-1 hover:bg-gray-50 rounded-xl transition group -mx-1 px-2">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: 'var(--brand-red-light)' }}>
                                                    <svg className="w-4 h-4" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{audit.nom}</p>
                                                    <p className="text-xs text-gray-400 truncate">
                                                        {audit.client}{audit.referentiel?.nom ? ` · ${audit.referentiel.nom}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.text}`}>
                                                    {cfg.label}
                                                </span>
                                                <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

        </div>
    );
};

export default DashboardPage;
