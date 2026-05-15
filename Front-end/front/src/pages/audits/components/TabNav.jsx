import { useEffect, useRef, useState } from 'react';

const TabNav = ({ activeTab, setActiveTab, tabs, tabStatus = {} }) => {
    const navRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        const el = navRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    useEffect(() => {
        checkScroll();
        const el = navRef.current;
        if (!el) return;
        el.addEventListener('scroll', checkScroll, { passive: true });
        const ro = new ResizeObserver(checkScroll);
        ro.observe(el);
        return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
    }, []);

    const scroll = (dir) => {
        navRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
    };

    return (
        <div className="relative mb-6 flex items-end gap-1">
            {/* Bouton gauche */}
            <button
                onClick={() => scroll(-1)}
                disabled={!canScrollLeft}
                className="flex-shrink-0 mb-px p-1 rounded-md border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition disabled:opacity-0 disabled:pointer-events-none"
                aria-label="Défiler à gauche"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>

            {/* Fondu gauche */}
            {canScrollLeft && (
                <div className="absolute left-8 top-0 bottom-1 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none z-10" />
            )}

            {/* Liste des onglets */}
            <nav
                ref={navRef}
                className="flex-1 flex gap-1 border-b border-gray-200 overflow-x-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {tabs.map((tab, i) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id
                            ? 'border-current -mb-px'
                            : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                            }`}
                        style={activeTab === tab.id ? { color: 'var(--brand-red)', borderColor: 'var(--brand-red)' } : {}}
                    >
                        <span className="relative flex-shrink-0">
                            <span
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                style={{ backgroundColor: activeTab === tab.id ? 'var(--brand-red)' : '#D1D5DB' }}
                            >
                                {i + 1}
                            </span>
                            {tabStatus[tab.id] === false && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-400 border border-white" />
                            )}
                        </span>
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Fondu droit */}
            {canScrollRight && (
                <div className="absolute right-8 top-0 bottom-1 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none z-10" />
            )}

            {/* Bouton droit */}
            <button
                onClick={() => scroll(1)}
                disabled={!canScrollRight}
                className="flex-shrink-0 mb-px p-1 rounded-md border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition disabled:opacity-0 disabled:pointer-events-none"
                aria-label="Défiler à droite"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        </div>
    );
};

export default TabNav;
