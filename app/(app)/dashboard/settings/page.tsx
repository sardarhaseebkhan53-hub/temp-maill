import { requireUser } from "@/lib/auth";
import { SettingsForm } from "@/components/features/settings-form";

export default async function SettingsPage() {
  const { user } = await requireUser();
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Settings</h1>
      <div className="mt-6 max-w-md">
        <SettingsForm name={user.displayName || user.name || ""} locale={user.locale} theme={user.theme} />
      </div>
    </div>
  );
}
