"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "./Avatar";

type NavMenuProps = {
  avatarUrl: string;
  avatarPosition?: string;
  eyebrow: string;
  title: string;
  isEditMode?: boolean;
  onSaveEyebrow?: (value: string) => Promise<any>;
  onSaveTitle?: (value: string) => Promise<any>;
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/diary", label: "Diary" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/admin", label: "Admin" },
];

export default function NavMenu({
  avatarUrl,
  avatarPosition,
  eyebrow,
  title,
}: NavMenuProps) {
  const pathname = usePathname();
  const normalizedPath = pathname === "/photos" ? "/gallery" : pathname;

  return (
    <div className="flex w-full flex-col gap-6 border-b border-[#f2decf] pb-6 md:flex-row md:items-center md:justify-between md:pl-6">
      <Link href="/about" className="flex items-center gap-4">
        <Avatar
          src={avatarUrl}
          position={avatarPosition}
          size="sm"
          className="shadow-lg shadow-rose-200/70"
        />
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink/70">{eyebrow}</p>
          <p className="font-heading text-2xl leading-tight text-ink">{title}</p>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-5 text-xs font-semibold tracking-[0.3em] text-ink/70 md:ml-auto md:justify-end md:self-end">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? normalizedPath === item.href
              : normalizedPath?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className="group relative px-1 py-1 uppercase transition-colors duration-200 hover:text-ink"
            >
              <span className="relative">
                {item.label}
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-rose-300/80 transition-transform duration-300 group-hover:scale-x-100 ${
                    isActive ? "scale-x-100" : ""
                  }`}
                />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
