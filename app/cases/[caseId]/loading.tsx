import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function CaseDashboardLoading() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-pulse">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-64 bg-muted rounded-md"></div>
            <div className="h-6 w-20 bg-muted rounded-full"></div>
          </div>
          <div className="h-6 w-32 bg-muted rounded-md"></div>
          <div className="h-16 w-[600px] bg-muted rounded-md mt-4"></div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 bg-muted rounded-md"></div>
          <div className="h-10 w-24 bg-muted rounded-md"></div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded-md"></div>
              <div className="h-4 w-4 bg-muted rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded-md mb-1"></div>
              <div className="h-3 w-24 bg-muted rounded-md"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="h-6 w-32 bg-muted rounded-md"></div>
            <div className="h-8 w-24 bg-muted rounded-md"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-muted rounded-md"></div>
                      <div className="h-3 w-24 bg-muted rounded-md"></div>
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-muted rounded-full"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="h-6 w-32 bg-muted rounded-md"></div>
            <div className="h-4 w-4 bg-muted rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg border space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="h-4 w-32 bg-muted rounded-md"></div>
                    <div className="h-5 w-16 bg-muted rounded-full"></div>
                  </div>
                  <div className="h-8 w-full bg-muted rounded-md"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
