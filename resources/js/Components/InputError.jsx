export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p
            {...props}
            className={'font-label-bold text-label-bold text-error mt-1 ' + className}
        >
            {message}
        </p>
    ) : null;
}