const UserStatCard = ({ value, label, iconPath }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-400">{label}</p>
            {iconPath && (
                <div className="p-1.5 rounded-lg bg-gray-50 flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                    </svg>
                </div>
            )}
        </div>
        <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
    </div>
);

export default UserStatCard;
