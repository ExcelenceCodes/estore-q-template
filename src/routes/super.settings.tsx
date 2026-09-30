import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Save, X, Lock } from "lucide-react";
import { adminMe, saveMyProfile, changeMyPassword } from "@/lib/admin.functions";
import {
  Field,
  inputClass,
  ImagePicker,
  PageHeading,
  Panel,
  useAction,
} from "@/components/admin/ui";

export const Route = createFileRoute("/super/settings")({
  loader: () => adminMe(),
  component: SettingsPage,
});

function SettingsPage() {
  const me = Route.useLoaderData();
  const router = useRouter();
  const [form, setForm] = useState({
    name: me.name ?? "",
    email: me.email ?? "",
    phone: me.phone ?? "",
    photo_id: me.photo_id ?? null,
  });
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { loading, execute } = useAction();

  async function saveProfile() {
    const ok = await execute("save-profile", () => saveMyProfile({ data: form }), "Profile saved");
    if (ok) await router.invalidate();
  }

  async function changePassword() {
    const ok = await execute(
      "change-password",
      () => changeMyPassword({ data: passwords }),
      "Password updated",
    );
    if (ok) {
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      await router.invalidate();
    }
  }

  return (
    <>
      <PageHeading
        title="Settings"
        description="Update your admin profile and password."
        action={
          <div className="flex gap-2">
            <button
              onClick={() =>
                setForm({
                  name: me.name ?? "",
                  email: me.email ?? "",
                  phone: me.phone ?? "",
                  photo_id: me.photo_id ?? null,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm"
            >
              <X className="h-4 w-4" /> Reset
            </button>
            <button
              onClick={() => void execute("save-profile", saveProfile, "Profile saved")}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              disabled={loading === "save-profile"}
            >
              {loading === "save-profile" ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save changes
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        <Panel title="Profile">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputClass}
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value || null })}
              />
            </Field>
            <div className="space-y-4">
              <ImagePicker
                label="Profile photo (optional)"
                mediaId={form.photo_id}
                onChange={(photo_id) => setForm({ ...form, photo_id })}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Password" description="Change your account password.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Current password">
              <input
                type="password"
                className={inputClass}
                value={passwords.oldPassword}
                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                className={inputClass}
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                className={inputClass}
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4">
            <button
              onClick={() => void execute("change-password", changePassword, "Password updated")}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              disabled={
                loading === "change-password" ||
                !passwords.oldPassword ||
                !passwords.newPassword ||
                !passwords.confirmPassword
              }
            >
              {loading === "change-password" ? (
                "Updating..."
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Update password
                </>
              )}
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}
