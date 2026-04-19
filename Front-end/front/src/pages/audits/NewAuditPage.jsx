import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createAudit } from '../../services/endpoints/auditService';
import { getAllReferentiels } from '../../services/endpoints/referentielService';
import { getAllUsers } from '../../services/endpoints/userService';
import { toast } from 'react-toastify';

const NewAuditPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading]         = useState(false);
    const [referentiels, setReferentiels] = useState([]);
    const [users, setUsers]             = useState([]);
    const [form, setForm] = useState({
        nom:            '',
        client:         '',
        perimetre:      '',
        referentiel_id: '',
        date_debut:     '',
        date_fin:       '',
        auditeurs_ids:  [],
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        Promise.all([getAllReferentiels(), getAllUsers()])
            .then(([refRes, usersRes]) => {
                setReferentiels(refRes.data.referentiels || []);
                setUsers((usersRes.data.users || []).filter(u => u.actif));
            })
            .catch(() => toast.error('Erreur lors du chargement des données'));
    }, []);

    const set = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const toggleAuditeur = (userId) => {
        setForm(prev => ({
            ...prev,
            auditeurs_ids: prev.auditeurs_ids.includes(userId)
                ? prev.auditeurs_ids.filter(id => id !== userId)
                : [...prev.auditeurs_ids, userId],
        }));
    };

    const validate = () => {
        const e = {};
        if (!form.nom.trim())           e.nom = 'Le nom est requis';
        if (!form.client.trim())        e.client = "L'entité auditée est requise";
        if (!form.referentiel_id)       e.referentiel_id = 'Le référentiel est requis';
        if (form.date_debut && form.date_fin && form.date_debut > form.date_fin)
            e.date_fin = 'La date de fin doit être après la date de début';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const res = await createAudit({
                nom:            form.nom.trim(),
                client:         form.client.trim(),
                perimetre:      form.perimetre.trim() || null,
                referentiel_id: parseInt(form.referentiel_id),
                date_debut:     form.date_debut || null,
                date_fin:       form.date_fin || null,
                auditeurs_ids:  form.auditeurs_ids,
            });
            toast.success('Audit créé avec succès');
            navigate(`/audits/${res.data.audit.id}`);
        } catch (err) {
            toast.error(`Erreur : ${err.response?.data?.message || err.message || 'Erreur inconnue'}`);
        } finally {
            setLoading(false);
        }
    };

    const fmtDate = (iso) => {
        if (!iso) return null;
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

    const inputCls = (field) =>
        `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
            errors[field] ? 'border-red-300 focus:ring-red-200' : 'border-gray-200'
        }`;

    const selectedRef = referentiels.find(r => String(r.id) === String(form.referentiel_id));
    const selectedUsers = users.filter(u => form.auditeurs_ids.includes(u.id));
    const isISO = selectedRef?.type === 'ISO27001';

    return (
        <div>
            {/* En-tête */}
            <div className="flex items-center gap-3 mb-6">
                <Link to="/audits" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Nouvel audit</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Créer un nouvel audit de conformité</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-5 gap-6 items-start">

                    {/* ── Colonne gauche : formulaire ── */}
                    <div className="col-span-3 space-y-5">

                        {/* Section 1 : Informations générales */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                    style={{ backgroundColor: 'var(--brand-red)' }}>1</span>
                                Informations générales
                            </h2>
                            <div className="space-y-4">
                                {/* Nom — pleine largeur */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Nom de l'audit <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" value={form.nom} onChange={e => set('nom', e.target.value)}
                                        placeholder="Ex : Audit DNSSI 2025 — Ministère X"
                                        className={inputCls('nom')}
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                                    {errors.nom && <p className="mt-1 text-xs text-red-500">{errors.nom}</p>}
                                </div>

                                {/* Client + Référentiel — 2 colonnes */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            Entité / Client audité <span className="text-red-500">*</span>
                                        </label>
                                        <input type="text" value={form.client} onChange={e => set('client', e.target.value)}
                                            placeholder="Dénomination de l'entité"
                                            className={inputCls('client')}
                                            style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                                        {errors.client && <p className="mt-1 text-xs text-red-500">{errors.client}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            Référentiel <span className="text-red-500">*</span>
                                        </label>
                                        <select value={form.referentiel_id} onChange={e => set('referentiel_id', e.target.value)}
                                            className={inputCls('referentiel_id') + ' bg-white'}
                                            style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}>
                                            <option value="">Sélectionner…</option>
                                            {referentiels.map(r => (
                                                <option key={r.id} value={r.id}>{r.nom} ({r.type})</option>
                                            ))}
                                        </select>
                                        {errors.referentiel_id && <p className="mt-1 text-xs text-red-500">{errors.referentiel_id}</p>}
                                    </div>
                                </div>

                                {/* Dates — 2 colonnes */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Date de début</label>
                                        <input type="date" value={form.date_debut} onChange={e => set('date_debut', e.target.value)}
                                            className={inputCls('date_debut')}
                                            style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Date de fin prévue</label>
                                        <input type="date" value={form.date_fin} onChange={e => set('date_fin', e.target.value)}
                                            className={inputCls('date_fin')}
                                            style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                                        {errors.date_fin && <p className="mt-1 text-xs text-red-500">{errors.date_fin}</p>}
                                    </div>
                                </div>

                                {/* Périmètre — pleine largeur */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Périmètre de l'audit</label>
                                    <textarea value={form.perimetre} onChange={e => set('perimetre', e.target.value)}
                                        placeholder="Décrire le périmètre couvert par cet audit..."
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 resize-none"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                                </div>
                            </div>
                        </div>

                        {/* Section 2 : Équipe */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                    style={{ backgroundColor: 'var(--brand-red)' }}>2</span>
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
                                            <button key={u.id} type="button" onClick={() => toggleAuditeur(u.id)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition ${
                                                    selected ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}>
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                                                    style={{ backgroundColor: selected ? 'var(--brand-red)' : '#9CA3AF' }}>
                                                    {u.prenom?.[0]}{u.nom?.[0]}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{u.prenom} {u.nom}</p>
                                                    <p className="text-xs text-gray-400 truncate">{u.role}</p>
                                                </div>
                                                {selected && (
                                                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pb-6">
                            <Link to="/audits" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                Annuler
                            </Link>
                            <button type="submit" disabled={loading}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-60"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                {loading
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                }
                                Créer l'audit
                            </button>
                        </div>
                    </div>

                    {/* ── Colonne droite : aperçu live ── */}
                    <div className="col-span-2 space-y-4 sticky top-6">

                        {/* Carte aperçu */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Aperçu de l'audit</h3>

                            {/* Nom */}
                            <div className="mb-4">
                                {form.nom.trim() ? (
                                    <p className="text-base font-semibold text-gray-900 leading-snug">{form.nom}</p>
                                ) : (
                                    <p className="text-sm text-gray-300 italic">Nom de l'audit…</p>
                                )}
                            </div>

                            {/* Référentiel badge */}
                            {selectedRef ? (
                                <div className="mb-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        isISO ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isISO ? '#2563eb' : '#CC0000' }} />
                                        {selectedRef.type}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1.5">{selectedRef.nom}</p>
                                </div>
                            ) : (
                                <div className="mb-4 h-6 rounded-full bg-gray-100 w-24 animate-pulse" />
                            )}

                            {/* Champs remplis */}
                            <div className="space-y-2.5 text-sm border-t border-gray-100 pt-4">
                                <div className="flex items-start gap-2">
                                    <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                                    </svg>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Client / Entité</p>
                                        <p className={form.client.trim() ? 'text-gray-800 font-medium' : 'text-gray-300 italic text-xs'}>
                                            {form.client.trim() || 'Non renseigné'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Période</p>
                                        {form.date_debut || form.date_fin ? (
                                            <p className="text-gray-800 font-medium">
                                                {fmtDate(form.date_debut) || '?'} → {fmtDate(form.date_fin) || '?'}
                                            </p>
                                        ) : (
                                            <p className="text-gray-300 italic text-xs">Non renseignée</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Périmètre</p>
                                        {form.perimetre.trim() ? (
                                            <p className="text-gray-700 text-xs leading-relaxed line-clamp-2">{form.perimetre}</p>
                                        ) : (
                                            <p className="text-gray-300 italic text-xs">Non renseigné</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                    </svg>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Auditeurs</p>
                                        {selectedUsers.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {selectedUsers.map(u => (
                                                    <span key={u.id} className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full">
                                                        <span className="w-3.5 h-3.5 rounded-full text-[8px] font-bold text-white flex items-center justify-center flex-shrink-0"
                                                            style={{ backgroundColor: 'var(--brand-red)' }}>
                                                            {u.prenom?.[0]}{u.nom?.[0]}
                                                        </span>
                                                        {u.prenom} {u.nom}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-300 italic text-xs">Aucun sélectionné</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Carte info référentiel */}
                        {selectedRef && (
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: isISO ? '#eff6ff' : 'var(--brand-red-light)' }}>
                                        <svg className="w-3.5 h-3.5" style={{ color: isISO ? '#2563eb' : 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-700">{selectedRef.nom}</p>
                                </div>
                                {selectedRef.description && (
                                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{selectedRef.description}</p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isISO ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                        {selectedRef.type}
                                    </span>
                                    {selectedRef.version && (
                                        <span className="text-[10px] text-gray-400">v{selectedRef.version}</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Aide */}
                        {!selectedRef && (
                            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                                <p className="text-xs font-semibold text-blue-700 mb-1">Comment choisir son référentiel ?</p>
                                <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                                    <li><strong>DNSSI</strong> — pour les entités et IIV marocaines soumises à la directive nationale</li>
                                    <li><strong>ISO 27001</strong> — pour une certification internationale SMSI</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default NewAuditPage;
