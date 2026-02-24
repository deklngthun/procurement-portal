// ============================================================
// TypeScript types mirroring the Supabase database schema
// ============================================================

export type UserRole = 'employee' | 'procurement_admin' | 'vendor';
export type RequisitionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'ordered';
export type POStatus = 'draft' | 'issued' | 'acknowledged' | 'shipped' | 'delivered' | 'cancelled';
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated';

export interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Vendor {
    id: string;
    user_id: string | null;
    company_name: string;
    contact_email: string;
    phone: string | null;
    address: string | null;
    category: string | null;
    status: string;
    rating: number;
    created_at: string;
    updated_at: string;
}

export interface LineItem {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
}

export interface Product {
    id: string;
    vendor_id: string;
    name: string;
    sku: string | null;
    description: string | null;
    unit_price: number;
    stock_quantity: number;
    category: string | null;
    created_at: string;
    updated_at: string;
    vendor?: Vendor;
}

export interface Requisition {
    id: string;
    requester_id: string;
    title: string;
    description: string | null;
    line_items: LineItem[];
    total_amount: number;
    status: RequisitionStatus;
    priority: string;
    approved_by: string | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
    requester?: Profile;
    approver?: Profile;
}

export interface PurchaseOrder {
    id: string;
    po_number: string;
    vendor_id: string;
    requisition_id: string | null;
    created_by: string;
    line_items: LineItem[];
    total_amount: number;
    status: POStatus;
    expected_delivery: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    vendor?: Vendor;
    requisition?: Requisition;
    creator?: Profile;
}

export interface Contract {
    id: string;
    vendor_id: string;
    title: string;
    file_path: string | null;
    start_date: string | null;
    end_date: string | null;
    value: number;
    status: ContractStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
    vendor?: Vendor;
}

// Navigation item for sidebar
export interface NavItem {
    label: string;
    href: string;
    icon: string;
    roles: UserRole[];
}
