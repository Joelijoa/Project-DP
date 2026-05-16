import { useState, useRef, useEffect } from 'react';

/**
 * AppSelect — remplacement custom du <select> natif.
 * Props:
 *   value      : valeur courante
 *   onChange   : callback(newValue)
 *   options    : [{ value, label }]
 *   placeholder: texte si aucune valeur (défaut: 'Sélectionner…')
 *   className  : classes additionnelles sur le trigger
 */
const AppSelect = ({ value, onChange, options = [], placeholder = 'Sélectionner…', className = '', disabled = false }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const selected = options.find(o => String(o.value) === String(value));

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setOpen(false);
    };

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(o => !o)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border rounded-xl bg-white text-left focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    open ? 'border-gray-300 ring-2' : 'border-gray-200'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'}`}
                style={{ '--tw-ring-color': 'var(--brand-red)', color: selected ? '#111827' : '#9ca3af' }}
            >
                <span className="truncate">{selected ? selected.label : placeholder}</span>
                <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1 min-w-max">
                    {options.map(opt => {
                        const isActive = String(opt.value) === String(value);
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelect(opt.value)}
                                className={`w-full text-left px-3 py-2 text-sm transition flex items-center justify-between gap-3 ${
                                    isActive
                                        ? 'text-gray-900 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <span>{opt.label}</span>
                                {isActive && (
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--brand-red)' }}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AppSelect;
