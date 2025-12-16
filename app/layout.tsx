import type { Metadata } from "next";
import { Inter, Playfair_Display, Bebas_Neue, Space_Grotesk, Bangers, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import EditModeBadge from "@/components/EditModeBadge";
import NavMenu from "@/components/NavMenu";
import { disableEditMode } from "@/lib/actions";
import { getSiteContent } from "@/lib/siteContent";
import ThemeToggle from "@/components/ThemeToggle";
import OglPolylines from "@/components/OglPolylines";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const bangers = Bangers({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-beast-heading",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-beast-body",
});

export const metadata: Metadata = {
  title: "Personal Journal",
  description: "A hybrid diary, photo wall, and article collection.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const isEditMode = cookieStore.get("edit-mode")?.value === "true";
  const theme = cookieStore.get("theme")?.value === "beast" ? "beast" : "classic";
  const content = await getSiteContent();

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${bangers.variable} ${outfit.variable}`}
    >
      <body className={`${theme === "beast" ? "theme-beast" : "theme-classic"}`}>
        {theme === "beast" && (
          <div className="pointer-events-none fixed inset-0 -z-10">
            <OglPolylines variant="beast" fullScreen hideChrome />
          </div>
        )}
        <div className="min-h-screen bg-gradient-to-b from-sand to-petal/20 dark:from-[#1f1a2a] dark:to-[#ff6501]/10">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <NavMenu
                avatarUrl={content.avatarUrl}
                avatarPosition={content.avatarPosition}
                eyebrow={content.navEyebrow}
                title={content.navTitle}
              />
              <ThemeToggle initialTheme={theme} />
            </div>
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
