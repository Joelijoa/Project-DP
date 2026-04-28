import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllEntites, createEntite, updateEntite, deleteEntite } from '../../services/endpoints/entiteService';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/common/ConfirmModal';

const SECTEURS = [
    'Administration publique', 'Banque & Finance', 'Santé', 'Éducation',
    'Télécommunications', 'Énergie', 'Transport', 'Industrie', 'Commerce', 'Autre',
];

const SECTEUR_COLORS = {
    'Administration publique': { badge: 'bg-blue-50 text-blue-700',       avatar: '#3B82F6' },
    'Banque & Finance':        { badge: 'bg-emerald-50 text-emerald-700',  avatar: '#10B981' },
    'Santé':                   { badge: 'bg-red-50 text-red-700',          avatar: '#EF4444' },
    'Éducation':               { badge: 'bg-purple-50 text-purple-700',    avatar: '#8B5CF6' },
    'Télécommunications':      { badge: 'bg-cyan-50 text-cyan-700',        avatar: '#06B6D4' },
    'Énergie':                 { badge: 'bg-amber-50 text-amber-700',      avatar: '#F59E0B' },
    'Transport':               { badge: 'bg-orange-50 text-orange-700',    avatar: '#F97316' },
    'Industrie':               { badge: 'bg-stone-50 text-stone-600',      avatar: '#78716C' },
    'Commerce':                { badge: 'bg-pink-50 text-pink-700',        avatar: '#EC4899' },
    'Autre':                   { badge: 'bg-gray-100 text-gray-600',       avatar: '#9CA3AF' },
};

const STATUT_CONFIG = {
    brouillon: { label: 'Brouillon', bg: 'bg-gray-100',   text: 'text-gray-600'  },
    en_cours:  { label: 'En cours',  bg: 'bg-blue-50',    text: 'text-blue-700'  },
    termine:   { label: 'Terminé',   bg: 'bg-green-50',   text: 'text-green-700' },
    archive:   { label: 'Archivé',   bg: 'bg-yellow-50',  text: 'text-yellow-700' },
};

const emptyForm = {
    nom: '', secteur: '', adresse: '', ville: '', pays: 'Maroc',
    telephone: '', email: '', site_web: '', description: '',
};

const getInitials = (nom = '') => {
    const words = nom.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return nom.slice(0, 2).toUpperCase() || '?';
};

const getAvatarColor = (secteur) => SECTEUR_COLORS[secteur]?.avatar ?? '#9CA3AF';

const isIncomplete = (entite) =>
    !entite.secteur && !entite.ville && !entite.email && !entite.telephone;

const InputField = ({ label, required, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition color-[#111827]';

const EntitesPage = () => {
    const [entites, setEntites]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [filterSecteur, setFilterSecteur] = useState('');
    const [showForm, setShowForm]     = useState(false);
    const [editingId, setEditingId]   = useState(null);
    const [form, setForm]             = useState({ ...emptyForm });
    const [submitting, setSubmitting] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const load = async () => {
        try {
            const res = await getAllEntites();
            setEntites(res.data.entites || []);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const openCreate = () => {
        setForm({ ...emptyForm });
        setEditingId(null);
        setShowForm(true);
        setSelectedId(null);
    };

    const openEdit = (e, entite) => {
        e.stopPropagation();
        setForm({
            nom: entite.nom || '', secteur: entite.secteur || '',
            adresse: entite.adresse || '', ville: entite.ville || '',
            pays: entite.pays || 'Maroc', telephone: entite.telephone || '',
            email: entite.email || '', site_web: entite.site_web || '',
            description: entite.description || '',
        });
        setEditingId(entite.id);
        setShowForm(true);
        setSelectedId(null);
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                const res = await updateEntite(editingId, form);
                setEntites(prev => prev.map(e => e.id === editingId ? { ...e, ...res.data.entite } : e));
                toast.success('Entité mise à jour');
            } else {
                const res = await createEntite(form);
                setEntites(prev => [res.data.entite, ...prev]);
                toast.success('Entité créée');
            }
            setShowForm(false);
            setEditingId(null);
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteEntite(deleteTarget.id);
            setEntites(prev => prev.filter(en => en.id !== deleteTarget.id));
            if (selectedId === deleteTarget.id) setSelectedId(null);
            toast.success('Entité supprimée');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur lors de la suppression');
        } finally {
            setDeleteTarget(null);
        }
    };

    const filtered = entites.filter(e => {
        const q = search.toLowerCase();
        const matchSearch = !search || e.nom?.toLowerCase().includes(q) || e.secteur?.toLowerCase().includes(q) || e.ville?.toLowerCase().includes(q);
        const matchSecteur = !filterSecteur || e.secteur === filterSecteur;
        return matchSearch && matchSecteur;
    });

    const selected = selectedId ? entites.find(e => e.id === selectedId) : null;

    const totalAudits    = entites.reduce((acc, e) => acc + (e.audits?.length ?? 0), 0);
    const totalSecteurs  = new Set(entites.map(e => e.secteur).filter(Boolean)).size;
    const incompleteCount = entites.filter(isIncomplete).length;

    return (
        <div>
            {/* En-tête */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Entités auditées</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Organismes et structures soumis à l'évaluation</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--brand-red)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Nouvelle entité
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <StatCard value={entites.length} label="Entités" icon="building" />
                <StatCard value={totalAudits}    label="Audits liés" icon="clipboard" />
                <StatCard value={totalSecteurs}  label="Secteurs" icon="tag" />
            </div>

            {/* Bannière entités incomplètes */}
            {incompleteCount > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-5">
                    <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-800">
                            {incompleteCount} entité{incompleteCount > 1 ? 's' : ''} à compléter
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            {incompleteCount > 1
                                ? 'Ces entités ont été créées automatiquement depuis un audit. Cliquez sur le bouton modifier pour renseigner leurs informations.'
                                : 'Cette entité a été créée automatiquement depuis un audit. Cliquez sur modifier pour renseigner ses informations.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Barre recherche + filtre */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input type="text" placeholder="Rechercher par nom, secteur, ville..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition" />
                </div>
                <select value={filterSecteur} onChange={e => setFilterSecteur(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition min-w-[180px]">
                    <option value="">Tous les secteurs</option>
                    {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="flex gap-5">
                {/* Liste */}
                <div className={`${selected ? 'w-1/2' : 'w-full'} transition-all`}>
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin"
                                style={{ borderTopColor: 'var(--brand-red)' }} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState hasFilter={!!search || !!filterSecteur} onClear={() => { setSearch(''); setFilterSecteur(''); }} />
                    ) : (
                        <div className="space-y-2.5">
                            {filtered.map(entite => (
                                <EntiteCard
                                    key={entite.id}
                                    entite={entite}
                                    isSelected={selectedId === entite.id}
                                    compact={!!selected}
                                    onClick={() => setSelectedId(selectedId === entite.id ? null : entite.id)}
                                    onEdit={(e) => openEdit(e, entite)}
                                    onDelete={(e) => { e.stopPropagation(); setDeleteTarget(entite); }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Panneau détail */}
                {selected && (
                    <div className="w-1/2">
                        <DetailPanel
                            entite={selected}
                            onClose={() => setSelectedId(null)}
                            onEdit={(e) => openEdit(e, selected)}
                        />
                    </div>
                )}
            </div>

            {/* Modal formulaire */}
            {showForm && (
                <FormModal
                    form={form} setF={setF}
                    editingId={editingId}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onClose={() => { setShowForm(false); setEditingId(null); }}
                />
            )}

            {/* Modal suppression */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Supprimer l'entité"
                message={`"${deleteTarget?.nom}" sera supprimée définitivement.`}
                confirmLabel="Supprimer"
                danger
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

/* ── Stat Card ─────────────────────────────────────────────────── */
const STAT_ICONS = {
    building: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
    clipboard: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75m0-3.75h3M10.5 21h5.625c.621 0 1.125-.504 1.125-1.125v-17.25c0-.621-.504-1.125-1.125-1.125H4.875c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125H10.5z',
    tag: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3zM6 6h.008v.008H6V6z',
};

const StatCard = ({ value, label, icon }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={STAT_ICONS[icon]} />
            </svg>
        </div>
        <div>
            <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
    </div>
);

/* ── Entité Card ────────────────────────────────────────────────── */
const EntiteCard = ({ entite, isSelected, compact, onClick, onEdit, onDelete }) => {
    const color      = getAvatarColor(entite.secteur);
    const badge      = SECTEUR_COLORS[entite.secteur]?.badge ?? 'bg-gray-100 text-gray-600';
    const audits     = entite.audits?.length ?? 0;
    const incomplete = isIncomplete(entite);

    return (
        <div onClick={onClick}
            className={`bg-white rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-red-300 shadow-sm ring-1 ring-red-100' : incomplete ? 'border-amber-200 hover:border-amber-300 hover:shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
            <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar initiales */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold relative"
                        style={{ backgroundColor: color }}>
                        {getInitials(entite.nom)}
                        {incomplete && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                            </span>
                        )}
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 truncate">{entite.nom}</p>
                            {incomplete && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                    </svg>
                                    À compléter
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {entite.secteur && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge}`}>
                                    {entite.secteur}
                                </span>
                            )}
                            {entite.ville && !compact && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                    {entite.ville}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Audit count */}
                    <div className="text-center min-w-[36px]">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${audits > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                            {audits} audit{audits !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-0.5">
                        <button onClick={onEdit}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Modifier">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                        </button>
                        <button onClick={onDelete}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Detail Panel ───────────────────────────────────────────────── */
const DetailPanel = ({ entite, onClose, onEdit }) => {
    const color      = getAvatarColor(entite.secteur);
    const badge      = SECTEUR_COLORS[entite.secteur]?.badge ?? 'bg-gray-100 text-gray-600';
    const incomplete = isIncomplete(entite);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-4">
            {/* Header coloré */}
            <div className="h-16 relative" style={{ backgroundColor: color + '22' }}>
                <button onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 bg-white/70 hover:bg-white rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="px-5 pb-5">
                {/* Avatar flottant */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold -mt-7 mb-3 shadow-md"
                    style={{ backgroundColor: color }}>
                    {getInitials(entite.nom)}
                </div>

                {/* Bannière informations incomplètes */}
                {incomplete && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
                        <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-amber-800 mb-0.5">Informations incomplètes</p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Cette entité a été créée automatiquement depuis un audit. Veuillez compléter ses informations (secteur, contact, adresse…).
                            </p>
                            <button onClick={onEdit}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                </svg>
                                Compléter maintenant
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-start justify-between mb-1">
                    <h2 className="text-base font-semibold text-gray-900 leading-tight">{entite.nom}</h2>
                    <button onClick={onEdit}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex-shrink-0 ml-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                    </button>
                </div>

                {entite.secteur && (
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-4 ${badge}`}>
                        {entite.secteur}
                    </span>
                )}

                {/* Coordonnées */}
                <div className="space-y-2 mb-5">
                    {(entite.adresse || entite.ville) && (
                        <InfoRow icon="location" label={[entite.adresse, entite.ville, entite.pays].filter(Boolean).join(', ')} />
                    )}
                    {entite.telephone && <InfoRow icon="phone" label={entite.telephone} />}
                    {entite.email     && <InfoRow icon="email" label={entite.email} />}
                    {entite.site_web  && <InfoRow icon="web"   label={entite.site_web} />}
                    {entite.description && (
                        <p className="text-xs text-gray-500 pt-2 mt-2 border-t border-gray-100 leading-relaxed">
                            {entite.description}
                        </p>
                    )}
                </div>

                {/* Audits */}
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Audits associés ({entite.audits?.length ?? 0})
                    </p>
                    {!entite.audits?.length ? (
                        <p className="text-xs text-gray-400 italic">Aucun audit lié à cette entité</p>
                    ) : (
                        <div className="space-y-1.5">
                            {entite.audits.map(audit => {
                                const st = STATUT_CONFIG[audit.statut] ?? STATUT_CONFIG.brouillon;
                                return (
                                    <Link key={audit.id} to={`/audits/${audit.id}`}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition group">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-gray-800 truncate group-hover:text-gray-900">{audit.nom}</p>
                                            {audit.referentiel && (
                                                <p className="text-xs text-gray-400">{audit.referentiel.nom}</p>
                                            )}
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${st.bg} ${st.text}`}>
                                            {st.label}
                                        </span>
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

/* ── Form Modal ─────────────────────────────────────────────────── */
const FormModal = ({ form, setF, editingId, submitting, onSubmit, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">
                        {editingId ? "Modifier l'entité" : 'Nouvelle entité auditée'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {editingId ? 'Mettez à jour les informations.' : 'Remplissez les informations de base.'}
                    </p>
                </div>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Nom de l'entité" required>
                        <input type="text" required value={form.nom}
                            onChange={e => setF('nom', e.target.value)}
                            placeholder="Ex : Ministère de la Santé"
                            className={inputCls} />
                    </InputField>
                    <InputField label="Secteur">
                        <select value={form.secteur} onChange={e => setF('secteur', e.target.value)} className={inputCls}>
                            <option value="">— Sélectionner —</option>
                            {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </InputField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <InputField label="Adresse">
                            <input type="text" value={form.adresse}
                                onChange={e => setF('adresse', e.target.value)}
                                placeholder="Adresse complète"
                                className={inputCls} />
                        </InputField>
                    </div>
                    <InputField label="Ville">
                        <input type="text" value={form.ville}
                            onChange={e => setF('ville', e.target.value)}
                            placeholder="Ex : Rabat"
                            className={inputCls} />
                    </InputField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Téléphone">
                        <input type="text" value={form.telephone}
                            onChange={e => setF('telephone', e.target.value)}
                            placeholder="+212 5 37 00 00 00"
                            className={inputCls} />
                    </InputField>
                    <InputField label="Email">
                        <input type="email" value={form.email}
                            onChange={e => setF('email', e.target.value)}
                            placeholder="contact@entite.ma"
                            className={inputCls} />
                    </InputField>
                    <InputField label="Site web">
                        <input type="text" value={form.site_web}
                            onChange={e => setF('site_web', e.target.value)}
                            placeholder="https://..."
                            className={inputCls} />
                    </InputField>
                </div>

                <InputField label="Description">
                    <textarea value={form.description} onChange={e => setF('description', e.target.value)}
                        rows={2} placeholder="Description ou notes sur l'entité..."
                        className={`${inputCls} resize-none`} />
                </InputField>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button type="submit" disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {editingId ? 'Enregistrer les modifications' : "Créer l'entité"}
                    </button>
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    </div>
);

/* ── Empty State ────────────────────────────────────────────────── */
const EmptyState = ({ hasFilter, onClear }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
        </div>
        <p className="text-sm font-medium text-gray-700">
            {hasFilter ? 'Aucun résultat' : 'Aucune entité'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
            {hasFilter ? 'Essayez de modifier vos filtres.' : 'Créez votre première entité auditée.'}
        </p>
        {hasFilter && (
            <button onClick={onClear} className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                Réinitialiser les filtres
            </button>
        )}
    </div>
);

/* ── Petits composants ──────────────────────────────────────────── */
const INFO_ICONS = {
    location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
    phone:    'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
    email:    'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
    web:      'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
};

const InfoRow = ({ icon, label }) => (
    <div className="flex items-start gap-2">
        <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={INFO_ICONS[icon]} />
        </svg>
        <span className="text-xs text-gray-600 break-all">{label}</span>
    </div>
);

export default EntitesPage;
