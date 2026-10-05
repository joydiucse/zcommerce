import type { ReactNode } from "react";
import { TbLoader2 } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FormSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("gap-5", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function SubmitButton({
  loading,
  children,
  className,
  disabled,
  form,
}: {
  loading?: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  form?: string;
}) {
  return (
    <Button type="submit" form={form} disabled={loading || disabled} className={className}>
      {loading && <TbLoader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
