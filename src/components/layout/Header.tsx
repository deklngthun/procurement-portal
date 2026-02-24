'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <header className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
                {subtitle && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>
                )}
            </div>
            <div className="flex items-center gap-3">
                {actions}
                <button onClick={handleLogout} className="btn btn-ghost text-xs">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </header>
    );
}
