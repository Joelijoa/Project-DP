import { useState, useEffect } from 'react';

const DateInput = ({ value, onChange, className = '', placeholder = 'jj/mm/aaaa', ...props }) => {
    const toDisplay = (iso) => {
        if (!iso) return '';
        const parts = iso.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return iso;
    };

    const [display, setDisplay] = useState(toDisplay(value));

    useEffect(() => {
        setDisplay(toDisplay(value));
    }, [value]);

    const handleChange = (e) => {
        const raw = e.target.value;
        const digits = raw.replace(/\D/g, '').slice(0, 8);
        let formatted = digits;
        if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
        if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
        setDisplay(formatted);

        if (digits.length === 8) {
            const d = digits.slice(0, 2), m = digits.slice(2, 4), y = digits.slice(4, 8);
            if (parseInt(d) >= 1 && parseInt(d) <= 31 && parseInt(m) >= 1 && parseInt(m) <= 12) {
                onChange(`${y}-${m}-${d}`);
            }
        } else if (digits.length === 0) {
            onChange('');
        }
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            value={display}
            onChange={handleChange}
            placeholder={placeholder}
            maxLength={10}
            className={className}
            {...props}
        />
    );
};

export default DateInput;
