import { redirect } from "next/navigation";

export default function TenantsPage() {
  redirect("/settings?tab=empresas");
}
