import { SECTEURS, inputCls } from './entiteConfig';

const InputField = ({ label, required, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const EntiteFormModal = ({ form, setF, editingId, submitting, onSubmit, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">
                        {editingId ? "Modifier l'entité" : 'Nouvelle entité auditée'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {editingId ? 'Mettez à jour les informations.' : 'Remplissez les informations de base.'}
                    </p>
                </div>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Nom de l'entité" required>
                        <input type="text" required value={form.nom}
                            onChange={e => setF('nom', e.target.value)}
                            placeholder="Ex : Ministère de la Santé"
                            className={inputCls} />
                    </InputField>
                    <InputField label="Secteur">
                        <select value={form.secteur} onChange={e => setF('secteur', e.target.value)} className={inputCls}>
                            <option value="">— Sélectionner —</option>
                            {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </InputField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <InputField label="Adresse">
                            <input type="text" value={form.adresse}
                                onChange={e => setF('adresse', e.target.value)}
                                placeholder="Adresse complète"
                                className={inputCls} />
                        </InputField>
                    </div>
                    <InputField label="Ville">
                        <input type="text" value={form.ville}
                            onChange={e => setF('ville', e.target.value)}
                            placeholder="Ex : Rabat"
                            className={inputCls} />
                    </InputField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <InputField label="Description">
                    <textarea value={form.description} onChange={e => setF('description', e.target.value)}
                        rows={2} placeholder="Description ou notes sur l'entité..."
                        className={`${inputCls} resize-none`} />
                </InputField>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button type="submit" disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-red)' }}>
                        {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {editingId ? 'Enregistrer les modifications' : "Créer l'entité"}
                    </button>
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    </div>
);

export default EntiteFormModal;
