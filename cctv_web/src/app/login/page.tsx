"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Camera, Shield, Monitor, Eye, EyeOff, Loader2 } from "lucide-react";
import { login, getMe } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import { isPlatformTenant } from "@/lib/platform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginForm = z.infer<typeof loginSchema>;

const demoUsers = [
  { name: "Mario (Admin)", email: "mario_super_admin@gmail.com", password: "Password123!", role: "Super Admin", color: "from-sky-500 to-blue-600", bg: "bg-sky-50 dark:bg-sky-950/30", border: "border-sky-500", ring: "ring-sky-200 dark:ring-sky-800" },
  { name: "Yuna (Admin)", email: "yuns_super_admin@gmail.com", password: "Password123!", role: "Super Admin", color: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-500", ring: "ring-violet-200 dark:ring-violet-800" },
  { name: "Bimbo", email: "admin.bimbo@demo.com", password: "Password123!", role: "Tenant Admin", color: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-500", ring: "ring-amber-200 dark:ring-amber-800" },
  { name: "Calimax", email: "calimax@gmail.com", password: "empresa_calimax", role: "Tenant Admin", color: "from-red-500 to-rose-600", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-500", ring: "ring-red-200 dark:ring-red-800" },
  { name: "Soriana", email: "marisol_soriana_admin@gmail.com", password: "Password123!", role: "Tenant Admin", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-500", ring: "ring-emerald-200 dark:ring-emerald-800" },
];

const features = [
  { icon: Camera, label: "Monitoreo 24/7", desc: "Vigilancia continua de toda tu infraestructura" },
  { icon: Shield, label: "Multi-sucursal", desc: "Gestiona múltiples sitios desde un solo panel" },
  { icon: Monitor, label: "Gestión inteligente", desc: "Tickets, SLA y pólizas automatizados" },
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setPendingTenantSelection = useAuthStore((s) => s.setPendingTenantSelection);
  const clearPendingTenantSelection = useAuthStore((s) => s.clearPendingTenantSelection);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setCompany = useTenantStore((s) => s.setCompany);
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    const requestedRedirect = new URLSearchParams(window.location.search).get("redirect");
    return requestedRedirect?.startsWith("/") ? requestedRedirect : "/dashboard";
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  async function onSubmit(data: LoginForm) {
    setError(null);

    try {
      const res = await login(data.email, data.password);

      // Filtrar tenant plataforma — no es empresa real
      const realCompanies = res.companies.filter((c) => !isPlatformTenant(c.id));

      if (realCompanies.length > 1) {
        setPendingTenantSelection({
          email: data.email,
          password: data.password,
          companies: realCompanies,
          redirectTo,
        });
        router.push(`/select-company?redirect=${encodeURIComponent(redirectTo)}`);
        return;
      }

      clearPendingTenantSelection();
      setAuth(res.access_token, res.user);

      const me = await getMe();
      setProfile(me.user, me.companies, me.roles, me.permissions);

      // Si hay empresa real, usarla; si no (super_admin puro), no setear company
      const realMeCompanies = me.companies.filter((c) => !isPlatformTenant(c.id));
      if (realMeCompanies.length > 0) {
        setCompany(realMeCompanies[0]);
      } else if (realCompanies.length > 0) {
        setCompany(realCompanies[0]);
      }
      // Super admin sin empresa real: no setear currentCompany (queda null = modo plataforma)
      router.push(redirectTo);
    } catch {
      setError("Credenciales inválidas o servidor no disponible");
    }
  }

  function selectDemoUser(user: (typeof demoUsers)[number]) {
    setSelectedDemo(user.email);
    setValue("email", user.email);
    setValue("password", user.password);
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-10 lg:flex lg:w-[60%]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20">
            <Camera className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">SyMTickets CCTV</h1>
            <p className="text-xs text-slate-400">Plataforma de Gestión CCTV</p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="max-w-lg space-y-4">
            <h2 className="text-4xl font-bold leading-tight text-white">
              Control total de tu<br />infraestructura CCTV
            </h2>
            <p className="text-lg text-slate-300">
              Monitorea cámaras, gestiona tickets y administra pólizas desde una sola plataforma multi-tenant.
            </p>
          </div>

          <div className="grid max-w-lg grid-cols-3 gap-4">
            {features.map((feature) => (
              <div key={feature.label} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <feature.icon className="mb-3 h-6 w-6 text-sky-400" />
                <p className="text-sm font-semibold text-white">{feature.label}</p>
                <p className="mt-1 text-xs text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-slate-500">© 2026 SyMTickets · Gestión de infraestructura CCTV</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-12 dark:bg-gray-950">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
            <Camera className="h-5 w-5 text-sky-400" />
          </div>
          <h1 className="text-xl font-bold">SyMTickets CCTV</h1>
        </div>

        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Accede a tu cuenta</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ingresa tus credenciales para resolver tu empresa activa y continuar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@demo.com"
                autoComplete="email"
                className="h-11"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full bg-sky-600 font-semibold text-white hover:bg-sky-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground dark:bg-gray-900">o accede rápido</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {demoUsers.map((demoUser) => {
                const isSelected = selectedDemo === demoUser.email;
                return (
                  <button
                    key={demoUser.email}
                    type="button"
                    onClick={() => selectDemoUser(demoUser)}
                    className={cn(
                      "relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all duration-200",
                      isSelected
                        ? `${demoUser.border} ${demoUser.bg} ${demoUser.ring} ring-2 shadow-md`
                        : "border-transparent bg-gray-50 hover:border-gray-200 hover:shadow-sm dark:bg-gray-800 dark:hover:border-gray-600",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-sm",
                        demoUser.color,
                      )}
                    >
                      {demoUser.name.charAt(0)}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">{demoUser.name}</p>
                      <span
                        className={cn(
                          "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                          isSelected
                            ? "bg-white/80 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            : "bg-gray-200/60 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
                        )}
                      >
                        {demoUser.role}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
