'use client';

import React, { useState, useMemo } from 'react';
import { exportToCSV } from '@/lib/utils';

interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
    data: T[];
    columns: Column<T>[];
    searchable?: boolean;
    exportable?: boolean;
    exportFilename?: string;
    onRowClick?: (row: T) => void;
    pageSize?: number;
}

export default function DataTable<T extends Record<string, unknown>>({
    data,
    columns,
    searchable = true,
    exportable = true,
    exportFilename = 'export',
    onRowClick,
    pageSize = 10,
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        if (!search) return data;
        const q = search.toLowerCase();
        return data.filter((row) =>
            columns.some((col) => {
                const val = row[col.key];
                return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
            })
        );
    }, [data, search, columns]);

    const sorted = useMemo(() => {
        if (!sortKey) return filtered;
        return [...filtered].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
            const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir]);

    const paged = useMemo(() => {
        return sorted.slice(page * pageSize, (page + 1) * pageSize);
    }, [sorted, page, pageSize]);

    const totalPages = Math.ceil(sorted.length / pageSize);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const handleExport = () => {
        const flat = filtered.map((row) => {
            const out: Record<string, unknown> = {};
            columns.forEach((col) => {
                out[col.label] = row[col.key];
            });
            return out;
        });
        exportToCSV(flat, exportFilename);
    };

    return (
        <div className="w-full">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                {searchable && (
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                        className="input-field max-w-xs"
                    />
                )}
                <div className="flex items-center gap-2">
                    {exportable && (
                        <button onClick={handleExport} className="btn btn-secondary text-xs">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </button>
                    )}
                    <span className="text-xs text-[var(--text-muted)]">
                        {sorted.length} record{sorted.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)]">
                <table className="data-table w-full">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => col.sortable !== false && handleSort(col.key)}
                                    className={col.sortable !== false ? 'cursor-pointer' : ''}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {sortKey === col.key && (
                                            <span className="text-[var(--accent-primary)]">
                                                {sortDir === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-12 text-[var(--text-muted)]">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            paged.map((row, idx) => (
                                <tr
                                    key={idx}
                                    onClick={() => onRowClick?.(row)}
                                    className={onRowClick ? 'cursor-pointer' : ''}
                                >
                                    {columns.map((col) => (
                                        <td key={col.key}>
                                            {col.render
                                                ? col.render(row[col.key], row)
                                                : (row[col.key] as React.ReactNode) ?? '—'}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="btn btn-ghost text-xs"
                    >
                        ← Previous
                    </button>
                    <span className="text-xs text-[var(--text-muted)]">
                        Page {page + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="btn btn-ghost text-xs"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
