'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide sidebar on the main cases list page and root
  const showSidebar = pathname !== '/' && pathname !== '/cases' && pathname !== '/cases/new';

  return (
    <>
      {showSidebar && <Sidebar />}
      <div className={`flex-1 flex flex-col min-h-screen ${showSidebar ? 'ml-64' : ''}`}>
        <Topbar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </>
  );
}
