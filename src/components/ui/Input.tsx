import React, { useState, useRef, useEffect } from 'react';

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

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    label?: React.ReactNode;
    error?: string;
    fullWidth?: boolean;
    options: { value: string | number; label: string }[];
    onChange?: (e: any) => void;
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    fullWidth = true,
    options,
    className = '',
    style,
    value,
    onChange,
    name,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        width: fullWidth ? '100%' : 'auto',
        marginBottom: '1rem',
        position: 'relative',
        ...style,
    };

    const triggerStyle: React.CSSProperties = {
        background: isOpen ? 'var(--bg-primary)' : 'var(--bg-secondary)',
        border: `1px solid ${error ? 'var(--loss-color)' : isOpen ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0.6rem 0.8rem',
        color: 'var(--text-primary)',
        outline: 'none',
        transition: 'all var(--transition-fast)',
        fontFamily: 'inherit',
        fontSize: '0.95rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        boxShadow: isOpen && !error ? '0 0 0 3px rgba(59, 130, 246, 0.12)' : 'none',
        userSelect: 'none',
    };

    const dropdownStyle: React.CSSProperties = {
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        minWidth: '100%',
        width: 'max-content',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        zIndex: 50,
        maxHeight: '260px',
        overflowY: 'auto',
        display: isOpen ? 'block' : 'none',
        padding: '0.4rem',
    };

    const optionStyle = (isSelected: boolean): React.CSSProperties => ({
        padding: '0.6rem 0.8rem',
        cursor: 'pointer',
        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
        background: isSelected ? 'var(--bg-tertiary)' : 'transparent',
        fontSize: '0.95rem',
        lineHeight: '1.4',
        borderRadius: 'var(--radius-sm)',
        transition: 'all var(--transition-fast)',
        marginBottom: '2px',
        whiteSpace: 'nowrap',
    });

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    return (
        <div className={className} style={containerStyle} ref={containerRef}>
            {label && <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>}

            <div
                style={triggerStyle}
                onClick={() => setIsOpen(!isOpen)}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    } else if (e.key === 'Escape') {
                        setIsOpen(false);
                    }
                }}
                {...(props as any)}
            >
                <span style={{ color: selectedOption ? 'inherit' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedOption ? selectedOption.label : 'Select an option'}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0, marginLeft: '0.5rem', opacity: 0.6 }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>

            <div style={dropdownStyle} className="custom-scrollbar">
                {options.map((opt) => (
                    <div
                        key={opt.value}
                        style={optionStyle(String(opt.value) === String(value))}
                        onMouseOver={(e) => {
                            if (String(opt.value) !== String(value)) {
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (String(opt.value) !== String(value)) {
                                e.currentTarget.style.background = 'transparent';
                            }
                        }}
                        onClick={() => {
                            if (onChange) {
                                onChange({ target: { value: opt.value.toString(), name } });
                            }
                            setIsOpen(false);
                        }}
                    >
                        {opt.label}
                    </div>
                ))}
            </div>

            {error && <span style={{ color: 'var(--loss-color)', fontSize: '0.75rem', fontWeight: 500 }}>{error}</span>}
        </div>
    );
};
