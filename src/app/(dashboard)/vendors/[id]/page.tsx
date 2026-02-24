'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Vendor, PurchaseOrder, Contract, Product, Profile } from '@/lib/types';

export default function VendorDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit modal state
    const [showEdit, setShowEdit] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('active');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        const { data: v } = await supabase.from('vendors').select('*').eq('id', id).single();
        setVendor(v);

        if (v) {
            setCompanyName(v.company_name);
            setContactEmail(v.contact_email);
            setPhone(v.phone || '');
            setAddress(v.address || '');
            setCategory(v.category || '');
            setStatus(v.status);
        }

        const { data: po } = await supabase
            .from('purchase_orders')
            .select('*')
            .eq('vendor_id', id)
            .order('created_at', { ascending: false });
        setOrders(po || []);

        const { data: c } = await supabase
            .from('contracts')
            .select('*')
            .eq('vendor_id', id)
            .order('created_at', { ascending: false });
        setContracts(c || []);

        const { data: p } = await supabase
            .from('products_catalog')
            .select('*')
            .eq('vendor_id', id)
            .order('created_at', { ascending: false });
        setProducts(p || []);

        setLoading(false);
    };

    const handleUpdate = async () => {
        setEditLoading(true);
        await supabase.from('vendors').update({
            company_name: companyName,
            contact_email: contactEmail,
            phone: phone || null,
            address: address || null,
            category: category || null,
            status,
        }).eq('id', id);
        setShowEdit(false);
        fetchData();
        setEditLoading(false);
    };

    const poColumns = [
        { key: 'po_number', label: 'PO #' },
        { key: 'total_amount', label: 'Amount', render: (v: unknown) => formatCurrency(v as number) },
        { key: 'status', label: 'Status', render: (v: unknown) => <Badge status={v as string} /> },
        { key: 'expected_delivery', label: 'Delivery', render: (v: unknown) => v ? formatDate(v as string) : '—' },
        { key: 'created_at', label: 'Created', render: (v: unknown) => formatDate(v as string) },
    ];

    const contractColumns = [
        { key: 'title', label: 'Title' },
        { key: 'value', label: 'Value', render: (v: unknown) => formatCurrency(v as number) },
        { key: 'status', label: 'Status', render: (v: unknown) => <Badge status={v as string} /> },
        { key: 'start_date', label: 'Start', render: (v: unknown) => v ? formatDate(v as string) : '—' },
        { key: 'end_date', label: 'End', render: (v: unknown) => v ? formatDate(v as string) : '—' },
    ];

    const productColumns = [
        { key: 'name', label: 'Product' },
        { key: 'sku', label: 'SKU', render: (v: unknown) => v || '—' },
        { key: 'unit_price', label: 'Price', render: (v: unknown) => formatCurrency(v as number) },
        {
            key: 'stock_quantity', label: 'Stock', render: (v: unknown) => {
                const qty = v as number;
                return <span className={qty < 10 ? 'text-red-400 font-medium' : qty < 50 ? 'text-amber-400' : 'text-emerald-400'}>{qty}</span>;
            }
        },
        { key: 'category', label: 'Category', render: (v: unknown) => v || '—' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!vendor) {
        return <div className="text-center py-20 text-[var(--text-muted)]">Vendor not found.</div>;
    }

    const totalPOValue = orders.reduce((sum, po) => sum + po.total_amount, 0);
    const totalContractValue = contracts.reduce((sum, c) => sum + c.value, 0);

    return (
        <div>
            <Header
                title={vendor.company_name}
                subtitle="Vendor profile & relationship overview"
                actions={
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/vendors')} className="btn btn-ghost text-xs">
                            ← Back to Vendors
                        </button>
                        {profile?.role === 'procurement_admin' && (
                            <button onClick={() => setShowEdit(true)} className="btn btn-primary">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Vendor
                            </button>
                        )}
                    </div>
                }
            />

            {/* Vendor Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Profile Card */}
                <div className="glass-card p-6 lg:col-span-1">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-amber-500/25">
                            {vendor.company_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">{vendor.company_name}</h2>
                            <Badge status={vendor.status} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-[var(--text-secondary)]">{vendor.contact_email}</span>
                        </div>
                        {vendor.phone && (
                            <div className="flex items-center gap-3">
                                <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="text-sm text-[var(--text-secondary)]">{vendor.phone}</span>
                            </div>
                        )}
                        {vendor.address && (
                            <div className="flex items-start gap-3">
                                <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm text-[var(--text-secondary)]">{vendor.address}</span>
                            </div>
                        )}
                        {vendor.category && (
                            <div className="flex items-center gap-3">
                                <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="text-sm text-[var(--text-secondary)]">{vendor.category}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            <span className="text-amber-400 text-sm">
                                {'★'.repeat(Math.round(vendor.rating))}{'☆'.repeat(5 - Math.round(vendor.rating))}
                                <span className="text-[var(--text-muted)] ml-1">({vendor.rating.toFixed(1)})</span>
                            </span>
                        </div>
                        <div className="pt-3 border-t border-[var(--border-primary)]">
                            <p className="text-xs text-[var(--text-muted)]">Member since</p>
                            <p className="text-sm text-[var(--text-secondary)]">{formatDate(vendor.created_at)}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-500/20 to-blue-600/5 border-blue-500/20 p-6">
                        <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Purchase Orders</p>
                        <p className="text-3xl font-bold text-[var(--text-primary)]">{orders.length}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Total: {formatCurrency(totalPOValue)}</p>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-500/20 to-violet-600/5 border-violet-500/20 p-6">
                        <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Contracts</p>
                        <p className="text-3xl font-bold text-[var(--text-primary)]">{contracts.length}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Value: {formatCurrency(totalContractValue)}</p>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 p-6">
                        <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Products</p>
                        <p className="text-3xl font-bold text-[var(--text-primary)]">{products.length}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">In catalog</p>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-500/20 to-amber-600/5 border-amber-500/20 p-6">
                        <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Active POs</p>
                        <p className="text-3xl font-bold text-[var(--text-primary)]">
                            {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">In progress</p>
                    </div>
                </div>
            </div>

            {/* Tabbed Data Sections */}
            <div className="space-y-6">
                {/* Purchase Orders */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                        Purchase Orders
                    </h2>
                    <DataTable
                        data={orders as unknown as Record<string, unknown>[]}
                        columns={poColumns as any}
                        exportFilename={`vendor-${vendor.company_name}-pos`}
                        onRowClick={(row) => router.push(`/purchase-orders/${(row as any).id}`)}
                    />
                </div>

                {/* Contracts */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Contracts
                    </h2>
                    <DataTable
                        data={contracts as unknown as Record<string, unknown>[]}
                        columns={contractColumns as any}
                        exportFilename={`vendor-${vendor.company_name}-contracts`}
                    />
                </div>

                {/* Products */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Products
                    </h2>
                    <DataTable
                        data={products as unknown as Record<string, unknown>[]}
                        columns={productColumns as any}
                        exportFilename={`vendor-${vendor.company_name}-products`}
                    />
                </div>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Vendor">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Company Name *</label>
                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Contact Email *</label>
                        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="input-field" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Phone</label>
                            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Category</label>
                            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="input-field" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Address</label>
                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input-field resize-none" rows={2} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <button onClick={handleUpdate} disabled={!companyName || !contactEmail || editLoading} className="btn btn-primary w-full justify-center">
                        {editLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
