'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import type { Vendor, Profile } from '@/lib/types';

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const [companyName, setCompanyName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
        const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
        setVendors(data || []);
        setLoading(false);
    };

    const handleCreate = async () => {
        setFormLoading(true);
        await supabase.from('vendors').insert({
            company_name: companyName,
            contact_email: contactEmail,
            phone: phone || null,
            address: address || null,
            category: category || null,
        });
        setShowCreate(false);
        setCompanyName(''); setContactEmail(''); setPhone(''); setAddress(''); setCategory('');
        fetchData();
        setFormLoading(false);
    };

    const columns = [
        { key: 'company_name', label: 'Company' },
        { key: 'contact_email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'category', label: 'Category', render: (v: unknown) => v || '—' },
        {
            key: 'rating', label: 'Rating', render: (v: unknown) => {
                const r = v as number;
                return <span className="text-amber-400">{'★'.repeat(Math.round(r))}{'☆'.repeat(5 - Math.round(r))}</span>;
            }
        },
        { key: 'status', label: 'Status', render: (v: unknown) => <Badge status={v as string} /> },
        { key: 'created_at', label: 'Added', render: (v: unknown) => formatDate(v as string) },
    ];

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div>
            <Header
                title="Vendors"
                subtitle="Manage supplier relationships"
                actions={
                    profile?.role === 'procurement_admin' ? (
                        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Vendor
                        </button>
                    ) : null
                }
            />

            <div className="glass-card p-6">
                <DataTable data={vendors as unknown as Record<string, unknown>[]} columns={columns as any} exportFilename="vendors" onRowClick={(row) => router.push(`/vendors/${(row as any).id}`)} />
            </div>

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New Vendor">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Company Name *</label>
                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-field" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Contact Email *</label>
                        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="input-field" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Phone</label>
                            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Category</label>
                            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="input-field" placeholder="e.g., IT, Office" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Address</label>
                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input-field resize-none" rows={2} />
                    </div>
                    <button onClick={handleCreate} disabled={!companyName || !contactEmail || formLoading} className="btn btn-primary w-full justify-center">
                        {formLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add Vendor'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
