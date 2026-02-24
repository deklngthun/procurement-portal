'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Contract, Vendor, Profile } from '@/lib/types';

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const supabase = createClient();

    const [title, setTitle] = useState('');
    const [vendorId, setVendorId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [value, setValue] = useState(0);
    const [notes, setNotes] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
        const { data } = await supabase.from('contracts').select('*, vendor:vendors(company_name)').order('created_at', { ascending: false });
        setContracts(data || []);
        const { data: v } = await supabase.from('vendors').select('*').eq('status', 'active');
        setVendors(v || []);
        setLoading(false);
    };

    const handleCreate = async () => {
        setFormLoading(true);
        let filePath: string | null = null;

        // Upload file to storage
        if (uploadFile && vendorId) {
            const ext = uploadFile.name.split('.').pop();
            const path = `${vendorId}/${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('contracts')
                .upload(path, uploadFile);
            if (!uploadError) filePath = path;
        }

        await supabase.from('contracts').insert({
            vendor_id: vendorId, title, file_path: filePath,
            start_date: startDate || null, end_date: endDate || null,
            value, status: 'active', notes: notes || null,
        });
        setShowCreate(false);
        setTitle(''); setVendorId(''); setStartDate(''); setEndDate(''); setValue(0); setNotes(''); setUploadFile(null);
        fetchData();
        setFormLoading(false);
    };

    const handleDownload = async (filePath: string) => {
        const { data } = await supabase.storage.from('contracts').createSignedUrl(filePath, 3600);
        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    };

    const columns = [
        { key: 'title', label: 'Title' },
        { key: 'vendor', label: 'Vendor', render: (_: unknown, row: any) => row.vendor?.company_name || '—' },
        { key: 'value', label: 'Value', render: (v: unknown) => formatCurrency(v as number) },
        { key: 'status', label: 'Status', render: (v: unknown) => <Badge status={v as string} /> },
        { key: 'start_date', label: 'Start', render: (v: unknown) => v ? formatDate(v as string) : '—' },
        { key: 'end_date', label: 'End', render: (v: unknown) => v ? formatDate(v as string) : '—' },
        {
            key: 'file_path', label: 'File', sortable: false, render: (v: unknown) =>
                v ? (
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(v as string); }} className="text-[var(--accent-primary)] hover:text-[var(--accent-hover)] text-xs font-medium">
                        📄 Download
                    </button>
                ) : '—'
        },
    ];

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div>
            <Header
                title="Contracts"
                subtitle="Manage vendor contracts and agreements"
                actions={
                    profile?.role === 'procurement_admin' ? (
                        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            New Contract
                        </button>
                    ) : null
                }
            />

            <div className="glass-card p-6">
                <DataTable data={contracts as unknown as Record<string, unknown>[]} columns={columns as any} exportFilename="contracts" />
            </div>

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Contract">
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Title *</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" /></div>
                    <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Vendor *</label>
                        <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="input-field">
                            <option value="">Select vendor...</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Start Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" /></div>
                        <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">End Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Contract Value ($)</label><input type="number" min={0} step={0.01} value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} className="input-field" /></div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Contract File</label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            className="input-field file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-[var(--accent-primary)] file:text-white"
                        />
                    </div>
                    <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field resize-none" rows={2} /></div>
                    <button onClick={handleCreate} disabled={!title || !vendorId || formLoading} className="btn btn-primary w-full justify-center">
                        {formLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Contract'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
