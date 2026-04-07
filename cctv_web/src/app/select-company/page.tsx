"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

/**
 * Fase 1.6 — Select Company
 * Tras login, si el usuario tiene >1 empresa se muestra este selector.
 * Si solo tiene 1, el login page auto-selecciona y redirige a /dashboard.
 */
export default function SelectCompanyPage() {
  const router = useRouter();
  const companies = useAuthStore((s) => s.companies);
  const setCompany = useTenantStore((s) => s.setCompany);

  function handleSelect(company: typeof companies[number]) {
    setCompany(company);
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Selecciona una empresa</h1>
          <p className="text-muted-foreground">
            Tienes acceso a {companies.length} empresas. Elige con cuál trabajar.
          </p>
        </div>

        <div className="grid gap-3">
          {companies.map((company) => (
            <Card
              key={company.id}
              className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent"
              onClick={() => handleSelect(company)}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: company.primary_color || "#1976D2" }}
                >
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{company.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{company.slug}</p>
                </div>
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Plan: {company.subscription_plan ?? "basic"}</span>
                  <span>Máx usuarios: {company.max_users ?? "—"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
