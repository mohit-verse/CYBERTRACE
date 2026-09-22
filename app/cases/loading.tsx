import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function CasesLoading() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 bg-muted animate-pulse rounded-md mb-2"></div>
          <div className="h-4 w-48 bg-muted animate-pulse rounded-md"></div>
        </div>
        <div className="h-10 w-40 bg-muted animate-pulse rounded-md"></div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded-md"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded-md mb-1"></div>
              <div className="h-3 w-20 bg-muted animate-pulse rounded-md"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
      </div>

      <Card>
        <div className="p-4 border-b">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-muted animate-pulse rounded-md"></div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded-md"></div>
            <div className="h-4 w-16 bg-muted animate-pulse rounded-md"></div>
            <div className="h-4 w-24 bg-muted animate-pulse rounded-md"></div>
          </div>
        </div>
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-48 bg-muted animate-pulse rounded-md"></div>
                <div className="h-4 w-64 bg-muted animate-pulse rounded-md"></div>
              </div>
              <div className="h-8 w-20 bg-muted animate-pulse rounded-md"></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
