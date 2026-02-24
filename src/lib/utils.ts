import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return inputs.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function exportToCSV<T extends Record<string, unknown>>(
    data: T[],
    filename: string
): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map((row) =>
            headers
                .map((h) => {
                    const val = row[h];
                    const str = val === null || val === undefined ? '' : String(val);
                    return `"${str.replace(/"/g, '""')}"`;
                })
                .join(',')
        ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        // Requisitions
        draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
        pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
        ordered: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        // POs
        issued: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        acknowledged: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        shipped: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
        delivered: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
        // Contracts
        active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        expired: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        terminated: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
}

export function generatePONumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PO-${date}-${rand}`;
}
