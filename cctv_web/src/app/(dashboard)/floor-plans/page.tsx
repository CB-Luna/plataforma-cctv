"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Map, Camera, Server, CheckCircle, Circle, Search, Building2, Filter } from "lucide-react";
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
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listFloorPlanSites } from "@/lib/api/floor-plans";

export default function FloorPlansPage() {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["floor-plan-sites"],
    queryFn: listFloorPlanSites,
  });

  // Unique client names for filter
  const clientNames = useMemo(() => {
    const names = [...new Set(sites.map((s) => s.client_name).filter(Boolean))] as string[];
    return names.sort();
  }, [sites]);

  // Filtered sites
  const filtered = useMemo(() => {
    let result = sites;
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
  }, [sites, clientFilter, search]);

  const withPlan = sites.filter((s) => s.has_floor_plan).length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando sitios...</div>;
  }

  return (
    <div className="space-y-6">
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
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={clientFilter} onValueChange={(v) => setClientFilter(v ?? "all")}>
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
          <Table>
            <TableHeader>
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
              {filtered.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>
                    <div className="font-medium">{site.name}</div>
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
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Sí
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <Circle className="mr-1 h-3 w-3" />
                        No
                      </Badge>
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
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
