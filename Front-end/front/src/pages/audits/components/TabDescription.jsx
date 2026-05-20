import { useState, useEffect } from 'react';
import { NIVEAUX } from './auditConstants';
import { fmtISODate } from './auditHelpers';

const NIVEAU_COLORS = {
    '-2': { bar: '#9ca3af', light: '#f9fafb' },
    0:    { bar: '#dc2626', light: '#fef2f2' },
    1:    { bar: '#f97316', light: '#fff7ed' },
    2:    { bar: '#eab308', light: '#fefce8' },
    3:    { bar: '#3b82f6', light: '#eff6ff' },
    4:    { bar: '#6366f1', light: '#eef2ff' },
    5:    { bar: '#16a34a', light: '#f0fdf4' },
};
const NIVEL_COLOR = (v) => NIVEAU_COLORS[String(v)] ?? { bar: '#9ca3af', light: '#f9fafb' };

const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{icon}</svg>
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
            <p className="text-sm text-gray-800 mt-0.5">{value || '—'}</p>
        </div>
    </div>
);

const TabDescription = ({ audit, identification, isISO, onSave, saving, readOnly }) => {
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

            {/* ── Description de l'outil ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
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
                <div className="text-sm text-gray-600 space-y-2 leading-relaxed">
                    {isISO ? (
                        <p>
                            Cet outil permet d'évaluer le niveau de conformité d'un organisme par rapport aux exigences de la norme{' '}
                            <strong className="font-semibold text-gray-800">ISO/IEC 27001:2022</strong>{' '}
                            (Sécurité de l'information, cybersécurité et protection de la vie privée). L'évaluation porte sur les contrôles de l'
                            <strong className="font-semibold text-gray-800">Annexe A</strong>{' '}
                            classés en 4 thèmes : Organisationnel (A.5), Personnes (A.6), Physique (A.7) et Technologique (A.8).
                        </p>
                    ) : (
                        <>
                            <p>
                                Dans le cadre de l'implémentation de la DNSSI au sein des entités et des infrastructures d'importance vitale (IIV)
                                concernées par ses dispositions, la <strong className="font-semibold text-gray-800">DGSSI</strong> a réalisé cet outil
                                dans l'objectif d'évaluer la conformité des entités et des IIV par rapport à la DNSSI et d'assurer un suivi pour
                                l'état de mise en œuvre des règles de sécurité.
                            </p>
                            <p>L'évaluation se fait mesure par mesure selon une échelle de maturité à 6 niveaux (de 0 à 5) inspirée du modèle CMMI :</p>
                        </>
                    )}
                </div>

                {/* Grille CMMI (DNSSI seulement) */}
                {!isISO && (
                    <div className="mt-4 flex gap-2">
                        {NIVEAUX.filter(n => n.value !== -2).map(n => {
                            const c = NIVEL_COLOR(n.value);
                            return (
                                <div key={n.value} className="flex-1 rounded-xl p-3 text-center" style={{ backgroundColor: c.light, border: `1px solid ${c.bar}25` }}>
                                    <p className="text-2xl font-black mb-1" style={{ color: c.bar }}>{n.value}</p>
                                    <p className="text-[10px] font-semibold text-gray-600 leading-tight">{n.label}</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Thèmes Annexe A (ISO seulement) */}
                {isISO && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        {[
                            { code: 'A.5', label: 'Contrôles organisationnels', count: '37 contrôles', color: '#6366f1' },
                            { code: 'A.6', label: 'Contrôles liés aux personnes', count: '8 contrôles', color: '#3b82f6' },
                            { code: 'A.7', label: 'Contrôles physiques', count: '14 contrôles', color: '#f97316' },
                            { code: 'A.8', label: 'Contrôles technologiques', count: '34 contrôles', color: '#16a34a' },
                        ].map(t => (
                            <div key={t.code} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <span className="text-xs font-bold text-white px-2 py-1 rounded-lg flex-shrink-0" style={{ backgroundColor: t.color }}>{t.code}</span>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">{t.label}</p>
                                    <p className="text-xs text-gray-400">{t.count}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Informations de l'audit ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-gray-800">Informations de l'audit</h3>
                    {!editing && !readOnly && (
                        <button
                            onClick={() => setEditing(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition"
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
                                    <input type="text" value={form[key]} onChange={e => setF(key, e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                                </div>
                            ))}
                            {[
                                { key: 'date_debut', label: 'Date de début' },
                                { key: 'date_fin', label: 'Date de fin prévue' },
                            ].map(({ key, label }) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                                    <input type="date" value={form[key]} onChange={e => setF(key, e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Annuler</button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60"
                                style={{ backgroundColor: 'var(--brand-red)' }}>
                                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                Enregistrer
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow
                                label="Client / Entité"
                                value={audit.client}
                                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />}
                            />
                            <InfoRow
                                label="Créé par"
                                value={audit.createur ? `${audit.createur.prenom} ${audit.createur.nom}` : '—'}
                                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />}
                            />
                            <InfoRow
                                label="Date de début"
                                value={fmtISODate(audit.date_debut)}
                                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />}
                            />
                            <InfoRow
                                label="Date de fin prévue"
                                value={fmtISODate(audit.date_fin)}
                                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />}
                            />
                        </div>

                        {audit.auditeurs?.length > 0 && (
                            <div className="pt-3 border-t border-gray-50">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Équipe d'audit</p>
                                <div className="flex flex-wrap gap-2">
                                    {audit.auditeurs.map(u => (
                                        <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600">
                                                {u.prenom?.[0]}{u.nom?.[0]}
                                            </div>
                                            <span className="text-xs text-gray-700">{u.prenom} {u.nom}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(identification?.perimetre_physique || identification?.perimetre_logique || identification?.perimetre_organisationnel) && (
                            <div className="pt-3 border-t border-gray-50 space-y-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Périmètre (depuis le cadrage)</p>
                                {[
                                    { label: 'Physique', value: identification.perimetre_physique },
                                    { label: 'Logique', value: identification.perimetre_logique },
                                    { label: 'Organisationnel', value: identification.perimetre_organisationnel },
                                ].filter(r => r.value).map(({ label, value }) => (
                                    <div key={label} className="flex gap-2">
                                        <span className="text-[10px] font-semibold text-gray-400 w-24 flex-shrink-0 mt-0.5">{label}</span>
                                        <p className="text-sm text-gray-700 whitespace-pre-line">{value}</p>
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
