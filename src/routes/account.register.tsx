import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { customerRegister, customerLogin, customerMe } from "@/lib/public.functions";
import { PageHeading, Panel, Field, inputClass, useAction } from "@/components/admin/ui";

export const Route = createFileRoute("/account/register")({
  loader: async () => {
    const me = await customerMe();
    if (me) throw redirect({ to: "/account/orders" });
    return null;
  },
  component: RegisterPage,
});

function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const { loading, execute } = useAction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const ok = await execute(
      "register",
      () =>
        customerRegister({
          data: {
            name: form.name,
            email: form.email,
            phone: form.phone || null,
            password: form.password,
          },
        }),
      "Account created",
    );
    if (ok) {
      await customerLogin({ data: { email: form.email, password: form.password } });
    } else {
      setError("Email already registered.");
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <PageHeading title="Create Account" description="Register to track your orders." />
      <Panel>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Field label="Full Name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </Field>
          <Field label="Confirm Password">
            <input
              type="password"
              className={inputClass}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </Field>
          <button
            type="submit"
            disabled={loading === "register"}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            {loading === "register" ? "Creating..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/account/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </Panel>
    </div>
  );
}
