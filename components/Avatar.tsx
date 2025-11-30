import Image from "next/image";
import { formatImageSrc } from "@/lib/media";

type AvatarProps = {
  src: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  position?: string;
};

const sizeMap: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-32 w-32",
};

export default function Avatar({ src, size = "md", className = "", position = "center" }: AvatarProps) {
  const isInline = src.startsWith("data:") || src.startsWith("blob:");
  const preparedSrc = formatImageSrc(src, "?auto=format&fit=crop&w=600&q=80");

  return (
    <div
      className={`relative overflow-hidden rounded-full border-2 border-blush/60 bg-white shadow-soft ${sizeMap[size]} ${className}`}
    >
      {isInline ? (
        <img
          src={preparedSrc}
          alt="Site avatar"
          className="h-full w-full object-cover"
          style={{ objectPosition: position }}
        />
      ) : (
        <Image
          src={preparedSrc}
          alt="Site avatar"
          fill
          sizes="128px"
          className="object-cover transition-transform duration-500 hover:scale-105"
          style={{ objectPosition: position }}
        />
      )}
    </div>
  );
}
