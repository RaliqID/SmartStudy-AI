export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block font-label-bold text-label-bold uppercase text-on-surface-variant ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}