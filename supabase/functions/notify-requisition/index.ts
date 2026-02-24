// Supabase Edge Function — Email notification for new requisitions
// Deploy with: supabase functions deploy notify-requisition
// Set up a database webhook on INSERT to requisitions table

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RequisitionPayload {
    type: string;
    table: string;
    record: {
        id: string;
        title: string;
        status: string;
        total_amount: number;
        requester_id: string;
        created_at: string;
    };
}

Deno.serve(async (req) => {
    try {
        const payload: RequisitionPayload = await req.json();

        // Only send emails for requisitions with 'pending' status
        if (payload.record.status !== 'pending') {
            return new Response(JSON.stringify({ message: 'Not a pending requisition, skipping.' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Initialize Supabase admin client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get requester details
        const { data: requester } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', payload.record.requester_id)
            .single();

        // Get all procurement admins
        const { data: admins } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('role', 'procurement_admin');

        if (!admins || admins.length === 0) {
            return new Response(JSON.stringify({ message: 'No admins found.' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const adminEmails = admins.map((a) => a.email);
        const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
            payload.record.total_amount
        );

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'ProcureFlow <notifications@yourdomain.com>',
                to: adminEmails,
                subject: `New Requisition Pending Approval: ${payload.record.title}`,
                html: `
          <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; border-radius: 12px; color: white; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 20px;">📋 New Requisition</h1>
              <p style="margin: 8px 0 0; opacity: 0.9;">A new purchase requisition requires your approval.</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Title</td><td style="padding: 8px 0; font-weight: 600;">${payload.record.title}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Requester</td><td style="padding: 8px 0;">${requester?.full_name || 'Unknown'}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount</td><td style="padding: 8px 0; font-weight: 600; color: #6366f1;">${amount}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Status</td><td style="padding: 8px 0;"><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Pending</span></td></tr>
              </table>
            </div>
            <p style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
              Log in to ProcureFlow to review and approve this requisition.
            </p>
          </div>
        `,
            }),
        });

        const emailResult = await emailResponse.json();

        return new Response(JSON.stringify({ success: true, result: emailResult }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
