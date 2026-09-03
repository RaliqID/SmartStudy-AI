import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={className}
            style={{
                width: '100%',
                background: '#ffffff',
                border: '2px solid #e3e2e1',
                borderRadius: '16px',
                padding: '10px 16px',
                fontSize: '15px',
                lineHeight: '22px',
                fontWeight: 500,
                color: '#1a1c1b',
                outline: 'none',
                transition: 'border-color 150ms',
            }}
            onFocus={(e) => {
                e.target.style.borderColor = '#2b6c00';
            }}
            onBlur={(e) => {
                e.target.style.borderColor = '#e3e2e1';
                props.onBlur?.(e);
            }}
            ref={localRef}
        />
    );
});
