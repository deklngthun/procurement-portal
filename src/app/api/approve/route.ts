import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify the user is a procurement_admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'procurement_admin') {
            return NextResponse.json({ error: 'Forbidden: Only procurement admins can approve/reject requisitions' }, { status: 403 });
        }

        const body = await request.json();
        const { requisition_id, action } = body;

        if (!requisition_id || !['approved', 'rejected'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Verify the requisition is in 'pending' status
        const { data: req } = await supabase
            .from('requisitions')
            .select('status')
            .eq('id', requisition_id)
            .single();

        if (!req) {
            return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
        }

        if (req.status !== 'pending') {
            return NextResponse.json({ error: `Cannot ${action} a requisition with status '${req.status}'` }, { status: 400 });
        }

        // Perform the update
        const { error } = await supabase
            .from('requisitions')
            .update({
                status: action,
                approved_by: user.id,
                approved_at: new Date().toISOString(),
            })
            .eq('id', requisition_id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, status: action });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
