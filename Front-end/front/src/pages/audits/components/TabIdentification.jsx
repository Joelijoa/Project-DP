import { useState } from 'react';
import { fmtISODate } from './auditHelpers';
import { TabInfo } from './AuditBadges';
import DateInput from '../../../components/common/DateInput';

const TabIdentification = ({ identification, setIdentification, onSave, saving, isISO, readOnly }) => {
    const isEmpty = !Object.values(identification).some(v => v && String(v).trim());
    const [editing, setEditing] = useState(!readOnly && isEmpty);
    const set = (k, v) => setIdentification(prev => ({ ...prev, [k]: v }));

    const handleSave = () => {
        onSave();
        setEditing(false);
    };

    const infoText = isISO
        ? "Renseignez les informations relatives à l'organisme audité, à son RSSI et à l'auteur de l'évaluation ISO 27001."
        : "L'objectif de cette feuille est de renseigner la dénomination de l'entité ou de l'IIV, son adresse ainsi que les informations relatives au RSSI et à l'auteur de l'évaluation.";
    const sectionTitle = isISO ? "2. Identification de l'organisme" : "1. Identification de l'entité ou de l'IIV";
    const genLabel = isISO ? "Informations de l'organisme" : "Informations générales";

    // ── Vue carte (après remplissage) ─────────────────────────────────────────
    if (!editing) {
        const InfoRow = ({ label, value }) => !value ? null : (
            <div>
                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                <dd className="text-sm text-gray-800 mt-0.5">{value}</dd>
            </div>
        );
        return (
            <div className="space-y-5">
                <TabInfo text={infoText} />
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-semibold text-gray-800">{sectionTitle}</h2>
                        {!readOnly && (
                            <button
                                onClick={() => setEditing(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                </svg>
                                Modifier
                            </button>
                        )}
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">{genLabel}</h3>
                            <dl className="grid grid-cols-2 gap-3">
                                <InfoRow label="Dénomination" value={identification.denomination} />
                                <InfoRow label="Département" value={identification.departement} />
                                <InfoRow label="Adresse" value={identification.adresse} />
                                <InfoRow label="Ville" value={identification.ville} />
                                <InfoRow label="Site web" value={identification.site_web} />
                            </dl>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">RSSI</h3>
                            <dl className="grid grid-cols-2 gap-3">
                                <InfoRow label="Nom et Prénom" value={identification.rssi_nom_prenom} />
                                <InfoRow label="Rattachement" value={identification.rssi_rattachement} />
                                <InfoRow label="E-mail" value={identification.rssi_email} />
                                <InfoRow label="Téléphone" value={identification.rssi_telephone} />
                            </dl>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Gestion du document</h3>
                            <dl className="grid grid-cols-2 gap-3">
                                <InfoRow label="Auteur de l'évaluation" value={identification.auteur_evaluation} />
                                <InfoRow label="Date de l'évaluation" value={identification.date_evaluation ? fmtISODate(identification.date_evaluation) : null} />
                                <InfoRow label="Validé par" value={identification.valide_par} />
                                <InfoRow label="Date de validation" value={identification.date_validation ? fmtISODate(identification.date_validation) : null} />
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Formulaire d'édition ──────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            <TabInfo text={infoText} />
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold text-gray-800">{sectionTitle}</h2>
                    {!isEmpty && (
                        <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700 underline">Annuler</button>
                    )}
                </div>

                {/* Informations générales */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">{genLabel}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { key: 'denomination', label: 'Dénomination' },
                            { key: 'departement', label: "Département d'appartenance" },
                            { key: 'adresse', label: 'Adresse' },
                            { key: 'ville', label: 'Ville' },
                            { key: 'site_web', label: 'Adresse du site web' },
                        ].map(({ key, label }) => (
                            <div key={key} className={key === 'adresse' ? 'col-span-2' : ''}>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                                <input
                                    type="text"
                                    value={identification[key] || ''}
                                    onChange={e => set(key, e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* RSSI */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Responsable de la Sécurité des SI (RSSI)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { key: 'rssi_nom_prenom', label: 'Nom et Prénom' },
                            { key: 'rssi_rattachement', label: 'Rattachement' },
                            { key: 'rssi_email', label: 'E-mail', type: 'email' },
                            { key: 'rssi_telephone', label: 'Téléphone', type: 'tel' },
                        ].map(({ key, label, type = 'text' }) => (
                            <div key={key}>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                                <input
                                    type={type}
                                    value={identification[key] || ''}
                                    onChange={e => set(key, e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gestion du document */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">Gestion du document</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { key: 'auteur_evaluation', label: "Auteur de l'évaluation", isDate: false },
                            { key: 'date_evaluation', label: "Date de l'évaluation", isDate: true },
                            { key: 'valide_par', label: 'Validé par', isDate: false },
                            { key: 'date_validation', label: 'Date de validation', isDate: true },
                        ].map(({ key, label, isDate }) => (
                            <div key={key}>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    {label}
                                    {isDate && <span className="ml-1 text-gray-400 font-normal">(jj/mm/aaaa)</span>}
                                </label>
                                {isDate ? (
                                    <DateInput
                                        value={identification[key] || ''}
                                        onChange={v => set(key, v)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={identification[key] || ''}
                                        onChange={e => set(key, e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                                        style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl transition disabled:opacity-60"
                        style={{ backgroundColor: 'var(--brand-red)' }}
                    >
                        {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TabIdentification;
