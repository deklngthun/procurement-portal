'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { PurchaseOrder, Vendor, Profile } from '@/lib/types';

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const supabase = createClient();

    // Form state
    const [vendorId, setVendorId] = useState('');
    const [expectedDelivery, setExpectedDelivery] = useState('');
    const [notes, setNotes] = useState('');
    const [poItems, setPoItems] = useState([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
        const { data: po } = await supabase
            .from('purchase_orders')
            .select('*, vendor:vendors(company_name), creator:profiles!created_by(full_name)')
            .order('created_at', { ascending: false });
        setOrders(po || []);
        const { data: v } = await supabase.from('vendors').select('*').eq('status', 'active');
        setVendors(v || []);
        setLoading(false);
    };

    const handleCreatePO = async () => {
        setFormLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const total = poItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
        const items = poItems.map(i => ({ ...i, total: i.quantity * i.unit_price }));
        await supabase.from('purchase_orders').insert({
            vendor_id: vendorId,
            created_by: user.id,
            line_items: items,
            total_amount: total,
            status: 'issued',
            expected_delivery: expectedDelivery || null,
            notes: notes || null,
            po_number: '',
        });
        setShowCreate(false);
        setVendorId(''); setExpectedDelivery(''); setNotes('');
        setPoItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
        fetchData();
        setFormLoading(false);
    };

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('purchase_orders').update({ status }).eq('id', id);
        setSelectedPO(null);
        fetchData();
    };

    const columns = [
        { key: 'po_number', label: 'PO #' },
        { key: 'vendor', label: 'Vendor', render: (_: unknown, row: any) => row.vendor?.company_name || '—' },
        { key: 'total_amount', label: 'Amount', render: (v: unknown) => formatCurrency(v as number) },
        { key: 'status', label: 'Status', render: (v: unknown) => <Badge status={v as string} /> },
        { key: 'expected_delivery', label: 'Delivery', render: (v: unknown) => v ? formatDate(v as string) : '—' },
        { key: 'created_at', label: 'Created', render: (v: unknown) => formatDate(v as string) },
    ];

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div>
            <Header
                title="Purchase Orders"
                subtitle="Track and manage purchase orders"
                actions={
                    profile?.role === 'procurement_admin' ? (
                        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            New PO
                        </button>
                    ) : null
                }
            />

            <div className="glass-card p-6">
                <DataTable data={orders as unknown as Record<string, unknown>[]} columns={columns as any} exportFilename="purchase-orders" onRowClick={(row) => setSelectedPO(row as unknown as PurchaseOrder)} />
            </div>

            {/* Create PO Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Purchase Order">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Vendor</label>
                        <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="input-field">
                            <option value="">Select vendor...</option>
                            {vendors.map((v) => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Expected Delivery</label>
                        <input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} className="input-field" />
                    </div>
                    {poItems.map((item, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-5"><input type="text" placeholder="Item" value={item.description} onChange={(e) => { const u = [...poItems]; u[i].description = e.target.value; setPoItems(u); }} className="input-field text-sm" /></div>
                            <div className="col-span-2"><input type="number" min={1} value={item.quantity} onChange={(e) => { const u = [...poItems]; u[i].quantity = parseInt(e.target.value) || 0; setPoItems(u); }} className="input-field text-sm" /></div>
                            <div className="col-span-3"><input type="number" min={0} step={0.01} placeholder="Price" value={item.unit_price} onChange={(e) => { const u = [...poItems]; u[i].unit_price = parseFloat(e.target.value) || 0; setPoItems(u); }} className="input-field text-sm" /></div>
                            <div className="col-span-2 text-sm font-medium text-right">${(item.quantity * item.unit_price).toFixed(2)}</div>
                        </div>
                    ))}
                    <button type="button" onClick={() => setPoItems([...poItems, { description: '', quantity: 1, unit_price: 0, total: 0 }])} className="btn btn-ghost text-xs">+ Add Item</button>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field resize-none" rows={2} />
                    </div>
                    <button onClick={handleCreatePO} disabled={!vendorId || formLoading} className="btn btn-primary w-full justify-center">Create Purchase Order</button>
                </div>
            </Modal>

            {/* PO Detail Modal */}
            <Modal isOpen={!!selectedPO} onClose={() => setSelectedPO(null)} title={`PO: ${selectedPO?.po_number || ''}`}>
                {selectedPO && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-xs text-[var(--text-muted)]">Status</p><Badge status={selectedPO.status} /></div>
                            <div><p className="text-xs text-[var(--text-muted)]">Amount</p><p className="text-lg font-bold">{formatCurrency(selectedPO.total_amount)}</p></div>
                            <div><p className="text-xs text-[var(--text-muted)]">Vendor</p><p className="text-sm">{(selectedPO as any).vendor?.company_name}</p></div>
                            <div><p className="text-xs text-[var(--text-muted)]">Delivery</p><p className="text-sm">{selectedPO.expected_delivery ? formatDate(selectedPO.expected_delivery) : '—'}</p></div>
                        </div>
                        {selectedPO.line_items?.length > 0 && (
                            <div>
                                <p className="text-xs text-[var(--text-muted)] mb-2">Items</p>
                                {selectedPO.line_items.map((item, i) => (
                                    <div key={i} className="flex justify-between p-2 rounded-lg bg-[var(--bg-card)] mb-1">
                                        <span className="text-sm">{item.description}</span>
                                        <span className="text-sm font-medium">{item.quantity} × {formatCurrency(item.unit_price)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Status progression for admin/vendor */}
                        {(profile?.role === 'procurement_admin' || profile?.role === 'vendor') && (
                            <div className="pt-4 border-t border-[var(--border-primary)]">
                                <p className="text-xs text-[var(--text-muted)] mb-2">Update Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {['issued', 'acknowledged', 'shipped', 'delivered', 'cancelled'].filter(s => s !== selectedPO.status).map(s => (
                                        <button key={s} onClick={() => updateStatus(selectedPO.id, s)} className="btn btn-secondary text-xs capitalize">{s}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
