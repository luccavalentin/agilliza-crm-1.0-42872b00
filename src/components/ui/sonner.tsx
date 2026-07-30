import { Toaster as Sonner } from "sonner";
import { CheckCircle2, AlertTriangle, XCircle, Info, Loader2 } from "lucide-react";
import symbol from "@/assets/brand/agilliza-symbol-oficial.png";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Badge = ({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "error" | "warning" | "info" | "loading";
}) => {
  const tones: Record<string, string> = {
    success: "bg-emerald-500/12 text-emerald-600 ring-emerald-500/25",
    error: "bg-destructive/12 text-destructive ring-destructive/25",
    warning: "bg-amber-500/12 text-amber-600 ring-amber-500/25",
    info: "bg-primary/12 text-primary ring-primary/25",
    loading: "bg-muted text-muted-foreground ring-border",
  };
  return (
    <span
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}
    >
      {children}
      <img
        src={symbol}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-[4px] bg-background object-contain p-[1px] shadow-sm"
      />
    </span>
  );
};

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      expand
      visibleToasts={4}
      gap={12}
      offset={20}
      duration={4500}
      icons={{
        success: (
          <Badge tone="success">
            <CheckCircle2 className="h-4 w-4" />
          </Badge>
        ),
        error: (
          <Badge tone="error">
            <XCircle className="h-4 w-4" />
          </Badge>
        ),
        warning: (
          <Badge tone="warning">
            <AlertTriangle className="h-4 w-4" />
          </Badge>
        ),
        info: (
          <Badge tone="info">
            <Info className="h-4 w-4" />
          </Badge>
        ),
        loading: (
          <Badge tone="loading">
            <Loader2 className="h-4 w-4 animate-spin" />
          </Badge>
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast pointer-events-auto group-[.toaster]:w-full group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/70 group-[.toaster]:shadow-[0_10px_30px_-12px_hsl(var(--foreground)/0.28)] group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:gap-3 group-[.toaster]:items-center",
          title: "group-[.toast]:font-semibold group-[.toast]:text-[0.875rem] group-[.toast]:leading-tight",
          description:
            "group-[.toast]:text-muted-foreground group-[.toast]:text-[0.78rem] group-[.toast]:leading-snug",
          icon: "group-[.toast]:m-0",
          closeButton:
            "group-[.toast]:bg-background group-[.toast]:border-border group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-emerald-500",
          error: "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-destructive",
          warning: "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-amber-500",
          info: "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-primary",
          loading: "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-muted-foreground/40",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
