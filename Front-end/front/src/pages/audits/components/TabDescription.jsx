import { useState, useEffect } from 'react';
import { NIVEAUX, STATUT_CONFIG } from './auditConstants';
import { fmtISODate } from './auditHelpers';
import { TabInfo } from './AuditBadges';

const TabDescription = ({ audit, identification, totalMesures, totalEvaluated, tauxGlobal, isISO, onSave, saving, readOnly }) => {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        nom: audit.nom || '',
        client: audit.client || '',
        perimetre: audit.perimetre || '',
        date_debut: audit.date_debut?.split('T')[0] || '',
        date_fin: audit.date_fin?.split('T')[0] || '',
    });

    useEffect(() => {
        if (!editing) {
            setForm({
                nom: audit.nom || '',
                client: audit.client || '',
                perimetre: audit.perimetre || '',
                date_debut: audit.date_debut?.split('T')[0] || '',
                date_fin: audit.date_fin?.split('T')[0] || '',
            });
        }
    }, [audit, editing]);

    const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSave = async () => {
        await onSave(form);
        setEditing(false);
    };

    return (
        <div className="space-y-5">
            {/* Description statique */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--brand-red-light)' }}>
                        <svg className="w-4 h-4" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                    </div>
                    <h2 className="text-sm font-semibold text-gray-800">
                        {isISO ? "Description de l'audit ISO 27001:2022" : "Description de l'outil d'évaluation"}
                    </h2>
                </div>
                <div className="prose prose-sm max-w-none text-gray-600 space-y-2">
                    {isISO ? (
                        <p>
                            Cet outil permet d'évaluer le niveau de conformité d'un organisme par rapport aux exigences de la norme <strong>ISO/IEC 27001:2022</strong> (Sécurité de l'information, cybersécurité et protection de la vie privée). L'évaluation porte sur les contrôles de l'<strong>Annexe A</strong> classés en 4 thèmes : Organisationnel (A.5), Personnes (A.6), Physique (A.7) et Technologique (A.8).
                        </p>
                    ) : (
                        <>
                            <p>
                                Dans le cadre de l'implémentation de la DNSSI au sein des entités et des infrastructures d'importance vitale (IIV) concernées par ses dispositions, la <strong>DGSSI</strong> a réalisé cet outil dans l'objectif d'évaluer la conformité des entités et des IIV par rapport à la DNSSI et d'assurer un suivi pour l'état de mise en œuvre des règles de sécurité.
                            </p>
                            <p>L'évaluation se fait mesure par mesure selon une échelle de maturité à 6 niveaux (de 0 à 5) inspirée du modèle CMMI :</p>
                        </>
                    )}
                </div>
                {!isISO && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {NIVEAUX.filter(n => n.value !== null).map(n => (
                            <div key={n.value} className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <p className={`text-2xl font-bold ${n.color}`}>{n.value}</p>
                                <p className="text-xs text-gray-600 mt-1 font-medium">{n.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Référentiel', value: audit.referentiel?.type ?? '—', sub: audit.referentiel?.nom },
                    { label: 'Mesures évaluées', value: `${totalEvaluated} / ${totalMesures}`, sub: 'sur le référentiel' },
                    { label: 'Taux de conformité', value: `${tauxGlobal}%`, sub: 'global pondéré', accent: true },
                    { label: 'Statut', value: STATUT_CONFIG[audit.statut]?.label ?? '—', sub: audit.perimetre || 'Aucun périmètre défini' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4" style={s.accent ? { borderTopWidth: '3px', borderTopColor: 'var(--brand-red)' } : {}}>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
                        <p className="text-2xl font-bold mt-1" style={s.accent ? { color: 'var(--brand-red)' } : { color: '#111827' }}>{s.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Informations de l'audit — vue ou édition */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-800">Informations de l'audit</h3>
                    {!editing && !readOnly && (
                        <button
                            onClick={() => setEditing(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                            Modifier
                        </button>
                    )}
                </div>

                {editing && !readOnly ? (
                    <div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {[
                                { key: 'nom', label: "Nom de l'audit" },
                                { key: 'client', label: 'Client / Entité' },
                                { key: 'perimetre', label: 'Périmètre', span: true },
                            ].map(({ key, label, span }) => (
                                <div key={key} className={span ? 'col-span-2' : ''}>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                                    <input
                                        type="text"
                                        value={form[key]}
                                        onChange={e => setF(key, e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                    />
                                </div>
                            ))}
                            {[
                                { key: 'date_debut', label: 'Date de début' },
                                { key: 'date_fin', label: 'Date de fin prévue' },
                            ].map(({ key, label }) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                                    <input
                                        type="date"
                                        value={form[key]}
                                        onChange={e => setF(key, e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                                Annuler
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                Enregistrer
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                            {[
                                { label: 'Client / Entité', value: audit.client || '—' },
                                { label: 'Date de début', value: fmtISODate(audit.date_debut) },
                                { label: 'Date de fin prévue', value: fmtISODate(audit.date_fin) },
                                { label: 'Créé par', value: audit.createur ? `${audit.createur.prenom} ${audit.createur.nom}` : '—' },
                                { label: 'Auditeurs', value: audit.auditeurs?.length > 0 ? audit.auditeurs.map(u => `${u.prenom} ${u.nom}`).join(', ') : '—' },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <dt className="text-xs font-medium text-gray-500">{label}</dt>
                                    <dd className="text-gray-800 mt-0.5">{value}</dd>
                                </div>
                            ))}
                        </dl>
                        {(identification?.perimetre_physique || identification?.perimetre_logique || identification?.perimetre_organisationnel) && (
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Périmètre (depuis le cadrage)</p>
                                {[
                                    { label: 'Physique', value: identification.perimetre_physique },
                                    { label: 'Logique', value: identification.perimetre_logique },
                                    { label: 'Organisationnel', value: identification.perimetre_organisationnel },
                                ].filter(r => r.value).map(({ label, value }) => (
                                    <div key={label}>
                                        <dt className="text-xs font-medium text-gray-500">{label}</dt>
                                        <dd className="text-sm text-gray-800 mt-0.5 whitespace-pre-line">{value}</dd>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TabDescription;
