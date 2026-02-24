import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

    const role = profile?.role || 'employee';

    // Fetch counts
    const { count: reqCount } = await supabase.from('requisitions').select('*', { count: 'exact', head: true });
    const { count: poCount } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true });
    const { count: vendorCount } = await supabase.from('vendors').select('*', { count: 'exact', head: true });
    const { count: contractCount } = await supabase.from('contracts').select('*', { count: 'exact', head: true });

    // Recent requisitions
    const { data: recentReqs } = await supabase
        .from('requisitions')
        .select('*, requester:profiles!requester_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

    // Recent POs
    const { data: recentPOs } = await supabase
        .from('purchase_orders')
        .select('*, vendor:vendors(company_name)')
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <div>
            <Header
                title={`Welcome back, ${profile?.full_name || 'User'}`}
                subtitle={`Here's your procurement overview — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Requisitions"
                    value={reqCount || 0}
                    subtitle="All time"
                    color="indigo"
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                />
                <StatCard
                    title="Purchase Orders"
                    value={poCount || 0}
                    subtitle="Active orders"
                    color="emerald"
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                    }
                />
                <StatCard
                    title="Active Vendors"
                    value={vendorCount || 0}
                    subtitle="Registered"
                    color="amber"
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    }
                />
                <StatCard
                    title="Contracts"
                    value={contractCount || 0}
                    subtitle="All statuses"
                    color="violet"
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    }
                />
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Requisitions */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Requisitions</h2>
                    <div className="space-y-3">
                        {(!recentReqs || recentReqs.length === 0) ? (
                            <p className="text-sm text-[var(--text-muted)] text-center py-8">No requisitions yet</p>
                        ) : (
                            recentReqs.map((req: any) => (
                                <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text-primary)]">{req.title}</p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {req.requester?.full_name} · {formatDate(req.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-[var(--text-primary)]">{formatCurrency(req.total_amount)}</span>
                                        <Badge status={req.status} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Purchase Orders */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Purchase Orders</h2>
                    <div className="space-y-3">
                        {(!recentPOs || recentPOs.length === 0) ? (
                            <p className="text-sm text-[var(--text-muted)] text-center py-8">No purchase orders yet</p>
                        ) : (
                            recentPOs.map((po: any) => (
                                <div key={po.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text-primary)]">{po.po_number}</p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {po.vendor?.company_name} · {formatDate(po.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-[var(--text-primary)]">{formatCurrency(po.total_amount)}</span>
                                        <Badge status={po.status} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions (Admin only) */}
            {role === 'procurement_admin' && (
                <div className="mt-8 glass-card p-6">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <a href="/requisitions/new" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all-smooth group">
                            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <span className="text-xs font-medium text-[var(--text-secondary)]">New Requisition</span>
                        </a>
                        <a href="/purchase-orders" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all-smooth group">
                            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            <span className="text-xs font-medium text-[var(--text-secondary)]">Manage POs</span>
                        </a>
                        <a href="/vendors" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all-smooth group">
                            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <span className="text-xs font-medium text-[var(--text-secondary)]">View Vendors</span>
                        </a>
                        <a href="/contracts" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all-smooth group">
                            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <span className="text-xs font-medium text-[var(--text-secondary)]">Contracts</span>
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
