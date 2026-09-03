import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-4 px-1 pt-1 pb-0.5 font-label-bold text-label-bold leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:border-surface-container-highest hover:text-on-background') +
                className
            }
        >
            {children}
        </Link>
    );
}
