import { getSession } from "@/lib/auth";
import DocsClient from "./DocsClient";

export const metadata = {
  title: "Documentation | LinqMe",
  description: "Everything you need to know about building forms, managing clients, and growing your agency with LinqMe.",
};

export default async function DocsPage() {
  const session = await getSession();
  const isLoggedIn = !!session;
  return <DocsClient isLoggedIn={isLoggedIn} />;
}
