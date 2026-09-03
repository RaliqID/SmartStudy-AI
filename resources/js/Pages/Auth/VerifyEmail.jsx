import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="flex flex-col items-center gap-sm mb-sm">
                <span className="material-symbols-outlined text-[64px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                    mark_email_read
                </span>
                <h2 className="font-display text-display text-on-background text-center">Verify your email</h2>
                <p className="font-body-md text-body-md text-on-surface-variant text-center">
                    We sent a verification link to your email. Click the link to confirm your address.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 font-body-md text-body-md text-primary font-bold text-center">
                    A new verification link has been sent.
                </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-sm mt-sm">
                <PrimaryButton disabled={processing} className="w-full">
                    Resend verification email
                </PrimaryButton>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="w-full text-center font-label-bold text-label-bold text-on-surface-variant hover:text-secondary transition-colors py-sm"
                >
                    Log out
                </Link>
            </form>
        </GuestLayout>
    );
}