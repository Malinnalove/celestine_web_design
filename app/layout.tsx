import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { cookies } from "next/headers";
import EditModeBadge from "@/components/EditModeBadge";
import NavMenu from "@/components/NavMenu";
import { disableEditMode } from "@/lib/actions";
import { getSiteContent } from "@/lib/siteContent";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Personal Journal",
  description: "A hybrid diary, photo wall, and article collection.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const isEditMode = cookieStore.get("edit-mode")?.value === "true";
  const content = await getSiteContent();

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-sand">
        <div className="min-h-screen bg-gradient-to-b from-sand to-petal/20">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <NavMenu
              avatarUrl={content.avatarUrl}
              avatarPosition={content.avatarPosition}
              eyebrow={content.navEyebrow}
              title={content.navTitle}
            />
            {isEditMode && (
              <div className="mt-4">
                <EditModeBadge onDisable={disableEditMode} />
              </div>
            )}
            <main className="mt-12 space-y-16">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
