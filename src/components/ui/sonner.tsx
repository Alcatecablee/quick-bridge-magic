import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-md",
          title: "group-[.toast]:text-foreground group-[.toast]:font-medium",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80",
          closeButton:
            "group-[.toast]:bg-surface group-[.toast]:border-border group-[.toast]:text-muted-foreground group-[.toast]:hover:text-foreground",
          success:
            "group-[.toaster]:!bg-surface group-[.toaster]:!text-foreground group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-success group-[.toaster]:!border-y-border group-[.toaster]:!border-r-border [&_[data-icon]]:!text-success",
          error:
            "group-[.toaster]:!bg-surface group-[.toaster]:!text-foreground group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-destructive group-[.toaster]:!border-y-border group-[.toaster]:!border-r-border [&_[data-icon]]:!text-destructive",
          warning:
            "group-[.toaster]:!bg-surface group-[.toaster]:!text-foreground group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-warning group-[.toaster]:!border-y-border group-[.toaster]:!border-r-border [&_[data-icon]]:!text-warning",
          info:
            "group-[.toaster]:!bg-surface group-[.toaster]:!text-foreground group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-primary group-[.toaster]:!border-y-border group-[.toaster]:!border-r-border [&_[data-icon]]:!text-primary",
          loader: "group-[.toast]:!text-primary",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
