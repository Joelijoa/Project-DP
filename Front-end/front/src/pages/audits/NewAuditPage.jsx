import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createAudit } from '../../services/endpoints/auditService';
import { getAllReferentiels } from '../../services/endpoints/referentielService';
import { getAllUsers } from '../../services/endpoints/userService';
import DateInput from '../../components/common/DateInput';
import { toast } from 'react-toastify';

const NewAuditPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [referentiels, setReferentiels] = useState([]);
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({
        nom: '',
        client: '',
        perimetre: '',
        referentiel_id: '',
        date_debut: '',   // stocké en ISO yyyy-mm-dd
        date_fin: '',     // stocké en ISO yyyy-mm-dd
        auditeurs_ids: [],
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const load = async () => {
            try {
                const [refRes, usersRes] = await Promise.all([
                    getAllReferentiels(),
                    getAllUsers(),
                ]);
                setReferentiels(refRes.data.referentiels || []);
                setUsers((usersRes.data.users || []).filter(u => u.actif));
            } catch (err) {
                toast.error('Erreur lors du chargement des données');
            }
        };
        load();
    }, []);

    const set = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const toggleAuditeur = (userId) => {
        setForm(prev => {
            const ids = prev.auditeurs_ids.includes(userId)
                ? prev.auditeurs_ids.filter(id => id !== userId)
                : [...prev.auditeurs_ids, userId];
            return { ...prev, auditeurs_ids: ids };
        });
    };

    const validate = () => {
        const e = {};
        if (!form.nom.trim()) e.nom = 'Le nom est requis';
        if (!form.client.trim()) e.client = "L'entité auditée est requise";
        if (!form.referentiel_id) e.referentiel_id = 'Le référentiel est requis';
        if (form.date_debut && form.date_fin && form.date_debut > form.date_fin) {
            e.date_fin = 'La date de fin doit être après la date de début';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const payload = {
                nom: form.nom.trim(),
                client: form.client.trim(),
                perimetre: form.perimetre.trim() || null,
                referentiel_id: parseInt(form.referentiel_id),
                date_debut: form.date_debut || null,
                date_fin: form.date_fin || null,
                auditeurs_ids: form.auditeurs_ids,
            };
            const res = await createAudit(payload);
            toast.success('Audit créé avec succès');
            navigate(`/audits/${res.data.audit.id}`);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Erreur inconnue';
            toast.error(`Erreur : ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (field) =>
        `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
            errors[field]
                ? 'border-red-300 focus:ring-red-200'
                : 'border-gray-200 focus:ring-blue-100'
        }`;

    return (
        <div className="max-w-3xl">
            {/* En-tête */}
            <div className="flex items-center gap-3 mb-6">
                <Link
                    to="/audits"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Nouvel audit</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Créer un nouvel audit de conformité</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── Étape 1 : Informations générales ── */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: 'var(--brand-red)' }}>1</span>
                        Informations générales
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                Nom de l'audit <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.nom}
                                onChange={e => set('nom', e.target.value)}
                                placeholder="Ex : Audit DNSSI 2025 — Ministère X"
                                className={inputClass('nom')}
                            />
                            {errors.nom && <p className="mt-1 text-xs text-red-500">{errors.nom}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                Entité / Client audité <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.client}
                                onChange={e => set('client', e.target.value)}
                                placeholder="Dénomination de l'entité ou IIV"
                                className={inputClass('client')}
                            />
                            {errors.client && <p className="mt-1 text-xs text-red-500">{errors.client}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Périmètre de l'audit</label>
                            <textarea
                                value={form.perimetre}
                                onChange={e => set('perimetre', e.target.value)}
                                placeholder="Décrire le périmètre couvert par cet audit..."
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Étape 2 : Référentiel & Planification ── */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: 'var(--brand-red)' }}>2</span>
                        Référentiel & Planification
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                Référentiel <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.referentiel_id}
                                onChange={e => set('referentiel_id', e.target.value)}
                                className={inputClass('referentiel_id') + ' bg-white'}
                            >
                                <option value="">Sélectionner un référentiel</option>
                                {referentiels.map(r => (
                                    <option key={r.id} value={r.id}>{r.nom} ({r.type})</option>
                                ))}
                            </select>
                            {errors.referentiel_id && <p className="mt-1 text-xs text-red-500">{errors.referentiel_id}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Date de début
                                    <span className="ml-1 text-gray-400 font-normal">(jj/mm/aaaa)</span>
                                </label>
                                <DateInput
                                    value={form.date_debut}
                                    onChange={v => set('date_debut', v)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Date de fin prévue
                                    <span className="ml-1 text-gray-400 font-normal">(jj/mm/aaaa)</span>
                                </label>
                                <DateInput
                                    value={form.date_fin}
                                    onChange={v => set('date_fin', v)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${errors.date_fin ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-100'}`}
                                />
                                {errors.date_fin && <p className="mt-1 text-xs text-red-500">{errors.date_fin}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Étape 3 : Équipe ── */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: 'var(--brand-red)' }}>3</span>
                        Équipe d'auditeurs
                        <span className="ml-auto text-xs font-normal text-gray-400">Optionnel</span>
                    </h2>
                    {users.length === 0 ? (
                        <p className="text-sm text-gray-400">Aucun utilisateur disponible</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {users.map(u => {
                                const selected = form.auditeurs_ids.includes(u.id);
                                return (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => toggleAuditeur(u.id)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left text-sm transition ${
                                            selected
                                                ? 'border-red-200 bg-red-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                                            style={{ backgroundColor: selected ? 'var(--brand-red)' : '#9CA3AF' }}>
                                            {u.prenom?.[0]}{u.nom?.[0]}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-gray-800 truncate">{u.prenom} {u.nom}</p>
                                            <p className="text-xs text-gray-400 truncate">{u.role}</p>
                                        </div>
                                        {selected && (
                                            <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Actions ── */}
                <div className="flex items-center justify-end gap-3 pb-6">
                    <Link
                        to="/audits"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        {loading
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                        }
                        Créer l'audit
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewAuditPage;
