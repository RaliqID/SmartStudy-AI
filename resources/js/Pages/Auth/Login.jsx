import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 font-body-md text-body-md text-primary font-bold">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-sm">
                <h2 className="font-display text-display text-on-background mb-sm">Welcome back!</h2>

                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-1" />
                </div>

                <div className="flex items-center justify-between gap-sm">
                    <label className="flex items-center gap-sm">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="font-body-md text-body-md text-on-surface-variant">
                            Remember me
                        </span>
                    </label>
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="font-label-bold text-label-bold text-secondary hover:underline"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <PrimaryButton disabled={processing} className="w-full mt-sm">
                    Log in
                </PrimaryButton>

                <p className="font-body-md text-body-md text-on-surface-variant text-center mt-sm">
                    Don&apos;t have an account?{' '}
                    <Link href={route('register')} className="text-secondary font-bold hover:underline">
                        Register
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}