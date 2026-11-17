import AdminLayout from '@/Layouts/AdminLayout';
import AppLayout from '@/Layouts/AppLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TeacherLayout from '@/Layouts/TeacherLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status, auth: propAuth }) {
    const pageAuth = usePage().props.auth;
    const auth = propAuth || pageAuth;
    const roles = auth?.user?.roles || [];

    const isAdmin = roles.includes('admin');
    const isTeacher = roles.includes('teacher');
    const isStudent = roles.includes('student');

    // Select role layout
    let Layout = AuthenticatedLayout;
    if (isAdmin) {
        Layout = AdminLayout;
    } else if (isTeacher) {
        Layout = TeacherLayout;
    } else if (isStudent) {
        Layout = AppLayout;
    }

    // Role-specific titles: Admin uses 'Profile', Teacher and Student use 'Settings'
    const pageTitle = isAdmin ? 'Profile' : 'Settings';
    const pageSubtitle = isAdmin
        ? 'Kelola informasi profil administrator dan keamanan akun Anda.'
        : isTeacher
        ? 'Kelola informasi profil, preferensi, dan keamanan akun guru.'
        : 'Kelola informasi profil, preferensi akun, dan keamanan kata sandi Anda.';

    return (
        <Layout auth={auth}>
            <Head title={pageTitle} />

            <div className="w-full max-w-3xl mx-auto py-4 md:py-8 px-4 sm:px-6">
                {/* Header */}
                <div className="mb-8 text-center sm:text-left">
                    <h1 className="font-display text-3xl md:text-4xl font-black text-on-background tracking-tight">
                        {pageTitle}
                    </h1>
                    <p className="mt-2 text-sm md:text-base text-on-surface-variant">
                        {pageSubtitle}
                    </p>
                </div>

                {/* Form Sections */}
                <div className="flex flex-col gap-6">
                    <div className="bg-surface rounded-2xl chunky-border p-6 md:p-8 shadow-sm">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </div>

                    <div className="bg-surface rounded-2xl chunky-border p-6 md:p-8 shadow-sm">
                        <UpdatePasswordForm />
                    </div>

                    <div className="bg-surface rounded-2xl border-2 border-error-container p-6 md:p-8 shadow-sm">
                        <DeleteUserForm />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
