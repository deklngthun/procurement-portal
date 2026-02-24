import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import type { UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const role: UserRole = profile?.role || 'employee';
    const userName = profile?.full_name || user.email || 'User';

    return (
        <div className="flex min-h-screen">
            <Sidebar role={role} userName={userName} />
            <main className="flex-1 md:ml-64 p-4 pt-16 md:p-8 md:pt-8">
                {children}
            </main>
        </div>
    );
}
