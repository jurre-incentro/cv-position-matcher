import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScanStatus } from "@/lib/types";

const statusConfig = {
  queued: {
    label: "In wachtrij",
    className: "bg-sky/10 text-sky",
    icon: Clock,
  },
  processing: {
    label: "Bezig",
    className: "bg-copper/10 text-copper",
    icon: Loader2,
  },
  completed: {
    label: "Klaar",
    className: "bg-moss/10 text-moss",
    icon: CheckCircle2,
  },
  failed: {
    label: "Fout",
    className: "bg-red-100 text-red-700",
    icon: XCircle,
  },
} satisfies Record<ScanStatus, { label: string; className: string; icon: LucideIcon }>;

export function StatusBadge({ status }: { status: ScanStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", config.className)}>
      <Icon className={cn("h-3.5 w-3.5", status === "processing" && "animate-spin")} />
      {config.label}
    </span>
  );
}
