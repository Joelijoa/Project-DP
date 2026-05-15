const PRIORITE = {
    haute:   { label: 'Haute',   cls: 'bg-orange-100 text-orange-700' },
    moyenne: { label: 'Moyenne', cls: 'bg-yellow-100 text-yellow-700' },
    basse:   { label: 'Basse',   cls: 'bg-gray-100 text-gray-500'    },
};

const PlanCard = ({ plan, onNavigate, onValider, onRejeter, saving }) => {
    const pCfg = PRIORITE[plan.priorite] || PRIORITE.basse;
    const isOverdue = plan.delai && new Date(plan.delai) < new Date();

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 border border-gray-100">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={onNavigate}>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${pCfg.cls}`}>
                                {pCfg.label}
                            </span>
                            {plan.delai && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                                    </svg>
                                    {new Date(plan.delai).toLocaleDateString('fr-FR')}
                                    {isOverdue && ' — En retard'}
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {plan.action_corrective || `Plan d'action #${plan.id}`}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {plan.audit && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                    {plan.audit.nom}
                                </span>
                            )}
                            {plan.responsable && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    {plan.responsable}
                                </span>
                            )}
                            {plan.mesure && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                    {plan.mesure.code}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={onRejeter} disabled={saving}
                        className="px-3.5 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
                        Rejeter
                    </button>
                    <button onClick={onValider} disabled={saving}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Valider
                    </button>
                </div>
            </div>
            <div className="flex items-center mt-4 pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">Soumis pour validation</span>
                <button onClick={onNavigate} className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition">
                    Voir l'audit
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default PlanCard;
