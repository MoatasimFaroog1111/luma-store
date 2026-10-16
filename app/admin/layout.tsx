import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luma — Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="container" style={{ padding: "32px 20px 60px" }}>{children}</div>;
}
