const Field = ({ label, required, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

export default Field;
