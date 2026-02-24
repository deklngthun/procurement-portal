'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Product, Vendor, Profile } from '@/lib/types';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const supabase = createClient();

    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [description, setDescription] = useState('');
    const [unitPrice, setUnitPrice] = useState(0);
    const [stockQty, setStockQty] = useState(0);
    const [vendorId, setVendorId] = useState('');
    const [categ, setCateg] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
        const { data } = await supabase.from('products_catalog').select('*, vendor:vendors(company_name)').order('created_at', { ascending: false });
        setProducts(data || []);
        const { data: v, error: vErr } = await supabase.from('vendors').select('*').order('company_name');
        if (vErr) console.error('Failed to fetch vendors:', vErr);
        setVendors(v || []);
        setLoading(false);
    };

    const handleCreate = async () => {
        setFormLoading(true);
        await supabase.from('products_catalog').insert({
            vendor_id: vendorId, name, sku: sku || null,
            description: description || null, unit_price: unitPrice,
            stock_quantity: stockQty, category: categ || null,
        });
        setShowCreate(false);
        setName(''); setSku(''); setDescription(''); setUnitPrice(0); setStockQty(0); setVendorId(''); setCateg('');
        fetchData();
        setFormLoading(false);
    };

    const columns = [
        { key: 'name', label: 'Product' },
        { key: 'sku', label: 'SKU', render: (v: unknown) => v || '—' },
        { key: 'vendor', label: 'Vendor', render: (_: unknown, row: any) => row.vendor?.company_name || '—' },
        { key: 'unit_price', label: 'Price', render: (v: unknown) => formatCurrency(v as number) },
        {
            key: 'stock_quantity', label: 'Stock', render: (v: unknown) => {
                const qty = v as number;
                return <span className={qty < 10 ? 'text-red-400 font-medium' : qty < 50 ? 'text-amber-400' : 'text-emerald-400'}>{qty}</span>;
            }
        },
        { key: 'category', label: 'Category', render: (v: unknown) => v || '—' },
    ];

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div>
            <Header
                title="Product Catalog"
                subtitle="Browse products from all vendors"
                actions={
                    (profile?.role === 'procurement_admin' || profile?.role === 'vendor') ? (
                        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Product
                        </button>
                    ) : null
                }
            />

            <div className="glass-card p-6">
                <DataTable data={products as unknown as Record<string, unknown>[]} columns={columns as any} exportFilename="products" />
            </div>

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Product">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" /></div>
                        <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">SKU</label><input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="input-field" /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Vendor *</label>
                        <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="input-field">
                            <option value="">Select vendor...</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Price *</label><input type="number" min={0} step={0.01} value={unitPrice} onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)} className="input-field" /></div>
                        <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Stock *</label><input type="number" min={0} value={stockQty} onChange={(e) => setStockQty(parseInt(e.target.value) || 0)} className="input-field" /></div>
                        <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Category</label><input type="text" value={categ} onChange={(e) => setCateg(e.target.value)} className="input-field" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field resize-none" rows={2} /></div>
                    <button onClick={handleCreate} disabled={!name || !vendorId || formLoading} className="btn btn-primary w-full justify-center">
                        {formLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add Product'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
