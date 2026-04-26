import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineArrowRight } from 'react-icons/hi';
import BtnDefault from '@/Components/Button/BtnDefault';
import InputText from '@/Components/Input/InputText';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                <p className="mt-1 text-sm text-gray-500">Join us to start reporting</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                {/* Name Field */}
                <div>
                    <InputText
                        id="name"
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={errors.name}
                        required
                        icon={HiOutlineUser}
                        autoComplete="name"
                        autoFocus
                    />
                </div>

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
                    />
                </div>

                {/* Password Field */}
                <div>
                    <div className="relative">
                        <InputText
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            label="Password"
                            placeholder="Create a password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={errors.password}
                            required
                            icon={HiOutlineLockClosed}
                            autoComplete="new-password"
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
                    {errors.password && (
                        <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                        Password must be at least 8 characters
                    </p>
                </div>

                {/* Confirm Password Field */}
                <div>
                    <div className="relative">
                        <InputText
                            id="password_confirmation"
                            type={showPasswordConfirmation ? 'text' : 'password'}
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            error={errors.password_confirmation}
                            required
                            icon={HiOutlineLockClosed}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                            className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                        >
                            {showPasswordConfirmation ? (
                                <HiOutlineEyeOff className="w-5 h-5" />
                            ) : (
                                <HiOutlineEye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
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
                    {processing ? 'Creating account...' : 'Create Account'}
                </BtnDefault>

                {/* Login Link */}
                <div className="text-center pt-2">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link
                            href={route('login')}
                            className="text-blue-600 hover:text-blue-700 font-medium transition-colors inline-flex items-center gap-1 group"
                        >
                            Sign in
                            <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </p>
                </div>

                {/* Terms & Conditions */}
                <div className="text-center pt-2">
                    <p className="text-xs text-gray-400">
                        By registering, you agree to our{' '}
                        <Link href="/terms" className="text-blue-500 hover:text-blue-600">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-blue-500 hover:text-blue-600">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </form>
        </GuestLayout>
    );
}