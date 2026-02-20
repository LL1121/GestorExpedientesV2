import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export default function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-slate-200 dark:bg-slate-700 rounded",
        animate && "animate-pulse",
        className
      )}
    />
  );
}

// Skeleton para tarjeta de estadísticas
export function SkeletonCard() {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
      <Skeleton className="h-6 w-12 mb-2" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

// Skeleton para alerta/fila
export function SkeletonAlert() {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <Skeleton className="h-5 w-5 rounded shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

// Skeleton para sección colapsable
export function SkeletonSection() {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <Skeleton className="h-14 w-full" />
      <div className="p-4 space-y-2">
        <SkeletonAlert />
        <SkeletonAlert />
      </div>
    </div>
  );
}
