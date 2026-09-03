import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <form onSubmit={submit} className="flex flex-col gap-sm">
                <h2 className="font-display text-display text-on-background mb-sm">Confirm your password</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-sm">
                    This is a secure area. Please confirm your password before continuing.
                </p>

                <div>
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1"
                        isFocused={true}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-1" />
                </div>

                <PrimaryButton disabled={processing} className="w-full mt-sm">
                    Confirm
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}