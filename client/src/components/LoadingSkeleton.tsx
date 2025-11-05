import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-0 pb-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
        <div className="h-3 w-40 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

export function CreditCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div>
            <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="h-2 w-full bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-muted animate-pulse rounded" />
          <div className="h-16 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomerCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
        <div className="flex-1">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-40 bg-muted animate-pulse rounded" />
        <div className="h-4 w-36 bg-muted animate-pulse rounded" />
        <div className="h-4 w-44 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}
