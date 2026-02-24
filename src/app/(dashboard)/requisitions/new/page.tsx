'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import type { LineItem } from '@/lib/types';

export default function NewRequisitionPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { description: '', quantity: 1, unit_price: 0, total: 0 },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
        const updated = [...lineItems];
        (updated[index] as any)[field] = value;
        updated[index].total = updated[index].quantity * updated[index].unit_price;
        setLineItems(updated);
    };

    const addLineItem = () => {
        setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length <= 1) return;
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0);

    const handleSubmit = async (e: React.FormEvent, asDraft: boolean) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error: err } = await supabase.from('requisitions').insert({
            requester_id: user.id,
            title,
            description,
            priority,
            line_items: lineItems,
            total_amount: totalAmount,
            status: asDraft ? 'draft' : 'pending',
        });

        if (err) {
            setError(err.message);
            setLoading(false);
        } else {
            router.push('/requisitions');
        }
    };

    return (
        <div>
            <Header title="New Requisition" subtitle="Create a new purchase requisition" />

            <form className="glass-card p-8 max-w-3xl space-y-6">
                {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Office Supplies Q1" className="input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Priority</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the requisition..." className="input-field resize-none" />
                </div>

                {/* Line Items */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Line Items</label>
                        <button type="button" onClick={addLineItem} className="btn btn-ghost text-xs">
                            + Add Item
                        </button>
                    </div>

                    <div className="space-y-3">
                        {lineItems.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-3 items-end p-3 rounded-xl bg-[var(--bg-card)]">
                                <div className="col-span-5">
                                    {idx === 0 && <p className="text-xs text-[var(--text-muted)] mb-1">Description</p>}
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                                        placeholder="Item name"
                                        className="input-field text-sm"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    {idx === 0 && <p className="text-xs text-[var(--text-muted)] mb-1">Qty</p>}
                                    <input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                                        className="input-field text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    {idx === 0 && <p className="text-xs text-[var(--text-muted)] mb-1">Unit $</p>}
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={item.unit_price}
                                        onChange={(e) => updateLineItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                        className="input-field text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    {idx === 0 && <p className="text-xs text-[var(--text-muted)] mb-1">Total</p>}
                                    <p className="input-field text-sm bg-transparent border-transparent font-medium">
                                        ${item.total.toFixed(2)}
                                    </p>
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeLineItem(idx)}
                                        className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-2"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end mt-4 p-3 rounded-xl bg-[var(--bg-card)]">
                        <p className="text-lg font-bold">
                            Total: <span className="gradient-text">${totalAmount.toFixed(2)}</span>
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading || !title} className="btn btn-secondary flex-1 justify-center">
                        Save as Draft
                    </button>
                    <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={loading || !title} className="btn btn-primary flex-1 justify-center">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Submit for Approval'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
