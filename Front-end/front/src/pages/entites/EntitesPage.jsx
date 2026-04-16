import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllEntites, createEntite, updateEntite, deleteEntite } from '../../services/endpoints/entiteService';
import { toast } from 'react-toastify';

const SECTEURS = [
    'Administration publique',
    'Banque & Finance',
    'Santé',
    'Éducation',
    'Télécommunications',
    'Énergie',
    'Transport',
    'Industrie',
    'Commerce',
    'Autre',
];

const STATUT_CONFIG = {
    brouillon: { label: 'Brouillon',  bg: 'bg-gray-100',   text: 'text-gray-600' },
    en_cours:  { label: 'En cours',   bg: 'bg-blue-50',    text: 'text-blue-700' },
    termine:   { label: 'Terminé',    bg: 'bg-green-50',   text: 'text-green-700' },
    archive:   { label: 'Archivé',    bg: 'bg-yellow-50',  text: 'text-yellow-700' },
};

const emptyForm = {
    nom: '', secteur: '', adresse: '', ville: '', pays: 'Maroc',
    telephone: '', email: '', site_web: '', description: '',
};

const EntitesPage = () => {
    const [entites, setEntites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [submitting, setSubmitting] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

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
            nom:         entite.nom || '',
            secteur:     entite.secteur || '',
            adresse:     entite.adresse || '',
            ville:       entite.ville || '',
            pays:        entite.pays || 'Maroc',
            telephone:   entite.telephone || '',
            email:       entite.email || '',
            site_web:    entite.site_web || '',
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
            const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la sauvegarde';
            toast.error(msg);
            console.error('[EntitesPage] submit:', err?.response?.status, msg, err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (e, entite) => {
        e.stopPropagation();
        if (!window.confirm(`Supprimer "${entite.nom}" ?`)) return;
        try {
            await deleteEntite(entite.id);
            setEntites(prev => prev.filter(en => en.id !== entite.id));
            if (selectedId === entite.id) setSelectedId(null);
            toast.success('Entité supprimée');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const filtered = entites.filter(e => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            e.nom?.toLowerCase().includes(q) ||
            e.secteur?.toLowerCase().includes(q) ||
            e.ville?.toLowerCase().includes(q)
        );
    });

    const selected = selectedId ? entites.find(e => e.id === selectedId) : null;

    return (
        <div>
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Entités auditées</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Organismes et structures soumis à l'évaluation</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition"
                    style={{ backgroundColor: 'var(--brand-red)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Nouvelle entité
                </button>
            </div>

            {/* Formulaire création / édition */}
            {showForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4">
                        {editingId ? "Modifier l'entité" : 'Nouvelle entité auditée'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Nom de l'entité *
                                </label>
                                <input type="text" required value={form.nom}
                                    onChange={e => setF('nom', e.target.value)}
                                    placeholder="Ex : Ministère de la Santé"
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Secteur</label>
                                <select value={form.secteur} onChange={e => setF('secteur', e.target.value)}
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1">
                                    <option value="">— Sélectionner —</option>
                                    {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Adresse</label>
                                <input type="text" value={form.adresse}
                                    onChange={e => setF('adresse', e.target.value)}
                                    placeholder="Adresse complète"
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ville</label>
                                <input type="text" value={form.ville}
                                    onChange={e => setF('ville', e.target.value)}
                                    placeholder="Ex : Rabat"
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</label>
                                <input type="text" value={form.telephone}
                                    onChange={e => setF('telephone', e.target.value)}
                                    placeholder="+212 5 37 00 00 00"
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                                <input type="email" value={form.email}
                                    onChange={e => setF('email', e.target.value)}
                                    placeholder="contact@entite.ma"
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Site web</label>
                                <input type="text" value={form.site_web}
                                    onChange={e => setF('site_web', e.target.value)}
                                    placeholder="https://..."
                                    className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                            <textarea value={form.description} onChange={e => setF('description', e.target.value)}
                                rows={2} placeholder="Description ou notes sur l'entité..."
                                className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1" />
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button type="submit" disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {editingId ? 'Enregistrer' : "Créer l'entité"}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex gap-6">
                {/* Liste des entités */}
                <div className={`${selected ? 'w-1/2' : 'w-full'} transition-all`}>
                    {/* Barre de recherche */}
                    <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
                        <input type="text" placeholder="Rechercher par nom, secteur, ville..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1" />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin"
                                style={{ borderTopColor: 'var(--brand-red)' }} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-500">Aucune entité trouvée</p>
                            <p className="text-xs text-gray-400 mt-1">Créez votre première entité auditée</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map(entite => (
                                <div key={entite.id}
                                    onClick={() => setSelectedId(selectedId === entite.id ? null : entite.id)}
                                    className={`bg-white rounded-xl border cursor-pointer transition-all ${selectedId === entite.id ? 'border-red-300 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="p-4 flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            {/* Icône */}
                                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: 'var(--brand-red)', opacity: 0.9 }}>
                                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{entite.nom}</p>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    {entite.secteur && (
                                                        <span className="text-xs text-gray-500">{entite.secteur}</span>
                                                    )}
                                                    {entite.ville && (
                                                        <>
                                                            <span className="text-gray-300">·</span>
                                                            <span className="text-xs text-gray-500">{entite.ville}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-gray-800">{entite.audits?.length ?? 0}</p>
                                                <p className="text-xs text-gray-400">audit{(entite.audits?.length ?? 0) !== 1 ? 's' : ''}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={(e) => openEdit(e, entite)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Modifier">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                    </svg>
                                                </button>
                                                <button onClick={(e) => handleDelete(e, entite)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Supprimer">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Panneau détail */}
                {selected && (
                    <div className="w-1/2">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">{selected.nom}</h2>
                                    {selected.secteur && (
                                        <p className="text-xs text-gray-500 mt-0.5">{selected.secteur}</p>
                                    )}
                                </div>
                                <button onClick={() => setSelectedId(null)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Infos de contact */}
                            <div className="space-y-2 mb-5">
                                {(selected.adresse || selected.ville) && (
                                    <InfoRow icon="location" label={[selected.adresse, selected.ville, selected.pays].filter(Boolean).join(', ')} />
                                )}
                                {selected.telephone && <InfoRow icon="phone" label={selected.telephone} />}
                                {selected.email && <InfoRow icon="email" label={selected.email} />}
                                {selected.site_web && <InfoRow icon="web" label={selected.site_web} />}
                                {selected.description && (
                                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">{selected.description}</p>
                                )}
                            </div>

                            {/* Audits associés */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Audits associés ({selected.audits?.length ?? 0})
                                </p>
                                {!selected.audits?.length ? (
                                    <p className="text-xs text-gray-400 italic">Aucun audit lié à cette entité</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selected.audits.map(audit => {
                                            const st = STATUT_CONFIG[audit.statut] ?? STATUT_CONFIG.brouillon;
                                            return (
                                                <Link key={audit.id} to={`/audits/${audit.id}`}
                                                    className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-800">{audit.nom}</p>
                                                        {audit.referentiel && (
                                                            <p className="text-xs text-gray-400">{audit.referentiel.nom}</p>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${st.bg} ${st.text}`}>
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
                )}
            </div>
        </div>
    );
};

const InfoRow = ({ icon, label }) => {
    const icons = {
        location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
        phone:    'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
        email:    'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
        web:      'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
    };
    return (
        <div className="flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icons[icon]} />
            </svg>
            <span className="text-xs text-gray-600 break-all">{label}</span>
        </div>
    );
};

export default EntitesPage;
