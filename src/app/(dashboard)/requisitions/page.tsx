'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Requisition, Profile } from '@/lib/types';

export default function RequisitionsPage() {
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        const { data } = await supabase
            .from('requisitions')
            .select('*, requester:profiles!requester_id(full_name, email)')
            .order('created_at', { ascending: false });

        setRequisitions(data || []);
        setLoading(false);
    };

    const handleApproval = async (id: string, action: 'approved' | 'rejected') => {
        setActionLoading(true);
        const res = await fetch('/api/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requisition_id: id, action }),
        });
        if (res.ok) {
            setSelectedReq(null);
            fetchData();
        }
        setActionLoading(false);
    };

    const columns = [
        { key: 'title', label: 'Title' },
        {
            key: 'requester',
            label: 'Requester',
            render: (_: unknown, row: Requisition) => (row as any).requester?.full_name || '—',
        },
        {
            key: 'total_amount',
            label: 'Amount',
            render: (val: unknown) => formatCurrency(val as number),
        },
        { key: 'priority', label: 'Priority', render: (val: unknown) => <Badge status={val as string} /> },
        { key: 'status', label: 'Status', render: (val: unknown) => <Badge status={val as string} /> },
        {
            key: 'created_at',
            label: 'Date',
            render: (val: unknown) => formatDate(val as string),
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <Header
                title="Requisitions"
                subtitle="Manage purchase requisitions and approval workflows"
                actions={
                    <a href="/requisitions/new" className="btn btn-primary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Requisition
                    </a>
                }
            />

            <div className="glass-card p-6">
                <DataTable
                    data={requisitions as unknown as Record<string, unknown>[]}
                    columns={columns as any}
                    exportFilename="requisitions"
                    onRowClick={(row) => setSelectedReq(row as unknown as Requisition)}
                />
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedReq}
                onClose={() => setSelectedReq(null)}
                title={selectedReq?.title || 'Requisition Details'}
            >
                {selectedReq && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Status</p>
                                <Badge status={selectedReq.status} />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Amount</p>
                                <p className="text-lg font-bold">{formatCurrency(selectedReq.total_amount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Priority</p>
                                <Badge status={selectedReq.priority} />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Created</p>
                                <p className="text-sm">{formatDate(selectedReq.created_at)}</p>
                            </div>
                        </div>

                        {selectedReq.description && (
                            <div>
                                <p className="text-xs text-[var(--text-muted)] mb-1">Description</p>
                                <p className="text-sm text-[var(--text-secondary)]">{selectedReq.description}</p>
                            </div>
                        )}

                        {/* Line Items */}
                        {selectedReq.line_items && selectedReq.line_items.length > 0 && (
                            <div>
                                <p className="text-xs text-[var(--text-muted)] mb-2">Line Items</p>
                                <div className="space-y-2">
                                    {selectedReq.line_items.map((item, i) => (
                                        <div key={i} className="flex justify-between p-2 rounded-lg bg-[var(--bg-card)]">
                                            <span className="text-sm">{item.description}</span>
                                            <span className="text-sm font-medium">
                                                {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Approval actions */}
                        {profile?.role === 'procurement_admin' && selectedReq.status === 'pending' && (
                            <div className="flex gap-3 pt-4 border-t border-[var(--border-primary)]">
                                <button
                                    onClick={() => handleApproval(selectedReq.id, 'approved')}
                                    disabled={actionLoading}
                                    className="btn btn-primary flex-1 justify-center"
                                >
                                    ✓ Approve
                                </button>
                                <button
                                    onClick={() => handleApproval(selectedReq.id, 'rejected')}
                                    disabled={actionLoading}
                                    className="btn btn-danger flex-1 justify-center"
                                >
                                    ✕ Reject
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
