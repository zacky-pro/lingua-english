import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, GraduationCap, SpellCheck } from "lucide-react";
import { useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["search", term],
    enabled: open,
    queryFn: async () => {
      const like = `%${term}%`;
      const [lessons, words, grammar] = await Promise.all([
        supabase.from("lessons").select("slug,title,level_code").ilike("title", like).limit(6),
        supabase.from("vocabulary").select("id,word,meaning_id").ilike("word", like).limit(6),
        supabase.from("grammar_topics").select("slug,title,level_code").ilike("title", like).limit(6),
      ]);
      return {
        lessons: lessons.data ?? [],
        words: words.data ?? [],
        grammar: grammar.data ?? [],
      };
    },
  });

  function go(to: string) {
    onOpenChange(false);
    setTerm("");
    navigate({ to });
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search lessons, words, grammar…"
        value={term}
        onValueChange={setTerm}
      />
      <CommandList>
        <CommandEmpty>Nothing found yet. Try another word.</CommandEmpty>
        {data?.lessons.length ? (
          <CommandGroup heading="Lessons">
            {data.lessons.map((l) => (
              <CommandItem key={l.slug} value={`lesson-${l.title}`} onSelect={() => go(`/learn/${l.slug}`)}>
                <GraduationCap className="size-4" aria-hidden />
                <span>{l.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">{l.level_code}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {data?.words.length ? (
          <CommandGroup heading="Vocabulary">
            {data.words.map((w) => (
              <CommandItem key={w.id} value={`word-${w.word}`} onSelect={() => go("/vocabulary")}>
                <BookOpen className="size-4" aria-hidden />
                <span>{w.word}</span>
                <span className="ml-auto text-xs text-muted-foreground">{w.meaning_id}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {data?.grammar.length ? (
          <CommandGroup heading="Grammar">
            {data.grammar.map((g) => (
              <CommandItem key={g.slug} value={`grammar-${g.title}`} onSelect={() => go(`/grammar/${g.slug}`)}>
                <SpellCheck className="size-4" aria-hidden />
                <span>{g.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">{g.level_code}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
