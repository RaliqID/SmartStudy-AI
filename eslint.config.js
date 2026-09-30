import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/**
 * ESLint flat config for SmartStudy AI (React 18 + Inertia.js).
 *
 * Ziggy injects `route()` as a browser global via the `@routes` Blade
 * directive, so it must be declared here or every page that links to a
 * named route reports a false `no-undef`.
 */
export default [
    {
        ignores: ['public/build/**', 'vendor/**', 'node_modules/**', 'storage/**'],
    },
    js.configs.recommended,
    {
        files: ['resources/js/**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: {
                ...globals.browser,
                // Injected at runtime by Ziggy's @routes Blade directive.
                route: 'readonly',
                Ziggy: 'readonly',
            },
        },
        settings: {
            // Pinned explicitly: `version: 'detect'` throws when the React
            // version cannot be resolved from a deep node_modules layout.
            react: { version: '18.3' },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
        },
        rules: {
            ...react.configs.flat.recommended.rules,
            ...react.configs.flat['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            // Props are validated by the Laravel controller contracts, not PropTypes.
            'react/prop-types': 'off',
            'no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },
    {
        files: ['resources/js/**/*.test.{js,jsx}', 'resources/js/**/*.spec.{js,jsx}'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
    },
    {
        // React Three Fiber renders Three.js objects as JSX elements, so props
        // like `position`, `rotation`, `intensity` and `object` are valid at
        // runtime even though plain React DOM does not know them. `@react-three/
        // fiber` ships these declarations in its own `three-types` global JSX
        // namespace; ESLint cannot see them, so scope the exception to the file
        // that renders the scene instead of disabling the rule project-wide.
        files: ['resources/js/Components/HeroCap.jsx'],
        rules: {
            'react/no-unknown-property': 'off',
            // Mutating Three.js objects (node.position.set(...), ring.rotation.z)
            // inside useFrame is the documented react-three-fiber animation
            // pattern, not a React state-mutation bug. The rule targets React
            // render values, which this file never mutates.
            'react-hooks/immutability': 'off',
        },
    },
];
