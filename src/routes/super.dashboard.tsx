import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Newspaper, FileEdit, Image as ImageIcon, Users, Inbox } from "lucide-react";
import { adminStats } from "@/lib/admin.functions";
import { PageHeading, Panel } from "@/components/admin/ui";
import { formatDate } from "@/lib/admin-client";

export const Route = createFileRoute("/super/dashboard")({
  loader: () => adminStats(),
  component: DashboardPage,
});

function DashboardPage() {
  const stats = Route.useLoaderData();
  const cards = [
    { label: "Services", value: stats.services, icon: Briefcase, to: "/super/services" as const },
    {
      label: "Published articles",
      value: stats.articles,
      icon: Newspaper,
      to: "/super/blog" as const,
    },
    { label: "Drafts", value: stats.drafts, icon: FileEdit, to: "/super/blog" as const },
    {
      label: "Gallery photos",
      value: stats.photos,
      icon: ImageIcon,
      to: "/super/gallery" as const,
    },
    { label: "Team members", value: stats.team, icon: Users, to: "/super/team" as const },
    { label: "New inquiries", value: stats.unread, icon: Inbox, to: "/super/inquiries" as const },
  ];

  return (
    <>
      <PageHeading title="Dashboard" description="A quick view of everything on the website." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary"
          >
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <card.icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-display text-2xl font-black">{card.value}</span>
              <span className="block text-sm text-muted-foreground">{card.label}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Panel
          title="Recent inquiries"
          description="The latest messages sent from the contact page."
          action={
            <Link
              to="/super/inquiries"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              View all
            </Link>
          }
        >
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inquiries yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recent.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {item.name}{" "}
                      <span className="font-normal text-muted-foreground">· {item.email}</span>
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {item.subject || "No subject"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(item.created_at)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.handled ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {item.handled ? "Handled" : "New"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
