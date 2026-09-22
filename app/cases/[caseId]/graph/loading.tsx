import { Loader2 } from 'lucide-react';

export default function GraphLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-pulse">
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div className="space-y-3">
          <div className="h-8 w-80 bg-muted rounded-md"></div>
          <div className="h-4 w-96 bg-muted rounded-md"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 bg-muted rounded-md"></div>
          <div className="h-10 w-40 bg-muted rounded-md"></div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="h-10 w-96 bg-muted rounded-md"></div>
      </div>

      <div className="flex-1 min-h-0 bg-muted rounded-xl flex items-center justify-center border">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Rendering Graph...</p>
        </div>
      </div>
    </div>
  );
}
