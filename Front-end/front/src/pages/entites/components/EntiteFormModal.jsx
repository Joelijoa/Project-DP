import { SECTEURS, inputCls } from './entiteConfig';
import AppSelect from '../../../components/common/AppSelect';

const InputField = ({ label, required, children }) => (
    <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const ColTitle = ({ children }) => (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">{children}</p>
);

const EntiteFormModal = ({ form, setF, editingId, submitting, onSubmit, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--brand-red-light)' }}>
                        <svg className="w-4 h-4" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">
                            {editingId ? "Modifier l'entité" : 'Nouvelle entité auditée'}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {editingId ? 'Mettez à jour les informations.' : 'Remplissez les informations de base.'}
                        </p>
                    </div>
                </div>
                <button onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={onSubmit}>
                {/* Corps — 2 colonnes */}
                <div className="grid grid-cols-2 divide-x divide-gray-100">

                    {/* Colonne gauche — Identité */}
                    <div className="px-6 py-5 space-y-4">
                        <ColTitle>Identité</ColTitle>
                        <InputField label="Nom de l'entité" required>
                            <input type="text" required value={form.nom}
                                onChange={e => setF('nom', e.target.value)}
                                placeholder="Ex : Ministère de la Santé"
                                className={inputCls} />
                        </InputField>
                        <InputField label="Secteur d'activité">
                            <AppSelect
                                value={form.secteur}
                                onChange={v => setF('secteur', v)}
                                options={[{ value: '', label: '— Sélectionner —' }, ...SECTEURS.map(s => ({ value: s, label: s }))]}
                            />
                        </InputField>
                        <InputField label="Description">
                            <textarea value={form.description} onChange={e => setF('description', e.target.value)}
                                rows={4} placeholder="Notes ou description sur l'entité..."
                                className={`${inputCls} resize-none`} />
                        </InputField>
                    </div>

                    {/* Colonne droite — Localisation + Contact */}
                    <div className="px-6 py-5 space-y-4">
                        <ColTitle>Localisation & Contact</ColTitle>
                        <InputField label="Adresse">
                            <input type="text" value={form.adresse}
                                onChange={e => setF('adresse', e.target.value)}
                                placeholder="Adresse complète"
                                className={inputCls} />
                        </InputField>
                        <div className="grid grid-cols-2 gap-3">
                            <InputField label="Ville">
                                <input type="text" value={form.ville}
                                    onChange={e => setF('ville', e.target.value)}
                                    placeholder="Ex : Rabat"
                                    className={inputCls} />
                            </InputField>
                            <InputField label="Pays">
                                <input type="text" value={form.pays}
                                    onChange={e => setF('pays', e.target.value)}
                                    placeholder="Ex : Maroc"
                                    className={inputCls} />
                            </InputField>
                        </div>
                        <InputField label="Téléphone">
                            <input type="text" value={form.telephone}
                                onChange={e => setF('telephone', e.target.value)}
                                placeholder="+212 5 37 00 00 00"
                                className={inputCls} />
                        </InputField>
                        <InputField label="Email">
                            <input type="email" value={form.email}
                                onChange={e => setF('email', e.target.value)}
                                placeholder="contact@entite.ma"
                                className={inputCls} />
                        </InputField>
                        <InputField label="Site web">
                            <input type="text" value={form.site_web}
                                onChange={e => setF('site_web', e.target.value)}
                                placeholder="https://..."
                                className={inputCls} />
                        </InputField>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
                    <button type="submit" disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        {submitting
                            ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        }
                        {editingId ? 'Enregistrer' : "Créer l'entité"}
                    </button>
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    </div>
);

export default EntiteFormModal;
