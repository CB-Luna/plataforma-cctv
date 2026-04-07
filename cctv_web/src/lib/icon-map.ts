import { createElement, type ReactElement } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  Package,
  FileText,
  Receipt,
  CreditCard,
  BarChart3,
  TrendingUp,
  Settings,
  ShieldCheck,
  Users,
  Globe,
  HardDrive,
  Camera,
  Map,
  MapPin,
  Layers,
  type LucideIcon,
} from "lucide-react";

/** Map backend Material icon names to Lucide components */
const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  assignment: ClipboardList,
  business: Building2,
  inventory_2: Package,
  description: FileText,
  receipt: Receipt,
  receipt_long: Receipt,
  payment: CreditCard,
  assessment: BarChart3,
  bar_chart: BarChart3,
  trending_up: TrendingUp,
  settings: Settings,
  security: ShieldCheck,
  people: Users,
  admin_panel_settings: Settings,
  domain: Globe,
  perm_media: HardDrive,
  videocam: Camera,
  camera: Camera,
  map: Map,
  location_on: MapPin,
  layers: Layers,
  storage: HardDrive,
  store: Building2,
  group: Users,
  verified_user: ShieldCheck,
};

/** Returns a rendered icon element (avoids React 19 "component created during render" error) */
export function renderIcon(name: string, className?: string): ReactElement {
  const Icon = iconMap[name] ?? LayoutDashboard;
  return createElement(Icon, { className });
}
