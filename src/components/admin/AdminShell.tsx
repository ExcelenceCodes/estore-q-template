import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  Image as ImageIcon,
  Newspaper,
  Users,
  UserCog,
  Share2,
  Phone,
  Inbox,
  Presentation,
  LogOut,
  Settings,
  Menu,
  X,
  ExternalLink,
  Info,
  Globe,
  ChevronDown,
  User,
  HeartHandshake,
  Package,
  Tags,
  Truck,
  ShoppingCart,
  Ticket,
  Tag,
} from "lucide-react";
import { site } from "@/lib/site";
import { adminLogout, type AdminUser } from "@/lib/admin.functions";
import { imageOf } from "@/components/site/Icon";

const NAV = [
  { to: "/super/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/super/about", label: "About", icon: Info },
  { to: "/super/services", label: "Services", icon: Briefcase },
  { to: "/super/products", label: "Products", icon: Package },
  { to: "/super/categories", label: "Categories", icon: Tags },
  { to: "/super/brands", label: "Brands", icon: Tag },
  { to: "/super/orders", label: "Orders", icon: ShoppingCart },
  { to: "/super/promotions", label: "Promotions", icon: Ticket },
  { to: "/super/shipping", label: "Shipping", icon: Truck },
  { to: "/super/blog", label: "Blog studio", icon: Newspaper },
  { to: "/super/gallery", label: "Gallery", icon: ImageIcon },
  { to: "/super/hero", label: "Hero", icon: Presentation },
  { to: "/super/contacts", label: "Contacts", icon: Phone },
  { to: "/super/socials", label: "Socials", icon: Share2 },
  { to: "/super/team", label: "Team", icon: Users },
  { to: "/super/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/super/users", label: "Users", icon: UserCog },
  { to: "/super/help", label: "Need Help?", icon: HeartHandshake },
] as const;

export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function signOut() {
    await adminLogout();
    await router.invalidate();
    router.navigate({ to: "/super/login", replace: true });
  }

  function viewSite() {
    window.open("/", "_blank", "noopener,noreferrer");
    setProfileOpen(false);
  }

  function openSettings() {
    router.navigate({ to: "/super/settings" });
    setProfileOpen(false);
  }

  const nav = (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="admin-shell min-h-screen bg-muted/30">
      <aside className="admin-sidebar fixed inset-y-3 left-3 z-40 hidden w-64 flex-col rounded-2xl border border-border/60 bg-card/95 shadow-xl backdrop-blur lg:flex">
        <div className="flex h-full flex-col p-4">
          <Brand />
          <div className="mt-6 flex-1 overflow-y-auto">{nav}</div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View live site
          </a>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-[#131313]/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[85%] overflow-y-auto bg-card/95 p-4 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between">
              <Brand />
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6">{nav}</div>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6">
          <header className="admin-header sticky top-3 z-30 mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/95 px-4 py-3 shadow-md backdrop-blur">
            <div className="overflow-hidden">
              <span className="brand-scroll text-sm font-bold whitespace-nowrap">
                <span className="inline-block">
                  {site.brand.name}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
                </span>
                <span className="inline-block">
                  {site.brand.name}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-border p-0.5 pr-3 transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                >
                  {user.photo_id ? (
                    <img
                      src={imageOf(user.photo_id, null)}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:inline" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border/80 bg-card/95 py-1 shadow-xl backdrop-blur animate-[admin-drop-in_0.2s_ease-out]">
                    <div className="border-b border-border/60 px-4 py-2">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                    <button
                      onClick={viewSite}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground transition hover:bg-muted"
                    >
                      <Globe className="h-4 w-4" /> View Site
                    </button>
                    <button
                      onClick={openSettings}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground transition hover:bg-muted"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                    <div className="border-t border-border/60" />
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        void signOut();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive transition hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="admin-main relative z-10 mt-4 rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur">
            <div className="admin-content p-4 sm:p-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <img src={site.brand.logo} alt="" className="h-8 w-8 rounded" />
      <div className="leading-tight">
        <p className="font-display text-sm font-black">{site.brand.name}</p>
        <p className="text-[11px] text-muted-foreground">Control panel</p>
      </div>
    </div>
  );
}
