"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Map, Camera, Server, ChevronLeft, ChevronRight, Search, Building2, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAllSites } from "@/hooks/use-all-sites";
import { useSiteStore } from "@/stores/site-store";
import { SiteContextBanner } from "@/components/context/site-context-banner";

export default function FloorPlansPage() {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const currentSite = useSiteStore((state) => state.currentSite);
  const clearSite = useSiteStore((state) => state.clearSite);

  const { sites, isLoading } = useAllSites();

  // Unique client names for filter
  const clientNames = useMemo(() => {
    const names = [...new Set(sites.map((s) => s.client_name).filter(Boolean))] as string[];
    return names.sort();
  }, [sites]);

  // Filtered sites
  const filtered = useMemo(() => {
    let result = sites;
    if (currentSite) {
      result = result.filter((site) => site.id === currentSite.id);
    }
    if (clientFilter !== "all") {
      result = result.filter((s) => s.client_name === clientFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.client_name && s.client_name.toLowerCase().includes(q)) ||
          (s.address && s.address.toLowerCase().includes(q)) ||
          (s.city && s.city.toLowerCase().includes(q))
      );
    }
    return result;
  }, [sites, clientFilter, search, currentSite]);

  // Paginacion
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);
  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleClientFilter = useCallback((v: string) => { setClientFilter(v ?? "all"); setPage(1); }, []);
  const handlePageSize = useCallback((s: number) => { setPageSize(s); setPage(1); }, []);

  const withPlan = sites.filter((s) => s.has_floor_plan).length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando sitios...</div>;
  }

  return (
    <div className="space-y-6">
      <SiteContextBanner
        site={currentSite}
        description="La lista de planos queda acotada al sitio activo. Limpia el contexto para volver al inventario completo de sucursales."
        onClear={clearSite}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planos Interactivos</h1>
          <p className="text-muted-foreground">Visualización y edición de planos de sitios</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {withPlan} de {sites.length} sitios con plano
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, dirección o ciudad..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={clientFilter} onValueChange={(v) => handleClientFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Todas las empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las empresas</SelectItem>
            {clientNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay sitios disponibles.</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron sitios con los filtros aplicados.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="max-h-125 overflow-auto rounded-lg">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead>Sucursal</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-center">Cámaras</TableHead>
                <TableHead className="text-center">NVRs</TableHead>
                <TableHead className="text-center">Plano</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((site) => {
                const isLocal = site.id.startsWith("local_");
                return (
                <TableRow key={site.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                        <Map className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        {site.name}
                        {isLocal && (
                          <Badge variant="outline" className="border-amber-400 text-[10px] text-amber-600">
                            local
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{site.client_name ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {[site.city, site.state].filter(Boolean).join(", ") || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="flex items-center justify-center gap-1 text-sm">
                      <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                      {site.camera_count}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="flex items-center justify-center gap-1 text-sm">
                      <Server className="h-3.5 w-3.5 text-muted-foreground" />
                      {site.nvr_count}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {site.has_floor_plan ? (
                      <div className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Si</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                        <span className="text-xs font-medium text-muted-foreground">No</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/floor-plans/${site.id}`}>
                        <Button variant={site.has_floor_plan ? "outline" : "default"} size="sm">
                          <Map className="mr-1.5 h-3.5 w-3.5" />
                          {site.has_floor_plan ? "Ver Plano" : "Crear Plano"}
                        </Button>
                      </Link>
                      <Link href={`/floor-plans/${site.id}/topology`}>
                        <Button variant="ghost" size="sm">
                          <Server className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>

          {/* Paginacion */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Mostrar</span>
              <Select value={String(pageSize)} onValueChange={(v) => handlePageSize(Number(v ?? pageSize))}>
                <SelectTrigger className="h-7 w-17.5 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>de {filtered.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">
                {page} / {totalPages || 1}
              </span>
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
