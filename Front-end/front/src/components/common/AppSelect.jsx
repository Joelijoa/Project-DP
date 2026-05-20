import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const AppSelect = ({
    value,
    onChange,
    options = [],
    placeholder = 'Sélectionner…',
    className = '',
    disabled = false,
    locked = false,
    align = 'left',
    size = 'default',
}) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({});
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    const selected = options.find(o => String(o.value) === String(value));
    const isCompact = size === 'sm';

    // Fermer si clic hors trigger + dropdown
    useEffect(() => {
        const handler = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Recalculer la position du dropdown quand il s'ouvre
    const handleToggle = () => {
        if (disabled || locked) return;
        if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPos({
                top: rect.bottom + window.scrollY + 4,
                left: align === 'right' ? 'auto' : rect.left + window.scrollX,
                right: align === 'right' ? window.innerWidth - rect.right + window.scrollX : 'auto',
                minWidth: rect.width,
            });
        }
        setOpen(o => !o);
    };

    const handleSelect = (val) => {
        onChange(val);
        setOpen(false);
    };

    const triggerPadding = isCompact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm';
    const chevronSize = isCompact ? 'w-3 h-3' : 'w-4 h-4';

    return (
        <div className={`relative ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={handleToggle}
                className={`w-full flex items-center justify-between gap-2 ${triggerPadding} border rounded-xl bg-white text-left focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    open ? 'border-gray-300 ring-2' : 'border-gray-200'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : locked ? 'cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'}`}
                style={{ '--tw-ring-color': 'var(--brand-red)', color: selected ? '#111827' : '#9ca3af' }}
            >
                <span className="truncate">{selected ? selected.label : placeholder}</span>
                <svg
                    className={`${chevronSize} text-gray-400 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {open && createPortal(
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'absolute',
                        top: pos.top,
                        left: pos.left,
                        right: pos.right,
                        minWidth: pos.minWidth,
                        zIndex: 9999,
                    }}
                    className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1 max-w-xs"
                >
                    {options.map(opt => {
                        const isActive = String(opt.value) === String(value);
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelect(opt.value)}
                                className={`w-full text-left px-3 py-2 text-sm transition flex items-center justify-between gap-3 ${
                                    isActive ? 'text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
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
                </div>,
                document.body
            )}
        </div>
    );
};

export default AppSelect;
