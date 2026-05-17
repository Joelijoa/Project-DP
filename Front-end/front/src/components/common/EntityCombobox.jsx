import { useEffect, useRef, useState } from 'react';

/**
 * Combobox pour choisir une entité existante ou en créer une nouvelle.
 * Props:
 *   value        — texte affiché dans l'input
 *   onChange     — ({ nom, id }) — id=null si nouvelle entité
 *   entities     — [{ id, nom }] — liste chargée par le parent
 *   error        — message d'erreur
 *   placeholder
 */
const EntityCombobox = ({ value = '', onChange, entities = [], error, placeholder = 'Ex : Ministère des Finances' }) => {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState(value);
    const containerRef      = useRef(null);
    const inputRef          = useRef(null);

    // Sync query when value changes externally
    useEffect(() => { setQuery(value); }, [value]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = query.trim().length === 0
        ? entities
        : entities.filter(e => e.nom.toLowerCase().includes(query.trim().toLowerCase()));

    const exactMatch = entities.some(e => e.nom.toLowerCase() === query.trim().toLowerCase());
    const showCreate = query.trim().length > 0 && !exactMatch;

    const select = (entity) => {
        setQuery(entity.nom);
        onChange({ nom: entity.nom, id: entity.id });
        setOpen(false);
    };

    const handleInput = (e) => {
        const val = e.target.value;
        setQuery(val);
        // Reset entite_id when user edits freely
        onChange({ nom: val, id: null });
        setOpen(true);
    };

    const handleFocus = () => setOpen(true);

    const inputCls = `w-full pl-8 pr-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 ${
        error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-red-100 focus:border-red-300'
    }`;

    return (
        <div ref={containerRef} className="relative">
            {/* Search icon */}
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>

            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInput}
                onFocus={handleFocus}
                placeholder={placeholder}
                autoComplete="off"
                className={inputCls}
                style={{ color: '#111827' }}
            />

            {/* Dropdown */}
            {open && (filtered.length > 0 || showCreate) && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {/* Existing entities */}
                    {filtered.length > 0 && (
                        <div className="max-h-48 overflow-y-auto">
                            {filtered.length > 0 && (
                                <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                                    Entités existantes
                                </p>
                            )}
                            {filtered.map(entity => (
                                <button
                                    key={entity.id}
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); select(entity); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors">
                                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: '#FEF2F2' }}>
                                        <svg className="w-3 h-3" style={{ color: 'var(--brand-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-800 truncate">{entity.nom}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Create new */}
                    {showCreate && (
                        <>
                            {filtered.length > 0 && <div className="border-t border-gray-100 mx-3" />}
                            <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); onChange({ nom: query.trim(), id: null }); setOpen(false); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors">
                                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 bg-green-50">
                                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <span className="text-xs text-gray-500">Créer </span>
                                    <span className="text-sm font-medium text-gray-800">«&nbsp;{query.trim()}&nbsp;»</span>
                                </div>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default EntityCombobox;
