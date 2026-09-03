export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#2b6c00',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '12px 24px',
                borderRadius: '16px',
                border: 'none',
                borderBottom: '4px solid #1f5100',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: 'transform 100ms ease, border-bottom-width 100ms ease',
            }}
            onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.borderBottomWidth = '2px';
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderBottomWidth = '4px';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderBottomWidth = '4px';
            }}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
