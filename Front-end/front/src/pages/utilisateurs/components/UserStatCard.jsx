const COLOR_MAP = {
    gray:  { bg: 'bg-gray-50',  value: 'text-gray-900', label: 'text-gray-400'  },
    green: { bg: 'bg-green-50', value: 'text-green-700',label: 'text-green-500' },
    red:   { bg: 'bg-red-50',   value: 'text-red-700',  label: 'text-red-400'   },
    amber: { bg: 'bg-amber-50', value: 'text-amber-700',label: 'text-amber-500' },
};

const UserStatCard = ({ value, label, color = 'gray' }) => {
    const c = COLOR_MAP[color];
    return (
        <div className={`rounded-xl border border-gray-200 p-4 ${c.bg}`}>
            <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
            <p className={`text-xs mt-0.5 ${c.label}`}>{label}</p>
        </div>
    );
};

export default UserStatCard;
