import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-primary bg-secondary-container/10 text-primary font-label-bold'
                    : 'border-transparent text-on-surface-variant hover:border-surface-container-highest hover:bg-surface-container-low hover:text-on-background'
            } text-body-md font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
