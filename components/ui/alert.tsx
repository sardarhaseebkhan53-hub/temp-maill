import { cn } from "@/lib/utils";

export function Alert({
  className,
  variant = "info",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "info" | "warning" | "success" | "danger" }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        variant === "info" && "border-primary/20 bg-primary/5 text-foreground",
        variant === "warning" && "border-warning/30 bg-warning/10",
        variant === "success" && "border-success/30 bg-success/10",
        variant === "danger" && "border-destructive/30 bg-destructive/10",
        className,
      )}
      {...props}
    />
  );
}
