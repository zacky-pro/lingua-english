import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { todayISO, type LevelCode } from "@/lib/lingua";

export type Profile = {
  id: string;
  display_name: string;
  avatar_emoji: string;
  level_code: LevelCode;
  goals: string[];
  focus_skills: string[];
  daily_goal_minutes: number;
  xp: number;
  streak_count: number;
  longest_streak: number;
  last_active_date: string | null;
  onboarded: boolean;
  interface_language: string;
  theme: string;
  reduce_motion: boolean;
  notifications_enabled: boolean;
  leaderboard_opt_in: boolean;
};

export function useSessionUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserId(data.user?.id ?? null);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  return { userId, ready };
}

/** Loads the current learner profile, creating it on first sign-in. */
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    staleTime: 15_000,
    queryFn: async (): Promise<Profile | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      if (data) return data as Profile;
      const fallbackName =
        (user.user_metadata?.["display_name"] as string) || user.email?.split("@")[0] || "Learner";
      const { data: created, error: insertError } = await supabase
        .from("profiles")
        .insert({ id: user.id, display_name: fallbackName })
        .select("*")
        .single();
      if (insertError) throw insertError;
      return created as Profile;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", auth.user.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      qc.setQueryData(["profile"], data);
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });
}

type ActivityPatch = {
  xp?: number;
  minutes?: number;
  lessons_completed?: number;
  words_reviewed?: number;
  speaking_minutes?: number;
  listening_minutes?: number;
  source?: string;
};

/** Awards XP, records daily activity and keeps the streak up to date. */
export function useAward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: ActivityPatch) => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("Not signed in");
      const today = todayISO();

      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, streak_count, longest_streak, last_active_date")
        .eq("id", user.id)
        .single();

      const { data: existing } = await supabase
        .from("daily_activity")
        .select("*")
        .eq("user_id", user.id)
        .eq("activity_date", today)
        .maybeSingle();

      const merged = {
        user_id: user.id,
        activity_date: today,
        xp: (existing?.xp ?? 0) + (patch.xp ?? 0),
        minutes: (existing?.minutes ?? 0) + (patch.minutes ?? 0),
        lessons_completed: (existing?.lessons_completed ?? 0) + (patch.lessons_completed ?? 0),
        words_reviewed: (existing?.words_reviewed ?? 0) + (patch.words_reviewed ?? 0),
        speaking_minutes: (existing?.speaking_minutes ?? 0) + (patch.speaking_minutes ?? 0),
        listening_minutes: (existing?.listening_minutes ?? 0) + (patch.listening_minutes ?? 0),
      };
      await supabase.from("daily_activity").upsert(merged, { onConflict: "user_id,activity_date" });

      if (patch.xp) {
        await supabase
          .from("xp_transactions")
          .insert({ user_id: user.id, amount: patch.xp, source: patch.source ?? "practice" });
      }

      const last = profile?.last_active_date ?? null;
      let streak = profile?.streak_count ?? 0;
      if (last !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        streak = last === yesterday ? streak + 1 : 1;
      }
      const longest = Math.max(profile?.longest_streak ?? 0, streak);

      await supabase
        .from("profiles")
        .update({
          xp: (profile?.xp ?? 0) + (patch.xp ?? 0),
          streak_count: streak,
          longest_streak: longest,
          last_active_date: today,
        })
        .eq("id", user.id);

      await syncAchievements(user.id);
      return { xp: patch.xp ?? 0, streak };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["achievements"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

/** Recomputes achievement progress from the learner's real data. */
export async function syncAchievements(userId: string) {
  const [achievements, profile, lessons, words, conversations, writings] = await Promise.all([
    supabase.from("achievements").select("*"),
    supabase.from("profiles").select("xp, streak_count").eq("id", userId).maybeSingle(),
    supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("user_vocabulary")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "new"),
    supabase.from("conversation_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("writing_submissions").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const metrics: Record<string, number> = {
    lessons_completed: lessons.count ?? 0,
    words_learned: words.count ?? 0,
    conversations: conversations.count ?? 0,
    writings: writings.count ?? 0,
    streak: profile.data?.streak_count ?? 0,
    xp: profile.data?.xp ?? 0,
  };

  const rows = (achievements.data ?? []).map((a) => {
    const progress = Math.min(metrics[a.metric] ?? 0, a.target);
    return {
      user_id: userId,
      achievement_id: a.id,
      progress,
      unlocked_at: progress >= a.target ? new Date().toISOString() : null,
    };
  });
  if (rows.length) {
    const { data: current } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId);
    const alreadyUnlocked = new Map((current ?? []).map((r) => [r.achievement_id, r.unlocked_at]));
    const payload = rows.map((r) => ({
      ...r,
      unlocked_at: alreadyUnlocked.get(r.achievement_id) ?? r.unlocked_at,
    }));
    await supabase.from("user_achievements").upsert(payload, { onConflict: "user_id,achievement_id" });
  }
}

export function useDailyActivity(days = 7) {
  return useQuery({
    queryKey: ["activity", days],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const from = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("daily_activity")
        .select("*")
        .eq("user_id", auth.user.id)
        .gte("activity_date", from)
        .order("activity_date");
      if (error) throw error;
      return data ?? [];
    },
  });
}
