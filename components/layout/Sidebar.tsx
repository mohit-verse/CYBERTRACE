/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { Link } from 'next-view-transitions';
import { usePathname } from 'next/navigation';
import { Briefcase, FileText, Activity, Share2, Network, ShieldAlert, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  
  // Extract caseId from pathname if we are inside a case (e.g. /cases/123/evidence)
  const caseIdMatch = pathname.match(/^\/cases\/([^\/]+)/);
  const caseId = caseIdMatch ? caseIdMatch[1] : null;

  const inCase = !!caseId && caseId !== 'new';

  const navItems = [
    { name: 'Cases', href: '/cases', icon: Briefcase, exact: true },
    ...(inCase ? [
      { name: 'Overview', href: `/cases/${caseId}`, icon: Activity, exact: true },
      { name: 'Evidence', href: `/cases/${caseId}/evidence`, icon: FileText, exact: false },
      { name: 'Investigation', href: `/cases/${caseId}/investigation`, icon: ShieldAlert, exact: false },
      { name: 'Graph', href: `/cases/${caseId}/graph`, icon: Network, exact: false },
      { name: 'Reports', href: `/cases/${caseId}/reports`, icon: BarChart, exact: false },
    ] : [])
  ];

  return (
    <aside className="w-64 border-r bg-background flex flex-col fixed inset-y-0 left-0 z-50">
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/" className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight leading-tight">CYBERTRACE</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          System Online
        </div>
      </div>
    </aside>
  );
}
