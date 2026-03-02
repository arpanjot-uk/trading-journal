import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    error?: string;
    fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    fullWidth = true,
    className = '',
    style,          // ← pulled out so it goes to the container, not the <input>
    ...props
}) => {
    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        width: fullWidth ? '100%' : 'auto',
        marginBottom: '1rem',
        ...style,   // ← layout overrides live here (e.g. marginBottom: 0)
    };

    const inputStyle: React.CSSProperties = {
        background: 'var(--bg-secondary)',
        border: `1px solid ${error ? 'var(--loss-color)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0.6rem 0.8rem',
        color: 'var(--text-primary)',
        outline: 'none',
        transition: 'all var(--transition-fast)',
        fontFamily: 'inherit',
        fontSize: '0.95rem',
        width: '100%',
    };

    return (
        <div className={className} style={containerStyle}>
            {label && <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>}
            <input
                style={inputStyle}
                onFocus={(e) => {
                    if (!error) {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.12)';
                        e.currentTarget.style.background = 'var(--bg-primary)';
                    }
                }}
                onBlur={(e) => {
                    if (!error) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                    }
                }}
                {...props}
            />
            {error && <span style={{ color: 'var(--loss-color)', fontSize: '0.75rem', fontWeight: 500 }}>{error}</span>}
        </div>
    );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: React.ReactNode;
    error?: string;
    fullWidth?: boolean;
    options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    fullWidth = true,
    options,
    className = '',
    style,          // ← pulled out so it goes to the container, not the <select>
    ...props
}) => {
    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        width: fullWidth ? '100%' : 'auto',
        marginBottom: '1rem',
        ...style,   // ← layout overrides live here
    };

    const inputStyle: React.CSSProperties = {
        background: 'var(--bg-secondary)',
        border: `1px solid ${error ? 'var(--loss-color)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0.6rem 0.8rem',
        color: 'var(--text-primary)',
        outline: 'none',
        transition: 'all var(--transition-fast)',
        appearance: 'none',
        fontFamily: 'inherit',
        fontSize: '0.95rem',
        backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.8rem top 50%',
        backgroundSize: '0.65rem auto',
    };

    return (
        <div className={className} style={containerStyle}>
            {label && <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>}
            <select
                style={inputStyle}
                onFocus={(e) => {
                    if (!error) {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(140, 170, 238, 0.15)';
                        e.currentTarget.style.background = 'var(--bg-primary)';
                    }
                }}
                onBlur={(e) => {
                    if (!error) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                    }
                }}
                {...props}
            >
                <option value="" disabled style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>Select an option</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <span style={{ color: 'var(--loss-color)', fontSize: '0.75rem', fontWeight: 500 }}>{error}</span>}
        </div>
    );
};
