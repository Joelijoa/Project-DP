import { useEffect, useState, useCallback } from 'react';
import { getLogs } from '../../services/endpoints/logService';

// ── Config actions ─────────────────────────────────────────────────────────────

const ACTION_CONFIG = {
    LOGIN:              { label: 'Connexion',           bg: 'bg-green-50',   text: 'text-green-700'  },
    LOGIN_FAILED:       { label: 'Échec connexion',     bg: 'bg-red-50',     text: 'text-red-700'    },
    CREATE_AUDIT:       { label: 'Créer audit',         bg: 'bg-blue-50',    text: 'text-blue-700'   },
    UPDATE_AUDIT:       { label: 'Modifier audit',      bg: 'bg-indigo-50',  text: 'text-indigo-700' },
    DELETE_AUDIT:       { label: 'Supprimer audit',     bg: 'bg-red-50',     text: 'text-red-700'    },
    CREATE_USER:        { label: 'Créer utilisateur',   bg: 'bg-purple-50',  text: 'text-purple-700' },
    UPDATE_USER:        { label: 'Modifier utilisateur',bg: 'bg-violet-50',  text: 'text-violet-700' },
    DELETE_USER:        { label: 'Supprimer utilisateur',bg:'bg-red-50',     text: 'text-red-700'    },
    RESET_PASSWORD:     { label: 'Réinit. mot de passe',bg: 'bg-amber-50',   text: 'text-amber-700'  },
    CHANGE_PASSWORD:    { label: 'Changer mot de passe',bg: 'bg-amber-50',   text: 'text-amber-700'  },
    CREATE_ENTITE:      { label: 'Créer entité',        bg: 'bg-teal-50',    text: 'text-teal-700'   },
    UPDATE_ENTITE:      { label: 'Modifier entité',     bg: 'bg-cyan-50',    text: 'text-cyan-700'   },
    DELETE_ENTITE:      { label: 'Supprimer entité',    bg: 'bg-red-50',     text: 'text-red-700'    },
    CREATE_PLAN_ACTION: { label: 'Créer plan action',   bg: 'bg-orange-50',  text: 'text-orange-700' },
    UPDATE_PLAN_ACTION: { label: 'Modifier plan action',bg: 'bg-orange-50',  text: 'text-orange-700' },
    DELETE_PLAN_ACTION: { label: 'Supprimer plan action',bg:'bg-red-50',     text: 'text-red-700'    },
};

const RESOURCE_LABELS = {
    audit:       'Audit',
    user:        'Utilisateur',
    entite:      'Entité',
    plan_action: "Plan d'action",
};

const ALL_ACTIONS = Object.keys(ACTION_CONFIG);

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const ActionBadge = ({ action }) => {
    const cfg = ACTION_CONFIG[action] ?? { label: action, bg: 'bg-gray-100', text: 'text-gray-600' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
};

const Sk = ({ className }) => <div className={`bg-gray-100 animate-pulse rounded ${className}`} />;

// ── Page ───────────────────────────────────────────────────────────────────────

const JournauxPage = () => {
    const [logs, setLogs]         = useState([]);
    const [total, setTotal]       = useState(0);
    const [pages, setPages]       = useState(1);
    const [loading, setLoading]   = useState(true);

    const [page, setPage]         = useState(1);
    const [action, setAction]     = useState('');
    const [resource, setResource] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo]     = useState('');

    const LIMIT = 50;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getLogs({
                page,
                limit:     LIMIT,
                action:    action   || undefined,
                resource:  resource || undefined,
                date_from: dateFrom || undefined,
                date_to:   dateTo   || undefined,
            });
            setLogs(res.data.logs);
            setTotal(res.data.total);
            setPages(res.data.pages);
        } catch {
            // silencieux
        } finally {
            setLoading(false);
        }
    }, [page, action, resource, dateFrom, dateTo]);

    useEffect(() => { load(); }, [load]);

    const resetFilters = () => {
        setAction('');
        setResource('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const hasFilters = action || resource || dateFrom || dateTo;

    return (
        <div>
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Journaux d'activité</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Historique de toutes les actions effectuées sur la plateforme
                    </p>
                </div>
                {!loading && (
                    <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                        {total.toLocaleString('fr-FR')} entrée{total > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
                <select
                    value={action}
                    onChange={e => { setAction(e.target.value); setPage(1); }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white"
                >
                    <option value="">Toutes les actions</option>
                    {ALL_ACTIONS.map(a => (
                        <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>
                    ))}
                </select>

                <select
                    value={resource}
                    onChange={e => { setResource(e.target.value); setPage(1); }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white"
                >
                    <option value="">Toutes les ressources</option>
                    {Object.entries(RESOURCE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>

                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Du</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
                    />
                    <label className="text-xs text-gray-500">au</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => { setDateTo(e.target.value); setPage(1); }}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
                    />
                </div>

                {hasFilters && (
                    <button
                        onClick={resetFilters}
                        className="text-sm text-gray-500 hover:text-gray-700 px-2 underline underline-offset-2"
                    >
                        Réinitialiser
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-4 space-y-2.5">
                        {[...Array(8)].map((_, i) => <Sk key={i} className="h-10" />)}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Aucun journal trouvé</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {hasFilters ? 'Modifiez les filtres pour voir d\'autres résultats' : 'Les actions apparaîtront ici au fur et à mesure'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date / Heure</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ressource</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Détails</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {logs.map(entry => (
                                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                            {fmtDate(entry.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {entry.user ? (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-800">
                                                        {entry.user.prenom} {entry.user.nom}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 capitalize">
                                                        {entry.user.role?.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Système</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <ActionBadge action={entry.action} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {entry.resource
                                                ? <span>{RESOURCE_LABELS[entry.resource] ?? entry.resource}
                                                    {entry.resource_id && <span className="text-gray-400 ml-1">#{entry.resource_id}</span>}
                                                  </span>
                                                : <span className="text-gray-300">—</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                                            {entry.details || <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                                            {entry.ip || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-gray-400">
                        Page {page} sur {pages} — {total.toLocaleString('fr-FR')} résultats
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            ← Précédent
                        </button>
                        {[...Array(Math.min(5, pages))].map((_, i) => {
                            const p = Math.max(1, Math.min(page - 2, pages - 4)) + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-8 h-8 text-xs font-medium rounded-lg transition ${
                                        p === page
                                            ? 'text-white'
                                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                                    }`}
                                    style={p === page ? { backgroundColor: 'var(--brand-red)' } : {}}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                            disabled={page === pages}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            Suivant →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournauxPage;
