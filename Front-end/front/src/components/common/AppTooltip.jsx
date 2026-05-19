import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

const AppTooltip = ({ code, description, className = '' }) => {
    const [pos, setPos] = useState(null);
    const ref = useRef(null);

    const handleMouseEnter = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setPos({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
            });
        }
    };

    return (
        <span ref={ref} className={`relative inline-block ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setPos(null)}>
            <span className="font-mono text-gray-500 cursor-help underline decoration-dotted decoration-gray-400">
                {code}
            </span>
            {pos && createPortal(
                <div style={{
                    position: 'absolute',
                    top: pos.top - 8,
                    left: pos.left,
                    transform: 'translateY(-100%)',
                    zIndex: 9999,
                    width: '20rem',
                    pointerEvents: 'none',
                }}
                    className="p-3 bg-gray-900 text-white rounded-lg shadow-2xl">
                    <p className="font-semibold text-gray-100 mb-1.5 text-xs">{code?.trim()}</p>
                    {description && <p className="text-gray-300 leading-relaxed text-[11px]">{description}</p>}
                    <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                </div>,
                document.body
            )}
        </span>
    );
};

export default AppTooltip;
