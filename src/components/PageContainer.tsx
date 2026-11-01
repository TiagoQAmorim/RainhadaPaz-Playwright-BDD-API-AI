import { cn } from "@/lib/cn";

export function PageContainer({
  children,
  className,
  wide,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto px-4",
        wide ? "max-w-7xl" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
