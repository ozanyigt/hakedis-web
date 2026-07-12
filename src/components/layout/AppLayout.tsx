import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-surface lg:flex-row">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
