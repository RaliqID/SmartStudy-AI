import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            {status && (
                <div className="mb-4 font-body-md text-body-md text-primary font-bold">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-sm">
                <h2 className="font-display text-display text-on-background mb-sm">Reset your password</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-sm">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-1" />
                </div>

                <PrimaryButton disabled={processing} className="w-full mt-sm">
                    Send reset link
                </PrimaryButton>

                <p className="font-body-md text-body-md text-on-surface-variant text-center mt-sm">
                    Remember your password?{' '}
                    <a href={route('login')} className="text-secondary font-bold hover:underline">
                        Log in
                    </a>
                </p>
            </form>
        </GuestLayout>
    );
}