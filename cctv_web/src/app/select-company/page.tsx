"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { ServiceBadges } from "@/components/product/service-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMe, login } from "@/lib/api/auth";
import { getOnboardingStatusMeta, parseTenantProductProfile } from "@/lib/product/service-catalog";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";

export default function SelectCompanyPage() {
  const router = useRouter();
  const pendingTenantSelection = useAuthStore((state) => state.pendingTenantSelection);
  const setAuth = useAuthStore((state) => state.setAuth);
  const setProfile = useAuthStore((state) => state.setProfile);
  const clearPendingTenantSelection = useAuthStore((state) => state.clearPendingTenantSelection);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setCompany = useTenantStore((state) => state.setCompany);
  const currentCompany = useTenantStore((state) => state.currentCompany);
  const [submittingCompanyId, setSubmittingCompanyId] = useState<string | null>(null);

  const companies = pendingTenantSelection?.companies ?? [];
  const redirectTo = useMemo(() => {
    const requestedRedirect =
      typeof window === "undefined"
        ? pendingTenantSelection?.redirectTo
        : new URLSearchParams(window.location.search).get("redirect") ?? pendingTenantSelection?.redirectTo;
    return requestedRedirect?.startsWith("/") ? requestedRedirect : "/dashboard";
  }, [pendingTenantSelection?.redirectTo]);

  useEffect(() => {
    if (isAuthenticated && currentCompany) {
      router.replace(redirectTo);
      return;
    }

    if (!pendingTenantSelection) {
      router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`);
    }
  }, [currentCompany, isAuthenticated, pendingTenantSelection, redirectTo, router]);

  async function handleSelect(company: (typeof companies)[number]) {
    if (!pendingTenantSelection) return;

    setSubmittingCompanyId(company.id);

    try {
      const response = await login(
        pendingTenantSelection.email,
        pendingTenantSelection.password,
        company.id,
      );

      setAuth(response.access_token, response.user);

      const me = await getMe();
      setProfile(me.user, me.companies, me.roles, me.permissions);
      setCompany(me.companies[0] ?? company);
      clearPendingTenantSelection();
      router.push(redirectTo);
    } finally {
      setSubmittingCompanyId(null);
    }
  }

  function handleBackToLogin() {
    clearPendingTenantSelection();
    router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Selecciona una empresa</h1>
          <p className="text-muted-foreground">
            Detectamos varias empresas para este usuario. Elige una para emitir el contexto real de trabajo.
          </p>
        </div>

        <div className="grid gap-3">
          {companies.map((company) => {
            const productProfile = parseTenantProductProfile(company);
            const onboardingMeta = getOnboardingStatusMeta(productProfile.onboarding.status);

            return (
              <Card
                key={company.id}
                className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent"
                onClick={() => void handleSelect(company)}
              >
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: company.primary_color ?? "#1976D2" }}
                  >
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{company.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{company.slug}</p>
                  </div>
                  <Button variant="ghost" size="sm" disabled={submittingCompanyId === company.id}>
                    {submittingCompanyId === company.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Plan: {productProfile.packageProfile}</span>
                    <span>Max. usuarios: {company.max_users ?? "N/D"}</span>
                    <Badge variant={onboardingMeta.tone}>{onboardingMeta.label}</Badge>
                  </div>
                  <ServiceBadges services={productProfile.enabledServices} compact />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button variant="outline" onClick={handleBackToLogin}>
            Volver al login
          </Button>
        </div>
      </div>
    </div>
  );
}
