import { Link } from 'react-router-dom';

const STATUT_AUDIT = {
    brouillon: { label: 'Brouillon', color: '#9ca3af', bg: 'bg-gray-100',   text: 'text-gray-600' },
    en_cours:  { label: 'En cours',  color: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-700' },
    termine:   { label: 'Terminé',   color: '#16a34a', bg: 'bg-green-50',   text: 'text-green-700' },
    archive:   { label: 'Archivé',   color: '#d97706', bg: 'bg-yellow-50',  text: 'text-yellow-700' },
};

const PRIORITE = {
    haute:   { label: 'Haute',   badge: 'bg-red-50 text-red-700' },
    moyenne: { label: 'Moyenne', badge: 'bg-amber-50 text-amber-700' },
    basse:   { label: 'Basse',   badge: 'bg-gray-100 text-gray-600' },
};

const Sk = ({ className }) => <div className={`bg-gray-100 animate-pulse rounded-lg ${className}`} />;

const Spin = () => (
    <div className="flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--brand-red)' }} />
    </div>
);

const SectionLabel = ({ children }) => (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">{children}</p>
);

const ClientDashboard = ({ user, today, audits, plans, loading, refusedDocs, enCours, termines }) => {
    const clientActionsOuvertes = plans.filter(p => p.statut === 'a_faire' || p.statut === 'en_cours');

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
                <SectionLabel>Vos audits</SectionLabel>
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
                                <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400">
                                    {s.icon}
                                </div>
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

            {/* Liste audits */}
            <div>
                <SectionLabel>Vos audits récents</SectionLabel>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? <Spin /> : audits.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-10">Aucun audit associé à votre entité.</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {audits.slice(0, 8).map(a => {
                                const cfg = STATUT_AUDIT[a.statut] || STATUT_AUDIT.brouillon;
                                return (
                                    <Link key={a.id} to={`/audits/${a.id}`}
                                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{a.nom}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{a.referentiel?.nom}</p>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                                            {cfg.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions ouvertes */}
            {clientActionsOuvertes.length > 0 && (
                <div>
                    <SectionLabel>Plans d'actions en cours</SectionLabel>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-50">
                            {clientActionsOuvertes.slice(0, 5).map(p => {
                                const pc = PRIORITE[p.priorite];
                                return (
                                    <div key={p.id} className="flex items-start gap-4 px-5 py-3.5">
                                        {pc && <span className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${pc.badge}`}>{pc.label}</span>}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 truncate">{p.action_corrective || `Action #${p.id}`}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{p.audit?.nom} · Resp. {p.responsable}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
