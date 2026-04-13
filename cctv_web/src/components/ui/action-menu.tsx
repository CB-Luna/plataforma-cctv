"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Componente ActionMenu ─────────────────────────────────────────────
// Menu de acciones ligero para celdas de tabla.
// Usa estado local + portal manual en vez de @base-ui/react Menu
// para evitar problemas de interaccion dentro de contenedores scrollables.

interface ActionMenuProps {
  children: React.ReactNode;
  /** Elemento trigger (el boton de 3 puntos) */
  trigger: React.ReactNode;
  /** Alineacion horizontal: "start" | "end" */
  align?: "start" | "end";
}

export function ActionMenu({ children, trigger, align = "end" }: ActionMenuProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Cerrar al hacer clic fuera
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={menuRef}
          className={cn(
            "absolute z-50 mt-1 min-w-[160px] rounded-lg border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── ActionMenuItem ────────────────────────────────────────────────────
interface ActionMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive";
}

export function ActionMenuItem({
  className,
  variant = "default",
  children,
  onClick,
  ...props
}: ActionMenuItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        variant === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
