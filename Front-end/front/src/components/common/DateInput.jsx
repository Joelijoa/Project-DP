/**
 * DateInput — champ date en format jj/mm/aaaa
 * value (prop) : chaîne ISO yyyy-mm-dd  (ou vide)
 * onChange     : appelé avec la valeur ISO yyyy-mm-dd (ou '' si incomplet)
 */
const DateInput = ({ value, onChange, className = '', placeholder = 'jj/mm/aaaa', ...props }) => {
    // ISO → affichage jj/mm/aaaa
    const toDisplay = (iso) => {
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        if (!y || !m || !d) return iso;
        return `${d}/${m}/${y}`;
    };

    // Saisie → ISO yyyy-mm-dd (quand complet) ou vide
    const toISO = (raw) => {
        const digits = raw.replace(/\D/g, '');
        if (digits.length !== 8) return '';
        const d = digits.slice(0, 2);
        const m = digits.slice(2, 4);
        const y = digits.slice(4, 8);
        // Validation basique
        if (parseInt(d) < 1 || parseInt(d) > 31) return '';
        if (parseInt(m) < 1 || parseInt(m) > 12) return '';
        return `${y}-${m}-${d}`;
    };

    const handleChange = (e) => {
        const raw = e.target.value;

        // Auto-insertion des slashes
        const digits = raw.replace(/\D/g, '').slice(0, 8);
        let formatted = digits;
        if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
        if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);

        // Mettre à jour l'affichage via l'event
        e.target.value = formatted;

        const iso = toISO(formatted);
        onChange(iso);
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            value={toDisplay(value)}
            onChange={handleChange}
            placeholder={placeholder}
            maxLength={10}
            className={className}
            {...props}
        />
    );
};

export default DateInput;
