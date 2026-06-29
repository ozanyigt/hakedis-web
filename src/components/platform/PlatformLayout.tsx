import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PlatformHeader } from '@/components/platform/PlatformHeader';
import { PlatformSidebar } from '@/components/platform/PlatformSidebar';

export function PlatformLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface lg:flex">
      <PlatformSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <PlatformHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
