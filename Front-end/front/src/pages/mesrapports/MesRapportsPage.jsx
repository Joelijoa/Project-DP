import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { getAllAudits, getEvaluations, getSoA, repondreValidationRapport } from '../../services/endpoints/auditService';
import { getPlanActions } from '../../services/endpoints/planActionService';
import { getReferentielById } from '../../services/endpoints/referentielService';
import { exportAuditReportPDF } from '../../utils/exportReportPDF';
import logoDataprotect from '../../assets/images/logoDataprotect.png';

const STATUT_AUDIT = {
    brouillon: { label: 'Brouillon', badge: 'bg-gray-100 text-gray-600' },
    en_cours:  { label: 'En cours',  badge: 'bg-blue-50 text-blue-700' },
    termine:   { label: 'Terminé',   badge: 'bg-green-50 text-green-700' },
    archive:   { label: 'Archivé',   badge: 'bg-amber-50 text-amber-700' },
};

function IconDoc() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function IconEye() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function IconSpin({ size = 'w-5 h-5' }) {
    return (
        <svg className={`${size} animate-spin text-gray-400`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

function IconX() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

// ─── Popup visualisation PDF ─────────────────────────────────────────────────

function RapportPDFModal({ audit, onClose, onValidated }) {
    const [state, setState] = useState('loading'); // 'loading' | 'ready' | 'error'
    const [blobUrl, setBlobUrl] = useState(null);
    const prevUrl = useRef(null);

    // État local de la validation (initialisé depuis audit.validation_rapport)
    const [validStatut, setValidStatut] = useState(audit.validation_rapport?.statut || null);
    const [validating, setValidating] = useState(false);
    const [showModifForm, setShowModifForm] = useState(false);
    const [commentaire, setCommentaire] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function generate() {
            try {
                const [evRes, planRes, soaRes, refRes] = await Promise.all([
                    getEvaluations(audit.id),
                    getPlanActions(audit.id),
                    getSoA(audit.id),
                    getReferentielById(audit.referentiel_id),
                ]);

                if (cancelled) return;

                const url = await exportAuditReportPDF({
                    audit,
                    evaluations: evRes.data.evaluations || [],
                    planActions: planRes.data.plans_actions || [],
                    soaEntries: soaRes.data.soa || [],
                    referentiel: refRes.data.referentiel,
                    logoDataprotectUrl: logoDataprotect,
                    options: { returnBlobUrl: true },
                });

                if (cancelled) { URL.revokeObjectURL(url); return; }

                prevUrl.current = url;
                setBlobUrl(url);
                setState('ready');
            } catch (err) {
                if (!cancelled) {
                    console.error(err);
                    setState('error');
                    toast.error('Erreur lors de la génération du rapport');
                }
            }
        }

        generate();

        return () => {
            cancelled = true;
            if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
        };
    }, [audit]);

    const handleValidation = async (action, comment = '') => {
        setValidating(true);
        try {
            await repondreValidationRapport(audit.id, action, comment);
            const next = action === 'valider' ? 'valide' : 'modification_demandee';
            setValidStatut(next);
            setShowModifForm(false);
            setCommentaire('');
            toast.success(action === 'valider' ? 'Rapport validé avec succès.' : 'Demande de modification envoyée.');
            if (onValidated) onValidated();
        } catch {
            toast.error('Erreur lors de la validation.');
        } finally {
            setValidating(false);
        }
    };

    // Barre de validation — visible seulement si rapport soumis en_attente ou déjà traité
    const renderValidationBar = () => {
        if (validStatut === 'valide') {
            return (
                <div className="flex items-center gap-2 px-5 py-3 flex-shrink-0 border-t border-white/10"
                    style={{ backgroundColor: '#0f2b18' }}>
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-sm font-semibold text-green-400">Rapport validé</span>
                </div>
            );
        }
        if (validStatut === 'modification_demandee') {
            return (
                <div className="flex items-center gap-2 px-5 py-3 flex-shrink-0 border-t border-white/10"
                    style={{ backgroundColor: '#2d1515' }}>
                    <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                    <span className="text-sm font-semibold text-orange-400">Demande de modification envoyée</span>
                </div>
            );
        }
        if (validStatut === 'en_attente') {
            if (showModifForm) {
                return (
                    <div className="px-5 py-3 flex-shrink-0 border-t border-white/10 space-y-2"
                        style={{ backgroundColor: '#1e293b' }}>
                        <textarea
                            rows={2}
                            value={commentaire}
                            onChange={e => setCommentaire(e.target.value)}
                            placeholder="Décrivez les modifications souhaitées…"
                            className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-white/40 resize-none"
                        />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleValidation('demander_modification', commentaire)}
                                disabled={validating || !commentaire.trim()}
                                className="px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50 transition"
                            >
                                {validating ? 'Envoi…' : 'Envoyer la demande'}
                            </button>
                            <button
                                onClick={() => { setShowModifForm(false); setCommentaire(''); }}
                                className="px-3 py-2 text-xs text-gray-400 hover:text-white transition"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                );
            }
            return (
                <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0 border-t border-white/10"
                    style={{ backgroundColor: '#1e293b' }}>
                    <p className="text-xs text-gray-400 flex-1">Ce rapport est soumis à votre validation.</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowModifForm(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-orange-300 border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                            Demander des modifications
                        </button>
                        <button
                            onClick={() => handleValidation('valider')}
                            disabled={validating}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-500 rounded-lg disabled:opacity-50 transition shadow-lg shadow-green-900/30"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {validating ? 'Validation…' : 'Valider le rapport'}
                        </button>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        >
            {/* Barre du haut */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                style={{ backgroundColor: '#1e293b' }}>
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-white">
                        <IconDoc />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{audit.nom}</p>
                        <p className="text-xs text-gray-400 truncate">{audit.client} · {audit.referentiel?.nom}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition flex-shrink-0"
                >
                    <IconX />
                    Fermer
                </button>
            </div>

            {/* Corps — iframe PDF */}
            <div className="flex-1 overflow-hidden">
                {state === 'loading' && (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-white">
                        <IconSpin size="w-8 h-8" />
                        <p className="text-sm text-gray-300">Génération du rapport en cours…</p>
                    </div>
                )}
                {state === 'error' && (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-white">
                        <p className="text-sm text-red-400 font-medium">Impossible de générer le rapport.</p>
                        <button onClick={onClose}
                            className="mt-2 px-4 py-2 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition">
                            Fermer
                        </button>
                    </div>
                )}
                {state === 'ready' && blobUrl && (
                    <iframe
                        src={blobUrl}
                        className="w-full h-full"
                        title={`Rapport — ${audit.nom}`}
                        style={{ border: 'none' }}
                    />
                )}
            </div>

            {/* Barre de validation en bas */}
            {renderValidationBar()}
        </div>
    );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function MesRapportsPage() {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        getAllAudits()
            .then(res => {
                const all = res.data.audits || [];
                const validated = all.filter(a =>
                    a.validation_rapport?.statut === 'accepte' || a.statut === 'termine'
                );
                setAudits(validated);
            })
            .catch(() => toast.error('Erreur lors du chargement des rapports'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = audits.filter(a => {
        if (!search) return true;
        const q = search.toLowerCase();
        return a.nom.toLowerCase().includes(q) || (a.client || '').toLowerCase().includes(q);
    });

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Mes rapports</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Consultez les rapports d'audit vous concernant.
                </p>
            </div>

            {/* Barre de recherche */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[220px]">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Rechercher un rapport…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300"
                        />
                    </div>
                    <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                        {filtered.length} rapport{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-sm text-gray-400">
                        <IconSpin /> Chargement…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                            <IconDoc />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Aucun rapport disponible</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {search
                                ? 'Aucun résultat pour cette recherche.'
                                : "Vos rapports d'audit apparaîtront ici une fois les audits terminés."}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rapport</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Référentiel</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Période</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(audit => {
                                const st = STATUT_AUDIT[audit.statut] || STATUT_AUDIT.brouillon;
                                return (
                                    <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <p className="font-medium text-gray-900">{audit.nom}</p>
                                            {audit.client && (
                                                <p className="text-xs text-gray-400 mt-0.5">{audit.client}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-500 text-xs">
                                            {audit.referentiel?.nom || '—'}
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-500 text-xs">
                                            {audit.date_debut
                                                ? `${new Date(audit.date_debut).toLocaleDateString('fr-FR')} → ${audit.date_fin ? new Date(audit.date_fin).toLocaleDateString('fr-FR') : '…'}`
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.badge}`}>
                                                {st.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button
                                                onClick={() => setSelected(audit)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                            >
                                                <IconEye />
                                                Voir le rapport
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {selected && (
                <RapportPDFModal
                    audit={selected}
                    onClose={() => setSelected(null)}
                    onValidated={() => {
                        // Rafraîchir le statut de validation dans la liste
                        getAllAudits().then(res => {
                            const all = res.data.audits || [];
                            setAudits(all.filter(a =>
                                a.validation_rapport?.statut === 'accepte' || a.statut === 'termine'
                            ));
                        }).catch(() => {});
                    }}
                />
            )}
        </div>
    );
}
