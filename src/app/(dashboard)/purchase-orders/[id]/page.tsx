'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { PurchaseOrder } from '@/lib/types';

const STATUS_STEPS = ['draft', 'issued', 'acknowledged', 'shipped', 'delivered'];

export default function PurchaseOrderDetailPage() {
    const { id } = useParams();
    const [order, setOrder] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchOrder();
        // Subscribe to realtime changes
        const channel = supabase
            .channel(`po-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'purchase_orders',
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    setOrder((prev) => (prev ? { ...prev, ...payload.new } as PurchaseOrder : null));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const fetchOrder = async () => {
        const { data } = await supabase
            .from('purchase_orders')
            .select('*, vendor:vendors(company_name, contact_email, phone), creator:profiles!created_by(full_name, email)')
            .eq('id', id)
            .single();
        setOrder(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!order) {
        return <div className="text-center py-20 text-[var(--text-muted)]">Purchase order not found.</div>;
    }

    const currentStepIndex = STATUS_STEPS.indexOf(order.status);
    const isCancelled = order.status === 'cancelled';

    return (
        <div>
            <Header
                title={`Order ${order.po_number}`}
                subtitle="Real-time order tracking"
                actions={
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-emerald-400">Live</span>
                    </div>
                }
            />

            {/* Status Tracker */}
            <div className="glass-card p-8 mb-6">
                <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-6">Order Progress</h2>
                {isCancelled ? (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            This order has been cancelled
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between relative">
                        {/* Progress line */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-[var(--border-primary)]">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                                style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                            />
                        </div>

                        {STATUS_STEPS.map((step, idx) => {
                            const isCompleted = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;
                            return (
                                <div key={step} className="relative flex flex-col items-center z-10">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${isCompleted
                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                                                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-primary)]'
                                            } ${isCurrent ? 'pulse-glow scale-110' : ''}`}
                                    >
                                        {isCompleted ? '✓' : idx + 1}
                                    </div>
                                    <p className={`mt-3 text-xs font-medium capitalize ${isCompleted ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                                        }`}>
                                        {step}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold">Order Details</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-[var(--text-muted)]">PO Number</p><p className="text-sm font-medium">{order.po_number}</p></div>
                        <div><p className="text-xs text-[var(--text-muted)]">Status</p><Badge status={order.status} /></div>
                        <div><p className="text-xs text-[var(--text-muted)]">Total Amount</p><p className="text-lg font-bold gradient-text">{formatCurrency(order.total_amount)}</p></div>
                        <div><p className="text-xs text-[var(--text-muted)]">Expected Delivery</p><p className="text-sm">{order.expected_delivery ? formatDate(order.expected_delivery) : '—'}</p></div>
                        <div><p className="text-xs text-[var(--text-muted)]">Created</p><p className="text-sm">{formatDateTime(order.created_at)}</p></div>
                        <div><p className="text-xs text-[var(--text-muted)]">Last Updated</p><p className="text-sm">{formatDateTime(order.updated_at)}</p></div>
                    </div>
                    {order.notes && (
                        <div><p className="text-xs text-[var(--text-muted)] mb-1">Notes</p><p className="text-sm text-[var(--text-secondary)]">{order.notes}</p></div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Vendor info */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold mb-3">Vendor</h2>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">{(order as any).vendor?.company_name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{(order as any).vendor?.contact_email}</p>
                            {(order as any).vendor?.phone && <p className="text-xs text-[var(--text-muted)]">{(order as any).vendor?.phone}</p>}
                        </div>
                    </div>

                    {/* Line items */}
                    {order.line_items?.length > 0 && (
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold mb-3">Line Items</h2>
                            <div className="space-y-2">
                                {order.line_items.map((item, i) => (
                                    <div key={i} className="flex justify-between p-3 rounded-xl bg-[var(--bg-card)]">
                                        <span className="text-sm">{item.description}</span>
                                        <span className="text-sm font-medium">{item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.total)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
