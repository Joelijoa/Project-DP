import { useEffect, useState, useCallback, useMemo } from 'react';
import { getLogs } from '../../services/endpoints/logService';
import AppSelect from '../../components/common/AppSelect';

// ── Config actions complète ────────────────────────────────────────────────────

const N  = { bg: 'bg-gray-100',   text: 'text-gray-600'  };
const D  = { bg: 'bg-red-50',     text: 'text-red-700'   };
const G  = { bg: 'bg-green-50',   text: 'text-green-700' };
const B  = { bg: 'bg-blue-50',    text: 'text-blue-700'  };
const AB = { bg: 'bg-amber-50',   text: 'text-amber-700' };
const V  = { bg: 'bg-violet-50',  text: 'text-violet-700'};

const ACTION_CONFIG = {
    // Auth
    LOGIN:                                { label: 'Connexion',                    ...G },
    LOGIN_FAILED:                         { label: 'Échec connexion',              ...D },
    CHANGE_PASSWORD:                      { label: 'Changer mot de passe',         ...N },
    RESET_PASSWORD:                       { label: 'Réinit. mot de passe',         ...AB },
    // Audits
    CREATE_AUDIT:                         { label: 'Créer audit',                  ...B },
    UPDATE_AUDIT:                         { label: 'Modifier audit',               ...N },
    DELETE_AUDIT:                         { label: 'Supprimer audit',              ...D },
    SOUMETTRE_AUDIT:                      { label: 'Soumettre audit',              ...AB },
    VALIDER_AUDIT:                        { label: 'Valider audit',                ...G },
    REJETER_AUDIT:                        { label: 'Rejeter audit',                ...D },
    phase_changed:                        { label: 'Changer phase',                ...V },
    // Documents
    doc_upload:                           { label: 'Déposer document',             ...B },
    doc_delete:                           { label: 'Supprimer document',           ...D },
    doc_valide:                           { label: 'Valider document',             ...G },
    doc_refuse:                           { label: 'Refuser document',             ...D },
    doc_commentaire:                      { label: 'Commentaire entretien',        ...N },
    // Plans d'actions
    CREATE_PLAN_ACTION:                   { label: 'Créer plan d\'action',         ...B },
    UPDATE_PLAN_ACTION:                   { label: 'Modifier plan d\'action',      ...N },
    DELETE_PLAN_ACTION:                   { label: 'Supprimer plan d\'action',     ...D },
    SOUMETTRE_PLAN:                       { label: 'Soumettre plan',               ...AB },
    VALIDER_PLAN:                         { label: 'Valider plan',                 ...G },
    REJETER_PLAN:                         { label: 'Rejeter plan',                 ...D },
    // Validation planning/rapport
    validation_planning_soumettre:        { label: 'Soumettre planning',           ...AB },
    validation_planning_valider:          { label: 'Valider planning',             ...G },
    validation_planning_demander_modification: { label: 'Modif. planning',         ...AB },
    validation_planning_annuler:          { label: 'Annuler planning',             ...N },
    validation_rapport_soumettre:         { label: 'Soumettre rapport',            ...AB },
    validation_rapport_valider:           { label: 'Valider rapport',              ...G },
    validation_rapport_demander_modification: { label: 'Modif. rapport',           ...AB },
    validation_rapport_annuler:           { label: 'Annuler rapport',              ...N },
    // Utilisateurs
    CREATE_USER:                          { label: 'Créer utilisateur',            ...B },
    UPDATE_USER:                          { label: 'Modifier utilisateur',         ...N },
    DELETE_USER:                          { label: 'Supprimer utilisateur',        ...D },
    // Entités
    CREATE_ENTITE:                        { label: 'Créer entité',                 ...B },
    UPDATE_ENTITE:                        { label: 'Modifier entité',              ...N },
    DELETE_ENTITE:                        { label: 'Supprimer entité',             ...D },
    // Système
    UPDATE_SETTINGS:                      { label: 'Modifier paramètres',          ...V },
};

// Catégories pour filtre groupé
const CATEGORIES = [
    { key: '',          label: 'Toutes' },
    { key: 'auth',      label: 'Connexion',   actions: ['LOGIN','LOGIN_FAILED','CHANGE_PASSWORD','RESET_PASSWORD'] },
    { key: 'audit',     label: 'Audits',      actions: ['CREATE_AUDIT','UPDATE_AUDIT','DELETE_AUDIT','SOUMETTRE_AUDIT','VALIDER_AUDIT','REJETER_AUDIT','phase_changed'] },
    { key: 'document',  label: 'Documents',   actions: ['doc_upload','doc_delete','doc_valide','doc_refuse','doc_commentaire'] },
    { key: 'plan',      label: 'Plans',       actions: ['CREATE_PLAN_ACTION','UPDATE_PLAN_ACTION','DELETE_PLAN_ACTION','SOUMETTRE_PLAN','VALIDER_PLAN','REJETER_PLAN'] },
    { key: 'valid',     label: 'Validations', actions: ['validation_planning_soumettre','validation_planning_valider','validation_planning_demander_modification','validation_planning_annuler','validation_rapport_soumettre','validation_rapport_valider','validation_rapport_demander_modification','validation_rapport_annuler'] },
    { key: 'user',      label: 'Utilisateurs',actions: ['CREATE_USER','UPDATE_USER','DELETE_USER'] },
    { key: 'system',    label: 'Système',     actions: ['CREATE_ENTITE','UPDATE_ENTITE','DELETE_ENTITE','UPDATE_SETTINGS'] },
];

const RESOURCE_LABELS = {
    audit:       'Audit',
    user:        'Utilisateur',
    entite:      'Entité',
    plan_action: "Plan d'action",
    document:    'Document',
    settings:    'Paramètres',
};

// Raccourcis dates
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
};

const DATE_SHORTCUTS = [
    { label: "Aujourd'hui",  from: () => today(),    to: () => today()   },
    { label: '7 derniers j', from: () => daysAgo(7), to: () => today()   },
    { label: '30 derniers j',from: () => daysAgo(30),to: () => today()   },
];

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

    // Filtres serveur
    const [page, setPage]         = useState(1);
    const [action, setAction]     = useState('');
    const [resource, setResource] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo]     = useState('');

    // Filtres client
    const [search, setSearch]     = useState('');
    const [category, setCategory] = useState('');
    const [customDate, setCustomDate] = useState(false);

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

    // Filtre catégorie → met à jour le filtre action serveur
    const handleCategory = (cat) => {
        setCategory(cat.key);
        setAction('');
        setPage(1);
        // Si catégorie sélectionnée, on filtre côté client sur les actions de la catégorie
    };

    // Raccourci date
    const applyShortcut = (s) => {
        setDateFrom(s.from());
        setDateTo(s.to());
        setCustomDate(false);
        setPage(1);
    };

    const activeShortcut = DATE_SHORTCUTS.find(s => s.from() === dateFrom && s.to() === dateTo);

    const resetFilters = () => {
        setAction(''); setResource(''); setDateFrom(''); setDateTo('');
        setSearch(''); setCategory(''); setCustomDate(false); setPage(1);
    };

    const hasServerFilters = action || resource || dateFrom || dateTo;
    const hasFilters = hasServerFilters || search || category;

    // Filtre client-side (recherche texte + catégorie)
    const displayedLogs = useMemo(() => logs.filter(entry => {
        // Filtre catégorie
        if (category) {
            const cat = CATEGORIES.find(c => c.key === category);
            if (cat?.actions && !cat.actions.includes(entry.action)) return false;
        }
        // Filtre texte
        if (search) {
            const q = search.toLowerCase();
            const userName = `${entry.user?.prenom || ''} ${entry.user?.nom || ''}`.toLowerCase();
            const details  = (entry.details || '').toLowerCase();
            const actionLbl = (ACTION_CONFIG[entry.action]?.label || entry.action || '').toLowerCase();
            if (!userName.includes(q) && !details.includes(q) && !actionLbl.includes(q)) return false;
        }
        return true;
    }), [logs, search, category]);

    const activeFiltersCount = [action, resource, dateFrom || dateTo, search, category].filter(Boolean).length;

    return (
        <div className="space-y-4">

            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Journaux d'activité</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Historique de toutes les actions effectuées sur la plateforme
                    </p>
                </div>
                {!loading && (
                    <div className="flex items-center gap-2">
                        {activeFiltersCount > 0 && (
                            <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                                {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
                            </span>
                        )}
                        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                            {total.toLocaleString('fr-FR')} entrée{total > 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">

                {/* Ligne 1 : Recherche + Action + Ressource */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[220px]">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Rechercher par utilisateur, action ou détails…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                        />
                    </div>
                    <div className="w-52">
                        <AppSelect
                            value={action}
                            onChange={v => { setAction(v); setCategory(''); setPage(1); }}
                            options={[
                                { value: '', label: 'Toutes les actions' },
                                ...Object.entries(ACTION_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))
                            ]}
                            size="sm"
                        />
                    </div>
                    <div className="w-44">
                        <AppSelect
                            value={resource}
                            onChange={v => { setResource(v); setPage(1); }}
                            options={[
                                { value: '', label: 'Toutes ressources' },
                                ...Object.entries(RESOURCE_LABELS).map(([k, v]) => ({ value: k, label: v }))
                            ]}
                            size="sm"
                        />
                    </div>
                </div>

                {/* Ligne 2 : Catégories */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-400 mr-1">Catégorie :</span>
                    {CATEGORIES.map(cat => (
                        <button key={cat.key} onClick={() => handleCategory(cat)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                                category === cat.key
                                    ? 'bg-gray-800 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Ligne 3 : Période */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-400 mr-1">Période :</span>
                    {DATE_SHORTCUTS.map(s => (
                        <button key={s.label} onClick={() => applyShortcut(s)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                                !customDate && activeShortcut?.label === s.label
                                    ? 'bg-gray-800 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                            {s.label}
                        </button>
                    ))}
                    <button onClick={() => { setCustomDate(true); }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                            customDate
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        Personnalisé
                    </button>

                    {/* Date range — affiché si personnalisé ou si dates déjà renseignées sans raccourci */}
                    {(customDate || (dateFrom && !activeShortcut) || (dateTo && !activeShortcut)) && (
                        <div className="flex items-center gap-2 ml-1">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <input type="date" value={dateFrom}
                                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                                className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-gray-400" />
                            <span className="text-xs text-gray-400">→</span>
                            <input type="date" value={dateTo} min={dateFrom || undefined}
                                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                                className={`text-xs border rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-gray-400 ${
                                    dateTo && dateFrom && dateTo < dateFrom ? 'border-red-300' : 'border-gray-200'
                                }`} />
                            {dateTo && dateFrom && dateTo < dateFrom && (
                                <span className="text-xs text-red-500">Date fin invalide</span>
                            )}
                        </div>
                    )}

                    {/* Réinitialiser */}
                    {hasFilters && (
                        <button onClick={resetFilters}
                            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Réinitialiser
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-4 space-y-2.5">
                        {[...Array(8)].map((_, i) => <Sk key={i} className="h-10" />)}
                    </div>
                ) : displayedLogs.length === 0 ? (
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
                    <>
                        {/* Résumé résultats filtrés */}
                        {(search || category) && (
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                                {displayedLogs.length} résultat{displayedLogs.length !== 1 ? 's' : ''} sur {logs.length} chargé{logs.length !== 1 ? 's' : ''}
                            </div>
                        )}
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
                                    {displayedLogs.map(entry => (
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
                                                            {entry.user.role?.replace(/_/g, ' ')}
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
                                                    ? <span>
                                                        {RESOURCE_LABELS[entry.resource] ?? entry.resource}
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
                    </>
                )}
            </div>

            {/* Pagination */}
            {!loading && pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                        Page {page} sur {pages} — {total.toLocaleString('fr-FR')} résultats
                    </p>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                            ← Précédent
                        </button>
                        {[...Array(Math.min(5, pages))].map((_, i) => {
                            const p = Math.max(1, Math.min(page - 2, pages - 4)) + i;
                            return (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-8 h-8 text-xs font-medium rounded-xl transition ${
                                        p === page ? 'text-white' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                                    }`}
                                    style={p === page ? { backgroundColor: 'var(--brand-red)' } : {}}>
                                    {p}
                                </button>
                            );
                        })}
                        <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                            Suivant →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournauxPage;
