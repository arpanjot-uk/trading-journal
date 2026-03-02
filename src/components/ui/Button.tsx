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
            border: '1px solid transparent',
            boxShadow: '0 4px 14px 0 rgba(140, 170, 238, 0.15)',
        },
        secondary: {
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
        },
        danger: {
            background: 'var(--loss-bg)',
            color: 'var(--loss-color)',
            border: '1px solid rgba(231, 130, 132, 0.3)',
        },
        ghost: {
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid transparent',
        }
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
        sm: { padding: '0.4rem 0.8rem', fontSize: '0.875rem' },
        md: { padding: '0.55rem 1.2rem', fontSize: '0.95rem' },
        lg: { padding: '0.75rem 1.6rem', fontSize: '1.05rem' }
    };

    return (
        <button
            className={`btn ${className}`}
            style={{ ...baseStyle, ...variantStyles[variant], ...sizeStyles[size] }}
            onMouseOver={(e) => {
                if (props.disabled) return;
                e.currentTarget.style.transform = 'translateY(-1px)';

                if (variant === 'primary') {
                    e.currentTarget.style.background = 'var(--accent-hover)';
                    e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(140, 170, 238, 0.25)';
                }
                if (variant === 'secondary') {
                    e.currentTarget.style.background = 'var(--card-bg-hover)';
                }
                if (variant === 'danger') {
                    e.currentTarget.style.background = 'var(--loss-color)';
                    e.currentTarget.style.color = '#fff';
                }
                if (variant === 'ghost') {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                }
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';

                if (variant === 'primary') {
                    e.currentTarget.style.background = 'var(--accent-primary)';
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(140, 170, 238, 0.15)';
                }
                if (variant === 'secondary') {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                }
                if (variant === 'danger') {
                    e.currentTarget.style.background = 'var(--loss-bg)';
                    e.currentTarget.style.color = 'var(--loss-color)';
                }
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
