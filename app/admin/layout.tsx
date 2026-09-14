import { AdminLogin } from "@/components/admin-login";
import { AdminNav } from "@/components/admin-nav";
import { isAdminAuthenticated } from "@/lib/admin-session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Ops",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return (
      <div className="admin-app min-h-full bg-paper">
        <AdminLogin />
      </div>
    );
  }

  return (
    <div className="admin-app admin-shell">
      <AdminNav />
      <div className="admin-main">
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
