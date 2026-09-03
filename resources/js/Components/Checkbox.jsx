export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                `w-5 h-5 rounded border-2 border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0 transition-colors checked:bg-primary checked:border-primary ` +
                className
            }
        />
    );
}