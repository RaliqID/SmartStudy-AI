import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout>
            <Head title="Profile" />

            <div className="py-lg">
                <h1 className="font-display text-display text-on-background mb-lg">Profile</h1>

                <div className="max-w-xl flex flex-col gap-lg">
                    <div className="bg-surface rounded-2xl chunky-border p-lg">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </div>

                    <div className="bg-surface rounded-2xl chunky-border p-lg">
                        <UpdatePasswordForm />
                    </div>

                    <div className="border-2 border-error-container rounded-2xl p-lg">
                        <DeleteUserForm />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
