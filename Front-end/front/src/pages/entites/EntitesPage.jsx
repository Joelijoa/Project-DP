import { useEffect, useState } from 'react';
import { getAllEntites, createEntite, updateEntite, deleteEntite } from '../../services/endpoints/entiteService';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/common/ConfirmModal';
import { SECTEURS, emptyForm, isIncomplete } from './components/entiteConfig';
import EntiteStatCard from './components/EntiteStatCard';
import EntiteCard from './components/EntiteCard';
import EntiteDetailPanel from './components/EntiteDetailPanel';
import EntiteFormModal from './components/EntiteFormModal';
import EntiteEmptyState from './components/EntiteEmptyState';

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
                <EntiteStatCard value={entites.length} label="Entités" icon="building" />
                <EntiteStatCard value={totalAudits}    label="Audits liés" icon="clipboard" />
                <EntiteStatCard value={totalSecteurs}  label="Secteurs" icon="tag" />
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
                        <EntiteEmptyState hasFilter={!!search || !!filterSecteur} onClear={() => { setSearch(''); setFilterSecteur(''); }} />
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
                        <EntiteDetailPanel
                            entite={selected}
                            onClose={() => setSelectedId(null)}
                            onEdit={(e) => openEdit(e, selected)}
                        />
                    </div>
                )}
            </div>

            {/* Modal formulaire */}
            {showForm && (
                <EntiteFormModal
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

export default EntitesPage;
