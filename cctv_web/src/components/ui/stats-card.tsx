"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const colorMap = {
  blue: {
    gradient: "from-blue-50 via-white to-white dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25",
    accent: "bg-blue-500",
    watermark: "text-blue-500/[0.05] dark:text-blue-400/[0.05]",
  },
  green: {
    gradient: "from-emerald-50 via-white to-white dark:from-emerald-950/30 dark:via-gray-900 dark:to-gray-900",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25",
    accent: "bg-emerald-500",
    watermark: "text-emerald-500/[0.05] dark:text-emerald-400/[0.05]",
  },
  amber: {
    gradient: "from-amber-50 via-white to-white dark:from-amber-950/30 dark:via-gray-900 dark:to-gray-900",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25",
    accent: "bg-amber-500",
    watermark: "text-amber-500/[0.05] dark:text-amber-400/[0.05]",
  },
  red: {
    gradient: "from-red-50 via-white to-white dark:from-red-950/30 dark:via-gray-900 dark:to-gray-900",
    iconBg: "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25",
    accent: "bg-red-500",
    watermark: "text-red-500/[0.05] dark:text-red-400/[0.05]",
  },
  teal: {
    gradient: "from-teal-50 via-white to-white dark:from-teal-950/30 dark:via-gray-900 dark:to-gray-900",
    iconBg: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25",
    accent: "bg-teal-500",
    watermark: "text-teal-500/[0.05] dark:text-teal-400/[0.05]",
  },
  purple: {
    gradient: "from-purple-50 via-white to-white dark:from-purple-950/30 dark:via-gray-900 dark:to-gray-900",
    iconBg: "bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25",
    accent: "bg-purple-500",
    watermark: "text-purple-500/[0.05] dark:text-purple-400/[0.05]",
  },
} as const;

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: keyof typeof colorMap;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon: Icon, color, trend, className }: StatsCardProps) {
  const c = colorMap[color];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-br p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800/80",
        c.gradient,
        className
      )}
    >
      {/* Top accent line */}
      <div className={cn("absolute inset-x-0 top-0 h-[3px]", c.accent)} />

      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-extrabold tracking-tight tabular-nums text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-[12px] text-gray-400 dark:text-gray-500">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-semibold", trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", c.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Watermark */}
      <Icon className={cn("pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 rotate-12 transition-transform duration-500 group-hover:scale-110", c.watermark)} />
    </div>
  );
}
