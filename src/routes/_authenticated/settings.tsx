import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { PageHeader } from "@/components/lingua/primitives";
import { Switch } from "@/components/ui/switch";
import { useProfile, useUpdateProfile } from "@/hooks/useLingua";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LINGUA" },
      { name: "description", content: "Choose your theme, interface language, motion and notification preferences." },
      { property: "og:title", content: "Settings — LINGUA" },
      { property: "og:description", content: "Make LINGUA comfortable for the way you learn." },
    ],
  }),
  component: SettingsPage,
});

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader icon={Settings} title="Settings" description="Sesuaikan tampilan dan pengingat belajarmu." />

      <section className="surface-card divide-y divide-border px-5">
        <Row title="Theme" description="Light, dark or follow your device.">
          <div className="flex gap-1.5">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={profile?.theme === t}
                onClick={() => update.mutate({ theme: t })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors",
                  profile?.theme === t ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-muted",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </Row>

        <Row title="Interface language" description="Explanations use this language for beginner levels.">
          <div className="flex gap-1.5">
            {(
              [
                ["id", "Indonesia"],
                ["en", "English"],
              ] as const
            ).map(([code, label]) => (
              <button
                key={code}
                type="button"
                aria-pressed={profile?.interface_language === code}
                onClick={() => update.mutate({ interface_language: code })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                  profile?.interface_language === code
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border hover:bg-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>

        <Row title="Reduce motion" description="Turn off animations and confetti.">
          <Switch
            checked={profile?.reduce_motion ?? false}
            onCheckedChange={(v) => update.mutate({ reduce_motion: v })}
            aria-label="Reduce motion"
          />
        </Row>

        <Row title="Practice reminders" description="Gentle nudges to keep your streak alive.">
          <Switch
            checked={profile?.notifications_enabled ?? true}
            onCheckedChange={(v) => update.mutate({ notifications_enabled: v })}
            aria-label="Practice reminders"
          />
        </Row>

        <Row title="Show me on the leaderboard" description="Share nickname, avatar and XP with other learners.">
          <Switch
            checked={profile?.leaderboard_opt_in ?? false}
            onCheckedChange={(v) => update.mutate({ leaderboard_opt_in: v })}
            aria-label="Leaderboard visibility"
          />
        </Row>
      </section>
    </div>
  );
}
