import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    noHover?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    padding = 'md',
    noHover = false,
    className = '',
    style,
    ...props
}) => {
    const paddingStyles = {
        none: '0',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem'
    };

    return (
        <div
            className={`glass-card ${className}`}
            style={{
                padding: paddingStyles[padding],
                transform: noHover ? 'none' : undefined,
                boxShadow: noHover ? 'var(--card-shadow-sm)' : undefined,
                ...style
            }}
            {...props}
        >
            {children}
        </div>
    );
};
