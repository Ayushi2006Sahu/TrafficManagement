import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar, TopBar } from '@/components/layout/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-dark-950 page-grid">
      <Sidebar userEmail={user.email} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
