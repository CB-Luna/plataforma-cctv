"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";

export interface TabItem {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  component: React.ReactNode;
}

const colorMap: Record<string, { bg: string; text: string; activeBg: string; border: string }> = {
  blue: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-600 dark:text-blue-400", activeBg: "bg-blue-50 dark:bg-gray-700", border: "border-blue-500" },
  purple: { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-600 dark:text-purple-400", activeBg: "bg-purple-50 dark:bg-gray-700", border: "border-purple-500" },
  amber: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-600 dark:text-amber-400", activeBg: "bg-amber-50 dark:bg-gray-700", border: "border-amber-500" },
  teal: { bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-600 dark:text-teal-400", activeBg: "bg-teal-50 dark:bg-gray-700", border: "border-teal-500" },
  pink: { bg: "bg-pink-100 dark:bg-pink-900/40", text: "text-pink-600 dark:text-pink-400", activeBg: "bg-pink-50 dark:bg-gray-700", border: "border-pink-500" },
  gray: { bg: "bg-gray-200 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-400", activeBg: "bg-gray-50 dark:bg-gray-700", border: "border-gray-500" },
  indigo: { bg: "bg-indigo-100 dark:bg-indigo-900/40", text: "text-indigo-600 dark:text-indigo-400", activeBg: "bg-indigo-50 dark:bg-gray-700", border: "border-indigo-500" },
};

interface TabLayoutProps {
  tabs: TabItem[];
  defaultTab?: string;
}

export function TabLayout({ tabs, defaultTab }: TabLayoutProps) {
  const [activeKey, setActiveKey] = useState(defaultTab ?? tabs[0]?.key ?? "");
  const activeTab = tabs.find((t) => t.key === activeKey);

  return (
    <div>
      {/* Mobile: dropdown selector */}
      <div className="md:hidden">
        <div className="relative">
          {activeTab && (
            <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
              <activeTab.icon className="h-4 w-4 text-gray-500" />
            </div>
          )}
          <select
            value={activeKey}
            onChange={(e) => setActiveKey(e.target.value)}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-gray-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {tabs.map((tab) => (
              <option key={tab.key} value={tab.key}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop: pill button bar */}
      <div className="hidden md:block">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex gap-1 p-1.5">
            {tabs.map((tab) => {
              const isActive = tab.key === activeKey;
              const colors = colorMap[tab.color] ?? colorMap.blue;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveKey(tab.key)}
                  className={`flex items-center gap-2 rounded-lg border-b-[3px] px-4 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? `${colors.activeBg} ${colors.border} ${colors.text}`
                      : "border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <span
                    className={`flex h-[34px] w-[34px] items-center justify-center rounded-lg ${
                      isActive ? `${colors.bg} ${colors.text}` : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-4">{activeTab?.component}</div>
    </div>
  );
}
