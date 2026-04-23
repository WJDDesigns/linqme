import { redirect } from "next/navigation";

// Old URL redirect -- /admin/partners now lives at /admin/customers
export default function PartnersRedirect() {
  redirect("/dashboard/admin/customers");
}
