export const SECTEURS = [
    'Administration publique', 'Banque & Finance', 'Santé', 'Éducation',
    'Télécommunications', 'Énergie', 'Transport', 'Industrie', 'Commerce', 'Autre',
];

export const SECTEUR_COLORS = {
    'Administration publique': { badge: 'bg-blue-50 text-blue-700',       avatar: '#3B82F6' },
    'Banque & Finance':        { badge: 'bg-emerald-50 text-emerald-700',  avatar: '#10B981' },
    'Santé':                   { badge: 'bg-red-50 text-red-700',          avatar: '#EF4444' },
    'Éducation':               { badge: 'bg-purple-50 text-purple-700',    avatar: '#8B5CF6' },
    'Télécommunications':      { badge: 'bg-cyan-50 text-cyan-700',        avatar: '#06B6D4' },
    'Énergie':                 { badge: 'bg-amber-50 text-amber-700',      avatar: '#F59E0B' },
    'Transport':               { badge: 'bg-orange-50 text-orange-700',    avatar: '#F97316' },
    'Industrie':               { badge: 'bg-stone-50 text-stone-600',      avatar: '#78716C' },
    'Commerce':                { badge: 'bg-pink-50 text-pink-700',        avatar: '#EC4899' },
    'Autre':                   { badge: 'bg-gray-100 text-gray-600',       avatar: '#9CA3AF' },
};

export const STATUT_CONFIG = {
    brouillon: { label: 'Brouillon', bg: 'bg-gray-100',   text: 'text-gray-600'  },
    en_cours:  { label: 'En cours',  bg: 'bg-blue-50',    text: 'text-blue-700'  },
    termine:   { label: 'Terminé',   bg: 'bg-green-50',   text: 'text-green-700' },
    archive:   { label: 'Archivé',   bg: 'bg-yellow-50',  text: 'text-yellow-700' },
};

export const emptyForm = {
    nom: '', secteur: '', adresse: '', ville: '', pays: 'Maroc',
    telephone: '', email: '', site_web: '', description: '',
};

export const getInitials = (nom = '') => {
    const words = nom.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return nom.slice(0, 2).toUpperCase() || '?';
};

export const getAvatarColor = (secteur) => SECTEUR_COLORS[secteur]?.avatar ?? '#9CA3AF';

export const isIncomplete = (entite) =>
    !entite.secteur && !entite.ville && !entite.email && !entite.telephone;

export const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition color-[#111827]';
