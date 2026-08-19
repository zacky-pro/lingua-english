import { Rabbit, Volume2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { speak, speechSupported } from "@/lib/lingua";

export function AudioButton({
  text,
  slow,
  size = "icon",
  className,
  label,
}: {
  text: string;
  slow?: boolean;
  size?: "icon" | "sm" | "default";
  className?: string;
  label?: string;
}) {
  const [playing, setPlaying] = useState(false);

  function play() {
    if (!speechSupported()) {
      toast.info("Audio playback isn't supported in this browser.");
      return;
    }
    const ok = speak(text, slow ? 0.65 : 1);
    if (!ok) {
      toast.info("Audio playback isn't available right now.");
      return;
    }
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), Math.min(6000, 600 + text.length * 60));
  }

  return (
    <Button
      type="button"
      variant={size === "icon" ? "ghost" : "outline"}
      size={size === "icon" ? "icon" : size}
      onClick={play}
      className={cn(playing && "text-primary", className)}
      aria-label={label ?? (slow ? `Play slowly: ${text}` : `Play audio: ${text}`)}
    >
      {slow ? <Rabbit className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
      {size !== "icon" ? <span>{label ?? (slow ? "Slow" : "Listen")}</span> : null}
    </Button>
  );
}
