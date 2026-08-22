import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type LessonRow = {
  id: string;
  slug: string;
  title: string;
  objective: string | null;
  objective_id: string | null;
  skill: string;
  level_code: string;
  estimated_minutes: number;
  xp_reward: number;
  sort_order: number;
  module_id: string;
};

export type ModuleRow = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  course_id: string;
  lessons: LessonRow[];
};

export type CourseRow = {
  id: string;
  level_code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  sort_order: number;
  modules: ModuleRow[];
};

/** Full curriculum tree: courses → modules → lessons. */
export function useCurriculum() {
  return useQuery({
    queryKey: ["curriculum"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<CourseRow[]> => {
      const [courses, modules, lessons] = await Promise.all([
        supabase.from("courses").select("*").order("sort_order"),
        supabase.from("modules").select("*").order("sort_order"),
        supabase.from("lessons").select("*").order("sort_order"),
      ]);
      if (courses.error) throw courses.error;
      return (courses.data ?? []).map((course) => ({
        ...course,
        modules: (modules.data ?? [])
          .filter((m) => m.course_id === course.id)
          .map((m) => ({
            ...m,
            lessons: ((lessons.data ?? []) as LessonRow[]).filter((l) => l.module_id === m.id),
          })),
      })) as CourseRow[];
    },
  });
}

/** Map of lesson id → progress row for the signed-in learner. */
export function useLessonProgress() {
  return useQuery({
    queryKey: ["progress", "lessons"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return {} as Record<string, { status: string; accuracy: number }>;
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id,status,accuracy")
        .eq("user_id", auth.user.id);
      if (error) throw error;
      const map: Record<string, { status: string; accuracy: number }> = {};
      for (const row of data ?? []) map[row.lesson_id] = { status: row.status, accuracy: row.accuracy };
      return map;
    },
  });
}

export function useDueVocabularyCount() {
  return useQuery({
    queryKey: ["vocab", "due-count"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return 0;
      const { count } = await supabase
        .from("user_vocabulary")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.user.id)
        .lte("due_at", new Date().toISOString());
      return count ?? 0;
    },
  });
}
