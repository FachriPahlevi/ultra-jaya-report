import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import BtnDefault from '@/Components/Button/BtnDefault';
import InputText from '@/Components/Input/InputText';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
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

            {/* Status Message */}
            {status && (
                <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
                    <p className="text-sm text-green-700">{status}</p>
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                {/* Email Field */}
                <div>
                    <InputText
                        id="email"
                        type="email"
                        label="Email Address"
                        placeholder="Enter your email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        required
                        icon={HiOutlineMail}
                        autoComplete="username"
                        autoFocus
                    />
                </div>

                {/* Password Field */}
                <div>
                    <div className="relative">
                        <InputText
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            label="Password"
                            placeholder="Enter your password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={errors.password}
                            required
                            icon={HiOutlineLockClosed}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                        >
                            {showPassword ? (
                                <HiOutlineEyeOff className="w-5 h-5" />
                            ) : (
                                <HiOutlineEye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer group">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                            Remember me
                        </span>
                    </label>

                    {/* {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors focus:outline-none focus:underline"
                        >
                            Forgot password?
                        </Link>
                    )} */}
                </div>

                {/* Submit Button */}
                <BtnDefault
                    type="submit"
                    disabled={processing}
                    loading={processing}
                    fullWidth
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                    {processing ? 'Signing in...' : 'Sign in'}
                </BtnDefault>

                {/* Register Link */}
                {/* <div className="text-center pt-4">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link
                            href={route('register')}
                            className="text-blue-600 hover:text-blue-700 font-medium transition-colors focus:outline-none focus:underline"
                        >
                            Create account
                        </Link>
                    </p>
                </div> */}
            </form>
        </GuestLayout>
    );
}