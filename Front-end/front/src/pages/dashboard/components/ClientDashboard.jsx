import { Link } from 'react-router-dom';

const PHASES = ['cadrage', 'prerequis', 'revue_documentaire', 'realisation', 'termine'];
const PHASE_LABELS = {
    cadrage:             'Cadrage',
    prerequis:           'Prérequis',
    revue_documentaire:  'Revue',
    realisation:         'Réalisation',
    termine:             'Terminé',
};

const PRIORITE = {
    haute:   { label: 'Haute',   badge: 'bg-red-50 text-red-700',    dot: 'bg-red-500' },
    moyenne: { label: 'Moyenne', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
    basse:   { label: 'Basse',   badge: 'bg-gray-100 text-gray-600',  dot: 'bg-gray-400' },
};

const PLAN_STATUT = {
    a_faire:  { label: 'À faire',   bg: 'bg-gray-100',   text: 'text-gray-600' },
    en_cours: { label: 'En cours',  bg: 'bg-blue-50',    text: 'text-blue-700' },
    cloture:  { label: 'Clôturé',   bg: 'bg-green-50',   text: 'text-green-700' },
};

const Sk = ({ className }) => <div className={`bg-gray-100 animate-pulse rounded-lg ${className}`} />;

const Spin = () => (
    <div className="flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#3b82f6' }} />
    </div>
);

const SectionLabel = ({ children }) => (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">{children}</p>
);

// Badge de validation planning / rapport
function ValidationBadge({ val, label }) {
    if (!val) return (
        <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            {label} non soumis
        </span>
    );
    if (val.statut === 'valide') return (
        <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-medium">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {label} validé
        </span>
    );
    if (val.statut === 'en_attente') return (
        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {label} en attente
        </span>
    );
    if (val.statut === 'modification_demandee') return (
        <span className="inline-flex items-center gap-1 text-[10px] text-orange-600 font-medium">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Modification demandée
        </span>
    );
    return null;
}

// Stepper phases pour un audit
function PhasesStepper({ phase }) {
    const current = PHASES.indexOf(phase);
    return (
        <div className="flex items-center gap-0 mt-3">
            {PHASES.map((p, i) => {
                const done    = i < current;
                const active  = i === current;
                const isLast  = i === PHASES.length - 1;
                return (
                    <div key={p} className="flex items-center flex-1 min-w-0">
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                                done   ? 'bg-blue-500' :
                                active ? 'bg-blue-600 ring-2 ring-blue-100' :
                                         'bg-gray-200'
                            }`} />
                            <span className={`text-[9px] font-medium leading-none whitespace-nowrap ${
                                active ? 'text-blue-600' : done ? 'text-blue-400' : 'text-gray-300'
                            }`}>
                                {PHASE_LABELS[p]}
                            </span>
                        </div>
                        {!isLast && (
                            <div className={`flex-1 h-px mx-1 mb-3.5 ${i < current ? 'bg-blue-300' : 'bg-gray-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const ClientDashboard = ({ user, today, audits, plans, loading, refusedDocs, enCours, termines }) => {
    const clientActionsOuvertes = plans.filter(p => p.statut === 'a_faire' || p.statut === 'en_cours');
    const actionsCloturees = plans.filter(p => p.statut === 'cloture').length;
    const cloturePct = plans.length > 0 ? Math.round((actionsCloturees / plans.length) * 100) : 0;

    // Statuts plans
    const plansParStatut = ['a_faire', 'en_cours', 'cloture'].map(key => ({
        key,
        ...PLAN_STATUT[key],
        count: plans.filter(p => p.statut === key).length,
    }));

    // Cercle taux de clôture
    const R = 30, C = 2 * Math.PI * R;
    const dash = (cloturePct / 100) * C;

    return (
        <div className="space-y-7">

            {/* Greeting */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">
                    Bonjour, {user?.prenom} {user?.nom}
                </h1>
                <p className="text-sm text-gray-400 mt-0.5 capitalize">
                    {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Alerte documents refusés */}
            {refusedDocs.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-red-800">
                                {refusedDocs.length} document{refusedDocs.length > 1 ? 's' : ''} refusé{refusedDocs.length > 1 ? 's' : ''} — action requise
                            </p>
                            <p className="text-xs text-red-600 mt-0.5">
                                Ces documents ont été refusés par l'auditeur et doivent être corrigés.
                            </p>
                            <div className="mt-3 space-y-2">
                                {refusedDocs.map(({ doc, audit }) => (
                                    <Link key={doc.id} to={`/audits/${audit.id}`}
                                        className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-red-100 hover:border-red-300 transition group">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-800 truncate">{doc.nom_original}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{audit.nom}</p>
                                            {doc.constat && (
                                                <p className="text-xs text-red-600 mt-1 italic line-clamp-2">"{doc.constat}"</p>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-red-600 flex-shrink-0 mt-0.5 group-hover:underline">
                                            Corriger →
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* KPIs */}
            <div>
                <SectionLabel>Vue d'ensemble</SectionLabel>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        {
                            label: 'Audits en cours',
                            value: enCours,
                            sub: `${audits.length} audit${audits.length !== 1 ? 's' : ''} au total`,
                            icon: (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                                </svg>
                            ),
                        },
                        {
                            label: 'Audits terminés',
                            value: termines,
                            sub: `sur ${audits.length} au total`,
                            icon: (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ),
                        },
                        {
                            label: 'Actions ouvertes',
                            value: clientActionsOuvertes.length,
                            sub: `${plans.length} action${plans.length !== 1 ? 's' : ''} au total`,
                            icon: (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                                </svg>
                            ),
                        },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <p className="text-xs font-medium text-gray-400">{s.label}</p>
                                <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400">{s.icon}</div>
                            </div>
                            {loading
                                ? <Sk className="h-8 w-16 mb-1.5" />
                                : <p className="text-3xl font-bold text-gray-900 tracking-tight">{s.value}</p>
                            }
                            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Suivi par audit — progression + validations */}
            <div>
                <SectionLabel>Suivi de vos audits</SectionLabel>
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => <Sk key={i} className="h-32" />)}
                    </div>
                ) : audits.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-10 text-center">
                        <p className="text-sm text-gray-400">Aucun audit associé à votre organisation.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {audits.map(a => (
                            <Link key={a.id} to={`/audits/${a.id}`}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all group block">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                            {a.nom}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                                            {a.referentiel?.nom || '—'}
                                        </p>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition flex-shrink-0 ml-3 mt-0.5"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </div>

                                {/* Stepper phases */}
                                <PhasesStepper phase={a.phase || 'cadrage'} />

                                {/* Validations */}
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                                    <ValidationBadge val={a.validation_planning} label="Planning" />
                                    <ValidationBadge val={a.validation_rapport}  label="Rapport" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Plans d'actions */}
            <div>
                <SectionLabel>Plans d'actions</SectionLabel>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Taux de clôture */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm font-semibold text-gray-800 mb-4">Taux de clôture</p>
                        {loading ? <Spin /> : plans.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-6">Aucun plan d'action</p>
                        ) : (
                            <div className="flex items-center gap-6">
                                {/* Cercle */}
                                <div className="flex-shrink-0">
                                    <svg width="90" height="90" viewBox="0 0 90 90">
                                        <g transform="rotate(-90,45,45)">
                                            <circle cx="45" cy="45" r={R} fill="none" stroke="#f3f4f6" strokeWidth="12" />
                                            <circle cx="45" cy="45" r={R} fill="none" stroke="#16a34a" strokeWidth="12"
                                                strokeDasharray={`${dash} ${C - dash}`}
                                                strokeLinecap="round" />
                                        </g>
                                        <text x="45" y="41" textAnchor="middle"
                                            style={{ fontSize: '18px', fontWeight: '800', fill: '#111827', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            {cloturePct}%
                                        </text>
                                        <text x="45" y="56" textAnchor="middle"
                                            style={{ fontSize: '7.5px', fill: '#9ca3af', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                            clôturés
                                        </text>
                                    </svg>
                                </div>
                                {/* Légende statuts */}
                                <div className="flex-1 space-y-2.5">
                                    {plansParStatut.map(s => (
                                        <div key={s.key} className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                s.key === 'cloture'  ? 'bg-green-500' :
                                                s.key === 'en_cours' ? 'bg-blue-500' : 'bg-gray-300'
                                            }`} />
                                            <span className="text-xs text-gray-600 flex-1">{s.label}</span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${s.bg} ${s.text}`}>
                                                {s.count}
                                            </span>
                                        </div>
                                    ))}
                                    <p className="text-[10px] text-gray-400 pt-1">
                                        {actionsCloturees} clôturé{actionsCloturees > 1 ? 's' : ''} sur {plans.length}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions à traiter */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-gray-800">À traiter en priorité</p>
                            {clientActionsOuvertes.filter(p => p.priorite === 'haute').length > 0 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-red-50 text-red-700">
                                    {clientActionsOuvertes.filter(p => p.priorite === 'haute').length} haute priorité
                                </span>
                            )}
                        </div>
                        {loading ? (
                            <div className="space-y-2">{[...Array(3)].map((_, i) => <Sk key={i} className="h-12" />)}</div>
                        ) : clientActionsOuvertes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Tout est à jour</p>
                                <p className="text-xs text-gray-400 mt-0.5">Aucune action ouverte</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {clientActionsOuvertes
                                    .sort((a, b) => {
                                        const order = { haute: 0, moyenne: 1, basse: 2 };
                                        return (order[a.priorite] ?? 3) - (order[b.priorite] ?? 3);
                                    })
                                    .slice(0, 4)
                                    .map(p => {
                                        const pc = PRIORITE[p.priorite];
                                        return (
                                            <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${pc?.dot}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-800 truncate">
                                                        {p.action_corrective || `Action #${p.id}`}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] font-semibold px-1.5 py-px rounded ${pc?.badge}`}>
                                                            {pc?.label}
                                                        </span>
                                                        {p.responsable && (
                                                            <span className="text-[10px] text-gray-400">
                                                                Resp. {p.responsable}
                                                            </span>
                                                        )}
                                                        {p.delai && (
                                                            <span className="text-[10px] text-gray-400">
                                                                · {new Date(p.delai).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {clientActionsOuvertes.length > 4 && (
                                    <Link to="/plans-actions"
                                        className="block text-center text-xs font-medium py-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition text-gray-500 hover:text-gray-700">
                                        Voir {clientActionsOuvertes.length - 4} autres actions →
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ClientDashboard;
