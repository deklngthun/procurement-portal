import { redirect } from 'next/navigation';

// This page is at the root `/` URL due to the (dashboard) route group.
// Since root app/page.tsx handles `/`, this is effectively unreachable.
// Redirect to /home just in case.
export default function DashboardRootRedirect() {
    redirect('/home');
}
