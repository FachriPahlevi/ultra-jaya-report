import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block group">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center group-hover:shadow-lg transition-shadow duration-200">
                                <ApplicationLogo className="w-10 h-10" />
                            </div>
                        </div>
                    </Link>
                    <h2 className="mt-4 text-2xl font-semibold text-gray-900">Welcome Back</h2>
                    <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>
                </div>

                {/* Card Container */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                    <div className="px-6 py-8 sm:px-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}