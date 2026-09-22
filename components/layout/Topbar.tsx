'use client';

import { usePathname } from 'next/navigation';
import { Search, ChevronRight, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Topbar() {
  const pathname = usePathname();
  
  const segments = pathname.split('/').filter(Boolean);
  
  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex-1 flex items-center gap-4">
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 tracking-wide">
          <Home className="w-4 h-4" />
          
          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              <span className={idx === segments.length - 1 ? 'text-foreground' : 'text-muted-foreground'}>
                {seg === 'cases' ? 'Cases' : seg}
              </span>
            </div>
          ))}
          {segments.length === 0 && (
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              <span className="text-foreground">Overview</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input type="text" placeholder="Search..." className="pl-9 h-9" />
        </div>
        <div className="flex items-center gap-3 border-l pl-6">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">A</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">Analyst</span>
            <span className="text-xs text-muted-foreground mt-1">Investigation Team</span>
          </div>
        </div>
      </div>
    </header>
  );
}
