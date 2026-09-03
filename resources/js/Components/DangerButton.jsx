export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-2xl bg-error text-on-error px-5 py-2.5 font-label-bold text-label-bold uppercase tracking-wider btn-chunky border-b-[#93000a] disabled:opacity-50 disabled:pointer-events-none ` +
                className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
