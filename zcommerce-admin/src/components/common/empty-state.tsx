import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { TbInbox } from "react-icons/tb";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = TbInbox,
  title = "Nothing here yet",
  description,
  action,
  className,
}: {
  icon?: IconType;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-12 text-center", className)}>
      <div className="bg-muted text-muted-foreground mb-1 flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6" />
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
