export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center justify-center rounded-2xl bg-white text-on-background border-2 border-surface-container-highest border-b-4 px-5 py-2.5 font-label-bold text-label-bold uppercase tracking-wider hover:bg-surface-container-low disabled:opacity-50 disabled:pointer-events-none active:translate-y-[2px] active:border-b-2 transition-all ` +
                className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
