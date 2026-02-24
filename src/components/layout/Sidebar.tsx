'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type UserRole } from '@/lib/types';

interface SidebarProps {
    role: UserRole;
    userName: string;
}

const navItems = [
    { label: 'Dashboard', href: '/home', icon: 'grid', roles: ['employee', 'procurement_admin', 'vendor'] as UserRole[] },
    { label: 'Requisitions', href: '/requisitions', icon: 'file-text', roles: ['employee', 'procurement_admin'] as UserRole[] },
    { label: 'Purchase Orders', href: '/purchase-orders', icon: 'shopping-cart', roles: ['procurement_admin', 'vendor'] as UserRole[] },
    { label: 'Vendors', href: '/vendors', icon: 'users', roles: ['procurement_admin', 'employee'] as UserRole[] },
    { label: 'Products', href: '/products', icon: 'package', roles: ['procurement_admin', 'vendor'] as UserRole[] },
    { label: 'Contracts', href: '/contracts', icon: 'file', roles: ['procurement_admin', 'vendor'] as UserRole[] },
];

const iconPaths: Record<string, string> = {
    'grid': 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
    'file-text': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    'shopping-cart': 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
    'users': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    'package': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    'file': 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
};

export default function Sidebar({ role, userName }: SidebarProps) {
    const pathname = usePathname();
    const filtered = navItems.filter((item) => item.roles.includes(role));

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col z-40">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold gradient-text">ProcureFlow</h1>
                        <p className="text-xs text-[var(--text-muted)]">Procurement Portal</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {filtered.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPaths[item.icon]} />
                            </svg>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User info */}
            <div className="p-4 border-t border-[var(--border-primary)]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{userName}</p>
                        <p className="text-xs text-[var(--text-muted)] capitalize">{role.replace('_', ' ')}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
