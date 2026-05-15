import { useState } from 'react';
import { TYPE_AUDIT_OPTIONS } from './auditConstants';
import { fmtISODate } from './auditHelpers';
import DateInput from '../../../components/common/DateInput';

const TabCadrageComplet = ({ audit, referentiel, identification, setIdentification, onSave, saving, isISO, readOnly }) => {
    const hasData = !!(identification.type_audit || identification.perimetre_physique || identification.denomination);
    const [editing, setEditing] = useState(!readOnly && !hasData);
    const set = (k, v) => setIdentification(prev => ({ ...prev, [k]: v }));

    const typeLabel = TYPE_AUDIT_OPTIONS.find(t => t.value === identification.type_audit)?.label;
    const entityLabel = isISO ? "Identification de l'organisme" : "Identification de l'entité";
    const handleSave = () => { onSave(); setEditing(false); };

    const SH = ({ children }) => (
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">{children}</h3>
    );
    const InfoRow = ({ label, value }) => !value ? null : (
        <div>
            <dt className="text-xs font-medium text-gray-500">{label}</dt>
            <dd className="text-sm text-gray-800 mt-0.5">{value}</dd>
        </div>
    );
    const Field = ({ label, fieldKey, type = 'text', span = false }) => (
        <div className={span ? 'col-span-2' : ''}>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
            <input type={type} value={identification[fieldKey] || ''} onChange={e => set(fieldKey, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
        </div>
    );

    if (!editing) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-800">Cadrage de l'audit</h2>
                    {!readOnly && (
                        <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                            Modifier
                        </button>
                    )}
                </div>

                <div>
                    <SH>Informations de l'audit</SH>
                    <dl className="grid grid-cols-2 gap-3">
                        <InfoRow label="Nom de l'audit" value={audit.nom} />
                        <InfoRow label="Client" value={audit.client} />
                        <InfoRow label="Référentiel" value={referentiel?.nom} />
                        <InfoRow label="Type d'audit" value={typeLabel || '—'} />
                        <InfoRow label="Date de début" value={audit.date_debut} />
                        <InfoRow label="Date de fin" value={audit.date_fin} />
                    </dl>
                </div>

                <div>
                    <SH>Périmètre</SH>
                    {(identification.perimetre_physique || identification.perimetre_logique || identification.perimetre_organisationnel) ? (
                        <dl className="space-y-3">
                            <InfoRow label="Périmètre physique" value={identification.perimetre_physique} />
                            <InfoRow label="Périmètre logique" value={identification.perimetre_logique} />
                            <InfoRow label="Périmètre organisationnel" value={identification.perimetre_organisationnel} />
                        </dl>
                    ) : <p className="text-xs text-gray-400 italic">Périmètre non encore défini.</p>}
                </div>

                <div className="border-t border-gray-100" />

                <div>
                    <SH>{entityLabel}</SH>
                    {(identification.denomination || identification.departement || identification.adresse) ? (
                        <dl className="grid grid-cols-2 gap-3">
                            {identification.denomination && identification.denomination !== audit.client && (
                                <InfoRow label="Dénomination" value={identification.denomination} />
                            )}
                            <InfoRow label="Département" value={identification.departement} />
                            <InfoRow label="Adresse" value={identification.adresse} />
                            <InfoRow label="Ville" value={identification.ville} />
                            <InfoRow label="Site web" value={identification.site_web} />
                        </dl>
                    ) : <p className="text-xs text-gray-400 italic">Non encore renseigné.</p>}
                </div>

                {(identification.rssi_nom_prenom || identification.rssi_email) && (
                    <div>
                        <SH>RSSI</SH>
                        <dl className="grid grid-cols-2 gap-3">
                            <InfoRow label="Nom et Prénom" value={identification.rssi_nom_prenom} />
                            <InfoRow label="Rattachement" value={identification.rssi_rattachement} />
                            <InfoRow label="E-mail" value={identification.rssi_email} />
                            <InfoRow label="Téléphone" value={identification.rssi_telephone} />
                        </dl>
                    </div>
                )}

                {(identification.auteur_evaluation || identification.valide_par) && (
                    <div>
                        <SH>Gestion du document</SH>
                        <dl className="grid grid-cols-2 gap-3">
                            <InfoRow label="Auteur de l'évaluation" value={identification.auteur_evaluation} />
                            <InfoRow label="Date de l'évaluation" value={identification.date_evaluation ? fmtISODate(identification.date_evaluation) : null} />
                            <InfoRow label="Validé par" value={identification.valide_par} />
                            <InfoRow label="Date de validation" value={identification.date_validation ? fmtISODate(identification.date_validation) : null} />
                        </dl>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Cadrage de l'audit</h2>
                {hasData && <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700 underline">Annuler</button>}
            </div>

            {/* Infos audit (lecture seule) */}
            <div>
                <SH>Informations de l'audit</SH>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs font-medium text-gray-500">Nom</dt><dd className="text-gray-800 mt-0.5">{audit.nom}</dd></div>
                    <div><dt className="text-xs font-medium text-gray-500">Client</dt><dd className="text-gray-800 mt-0.5">{audit.client}</dd></div>
                    <div><dt className="text-xs font-medium text-gray-500">Référentiel</dt><dd className="text-gray-800 mt-0.5">{referentiel?.nom || '—'}</dd></div>
                    <div><dt className="text-xs font-medium text-gray-500">Dates</dt><dd className="text-gray-800 mt-0.5">{audit.date_debut || '—'} → {audit.date_fin || '—'}</dd></div>
                </dl>
            </div>

            {/* Type d'audit */}
            <div>
                <SH>Type d'audit</SH>
                <div className="grid grid-cols-3 gap-3">
                    {TYPE_AUDIT_OPTIONS.map(opt => (
                        <button key={opt.value} type="button" onClick={() => set('type_audit', opt.value)}
                            className={`px-4 py-3 rounded-lg border text-sm font-medium transition text-left ${identification.type_audit === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Périmètre */}
            <div>
                <SH>Périmètre</SH>
                <div className="space-y-4">
                    {[
                        { key: 'perimetre_physique', label: 'Physique', placeholder: 'Sites, bâtiments, équipements physiques concernés…' },
                        { key: 'perimetre_logique', label: 'Logique', placeholder: 'Systèmes, réseaux, applications, bases de données…' },
                        { key: 'perimetre_organisationnel', label: 'Organisationnel', placeholder: 'Entités, directions, processus métier concernés…' },
                    ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                            <textarea rows={2} value={identification[key] || ''} onChange={e => set(key, e.target.value)}
                                placeholder={placeholder}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 resize-none"
                                style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Identification entité */}
            <div>
                <SH>{entityLabel}</SH>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Dénomination" fieldKey="denomination" />
                    <Field label="Département d'appartenance" fieldKey="departement" />
                    <Field label="Adresse" fieldKey="adresse" span />
                    <Field label="Ville" fieldKey="ville" />
                    <Field label="Site web" fieldKey="site_web" />
                </div>
            </div>

            {/* RSSI */}
            <div>
                <SH>Responsable de la Sécurité des SI (RSSI)</SH>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Nom et Prénom" fieldKey="rssi_nom_prenom" />
                    <Field label="Rattachement" fieldKey="rssi_rattachement" />
                    <Field label="E-mail" fieldKey="rssi_email" type="email" />
                    <Field label="Téléphone" fieldKey="rssi_telephone" type="tel" />
                </div>
            </div>

            {/* Gestion du document */}
            <div>
                <SH>Gestion du document</SH>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { key: 'auteur_evaluation', label: "Auteur de l'évaluation", isDate: false },
                        { key: 'date_evaluation', label: "Date de l'évaluation", isDate: true },
                        { key: 'valide_par', label: 'Validé par', isDate: false },
                        { key: 'date_validation', label: 'Date de validation', isDate: true },
                    ].map(({ key, label, isDate }) => (
                        <div key={key}>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                {label}{isDate && <span className="ml-1 text-gray-400 font-normal">(jj/mm/aaaa)</span>}
                            </label>
                            {isDate ? (
                                <DateInput value={identification[key] || ''} onChange={v => set(key, v)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                            ) : (
                                <input type="text" value={identification[key] || ''} onChange={e => set(key, e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                                    style={{ color: '#111827', '--tw-ring-color': 'var(--brand-red)' }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-1">
                <button onClick={handleSave} disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--brand-red)' }}>
                    {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
            </div>
        </div>
    );
};

export default TabCadrageComplet;
