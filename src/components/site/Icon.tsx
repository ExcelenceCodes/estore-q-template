import * as Lucide from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { SimpleIcon } from "simple-icons";
import {
  siFacebook,
  siX,
  siInstagram,
  siYoutube,
  siGithub,
  siWhatsapp,
  siTiktok,
  siTelegram,
  siDiscord,
  siReddit,
  siPinterest,
  siSnapchat,
} from "simple-icons";

const BRAND_ICONS: Record<string, SimpleIcon> = {
  facebook: siFacebook,
  twitter: siX,
  x: siX,
  instagram: siInstagram,
  youtube: siYoutube,
  whatsapp: siWhatsapp,
  tiktok: siTiktok,
  telegram: siTelegram,
  github: siGithub,
  discord: siDiscord,
  reddit: siReddit,
  pinterest: siPinterest,
  snapchat: siSnapchat,
};

function toPascal(name: string) {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const registry = Lucide as unknown as Record<string, React.ComponentType<LucideProps>>;
  const brand = BRAND_ICONS[name];
  if (brand) {
    return (
      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d={brand.path} fill="currentColor" />
      </svg>
    );
  }
  const Cmp = registry[toPascal(name)] ?? Lucide.Circle;
  return <Cmp {...props} />;
}

export function SocialIcon({
  platform,
  size = 16,
  className,
}: {
  platform: string;
  size?: number;
  className?: string;
}) {
  const entry = socialIcons[platform.toLowerCase()];
  const icon = entry?.icon ?? "link";
  const color = entry?.color ?? "#64748b";

  if (typeof icon !== "string") {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        className={className}
        fill="currentColor"
      >
        <path d={icon.path} />
      </svg>
    );
  }

  return <Icon name={icon} size={size} className={className} />;
}

export const socialIcons: Record<string, { icon: string | SimpleIcon; color: string }> = {
  facebook: { icon: siFacebook, color: "#1877F2" },
  twitter: { icon: siX, color: "#1DA1F2" },
  x: { icon: siX, color: "#000000" },
  linkedin: { icon: "briefcase", color: "#0A66C2" },
  instagram: { icon: siInstagram, color: "#E4405F" },
  youtube: { icon: siYoutube, color: "#FF0000" },
  whatsapp: { icon: siWhatsapp, color: "#25D366" },
  tiktok: { icon: siTiktok, color: "#000000" },
  telegram: { icon: siTelegram, color: "#0088cc" },
  github: { icon: siGithub, color: "#181717" },
  discord: { icon: siDiscord, color: "#5865F2" },
  reddit: { icon: siReddit, color: "#FF4500" },
  pinterest: { icon: siPinterest, color: "#E60023" },
  snapchat: { icon: siSnapchat, color: "#FFFC00" },
  email: { icon: "mail", color: "#EA4335" },
  phone: { icon: "phone", color: "#34B7F1" },
  website: { icon: "globe", color: "#6366F1" },
};

export function mediaUrl(id?: string | null) {
  return id ? `/api/public/media/${id}` : null;
}

export function imageOf(mediaId?: string | null, url?: string | null) {
  return mediaUrl(mediaId) ?? url ?? null;
}
