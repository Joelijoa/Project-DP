import { useState } from 'react';

const ValidationClientCard = ({ type, validation, isSeniorOrAdmin, isClient, onAction, loading, planningData }) => {
    const [commentaire, setCommentaire] = useState('');
    const [showModifForm, setShowModifForm] = useState(false);

    const titles = { planning: "Validation du planning par le client", rapport: "Validation du rapport final par le client" };
    const submitLabels = { planning: "Soumettre le planning au client", rapport: "Soumettre le rapport au client" };

    const statusConfig = {
        en_attente: { label: 'En attente de validation client', color: 'text-orange-700 bg-orange-50 border-orange-200' },
        valide: { label: 'Validé par le client', color: 'text-green-700 bg-green-50 border-green-200' },
        modification_demandee: { label: 'Modification demandée', color: 'text-red-700 bg-red-50 border-red-200' },
    };

    const statut = validation?.statut;
    const cfg = statut ? statusConfig[statut] : null;

    /* Résumé du planning pour le type "planning" */
    const PlanningResume = () => {
        if (type !== 'planning' || !planningData) return null;
        const etapes = planningData.etapes || [];
        const sessions = planningData.sessions || [];
        const nbEtapes = etapes.length;
        const nbJournees = sessions.length;
        const nbEntretiens = sessions.reduce((acc, s) => acc + (s.entretiens || []).length, 0);
        const hasCalendrier = nbEtapes > 0;
        const hasProgramme = nbJournees > 0;

        return (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ce planning comprend</p>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                        {hasCalendrier
                            ? <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><svg className="w-2.5 h-2.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></span>
                            : <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /></span>
                        }
                        <span className="text-xs text-gray-700">
                            Calendrier prévisionnel
                            {hasCalendrier && <span className="ml-1 text-gray-400">— {nbEtapes} phase{nbEtapes > 1 ? 's' : ''}</span>}
                            {!hasCalendrier && <span className="ml-1 text-gray-400 italic">non défini</span>}
                        </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        {hasProgramme
                            ? <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><svg className="w-2.5 h-2.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></span>
                            : <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /></span>
                        }
                        <span className="text-xs text-gray-700">
                            Programme des entretiens
                            {hasProgramme && <span className="ml-1 text-gray-400">— {nbJournees} journée{nbJournees > 1 ? 's' : ''} · {nbEntretiens} entretien{nbEntretiens > 1 ? 's' : ''}</span>}
                            {!hasProgramme && <span className="ml-1 text-gray-400 italic">non défini</span>}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">{titles[type]}</h3>

            <PlanningResume />

            {/* Pas encore soumis */}
            {!validation && isSeniorOrAdmin && (
                <button
                    onClick={() => onAction(type, 'soumettre')}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--brand-red)' }}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                    {loading ? 'Envoi…' : submitLabels[type]}
                </button>
            )}
            {!validation && !isSeniorOrAdmin && (
                <p className="text-xs text-gray-400 italic">Non encore soumis au client.</p>
            )}

            {/* Badge statut */}
            {cfg && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${cfg.color}`}>
                    <span>{cfg.label}</span>
                    {validation.date && <span className="ml-auto opacity-70">{new Date(validation.date).toLocaleDateString('fr-FR')}</span>}
                </div>
            )}

            {/* Commentaire modification demandée */}
            {statut === 'modification_demandee' && validation.commentaire && (
                <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                    <span className="font-medium">Motif : </span>{validation.commentaire}
                </div>
            )}

            {/* Client peut répondre si en_attente */}
            {statut === 'en_attente' && isClient && (
                <div className="flex flex-col gap-3">
                    {!showModifForm ? (
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => onAction(type, 'valider')}
                                disabled={loading}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                {loading ? 'Envoi…' : 'Valider le planning'}
                            </button>
                            <button
                                onClick={() => setShowModifForm(true)}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-orange-200 text-orange-600 bg-orange-50 text-sm font-medium hover:bg-orange-100 hover:border-orange-300 transition"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                                Demander des modifications
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                rows={3}
                                value={commentaire}
                                onChange={e => setCommentaire(e.target.value)}
                                placeholder="Décrivez les modifications souhaitées…"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 resize-none"
                                style={{ color: '#111827' }}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { onAction(type, 'demander_modification', commentaire); setShowModifForm(false); setCommentaire(''); }}
                                    disabled={loading || !commentaire.trim()}
                                    className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition"
                                >
                                    {loading ? 'Envoi…' : 'Envoyer la demande'}
                                </button>
                                <button onClick={() => setShowModifForm(false)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Annuler</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Senior/admin : actions secondaires (resoumettre + annuler) */}
            {isSeniorOrAdmin && validation && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                    {statut === 'modification_demandee' && (
                        <button
                            onClick={() => onAction(type, 'soumettre')}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                            {loading ? 'Envoi…' : 'Resoumettre au client'}
                        </button>
                    )}
                    {statut !== 'valide' && (
                        <button
                            onClick={() => onAction(type, 'annuler')}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            Annuler la validation
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ValidationClientCard;
