import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { customerLogin, customerMe } from "@/lib/public.functions";
import { PageHeading, Panel, Field, inputClass, useAction } from "@/components/admin/ui";

export const Route = createFileRoute("/account/login")({
  loader: async () => {
    const me = await customerMe();
    if (me) throw redirect({ to: "/account/orders" });
    return null;
  },
  component: LoginPage,
});

function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { loading, execute } = useAction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = await execute("login", () => customerLogin({ data: form }), "Welcome back");
    if (!ok) setError("Invalid email or password.");
  };

  return (
    <div className="mx-auto max-w-md">
      <PageHeading title="Login" description="Sign in to your account to track orders." />
      <Panel>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </Field>
          <button
            type="submit"
            disabled={loading === "login"}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            {loading === "login" ? "Signing in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/account/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </Panel>
    </div>
  );
}
