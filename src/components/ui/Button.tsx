import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    icon,
    className = '',
    style,
    ...props
}) => {
    const baseStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: 500,
        transition: 'all var(--transition-fast)',
        width: fullWidth ? '100%' : 'auto',
        ...style,
    };

    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            background: 'var(--accent-primary)',
            color: '#fff',
        },
        secondary: {
            background: 'var(--card-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
        },
        danger: {
            background: 'var(--loss-bg)',
            color: 'var(--loss-color)',
            border: '1px solid var(--loss-color)',
        },
        ghost: {
            background: 'transparent',
            color: 'var(--text-secondary)',
        }
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
        sm: { padding: '0.4rem 0.8rem', fontSize: '0.875rem' },
        md: { padding: '0.6rem 1.2rem', fontSize: '1rem' },
        lg: { padding: '0.8rem 1.6rem', fontSize: '1.125rem' }
    };

    return (
        <button
            className={`btn ${className}`}
            style={{ ...baseStyle, ...variantStyles[variant], ...sizeStyles[size] }}
            onMouseOver={(e) => {
                if (props.disabled) return;
                if (variant === 'primary') e.currentTarget.style.background = 'var(--accent-hover)';
                if (variant === 'secondary') e.currentTarget.style.background = 'var(--card-bg-hover)';
                if (variant === 'ghost') {
                    e.currentTarget.style.background = 'var(--card-bg)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                }
            }}
            onMouseOut={(e) => {
                if (variant === 'primary') e.currentTarget.style.background = 'var(--accent-primary)';
                if (variant === 'secondary') e.currentTarget.style.background = 'var(--card-bg)';
                if (variant === 'ghost') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                }
            }}
            {...props}
        >
            {icon}
            {children}
        </button>
    );
};
