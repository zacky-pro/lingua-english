import { Fragment } from "react";

import { cn } from "@/lib/utils";

/** Renders **bold**, *italic*, `code` inside a line. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`"))
          return (
            <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
              {part.slice(1, -1)}
            </code>
          );
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
          return <em key={i}>{part.slice(1, -1)}</em>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** Small, dependency-free renderer for the light markdown the tutor writes. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: JSX.Element[] = [];
  let list: string[] = [];
  let ordered = false;

  const flush = () => {
    if (list.length === 0) return;
    const items = list.map((item, i) => (
      <li key={i} className="ml-4 list-outside">
        <Inline text={item} />
      </li>
    ));
    blocks.push(
      ordered ? (
        <ol key={`l${blocks.length}`} className="list-decimal space-y-1 pl-3">{items}</ol>
      ) : (
        <ul key={`l${blocks.length}`} className="list-disc space-y-1 pl-3">{items}</ul>
      ),
    );
    list = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const heading = line.match(/^\s*#{1,4}\s+(.*)$/);
    if (bullet) {
      if (ordered) flush();
      ordered = false;
      list.push(bullet[1] ?? "");
      return;
    }
    if (num) {
      if (!ordered) flush();
      ordered = true;
      list.push(num[1] ?? "");
      return;
    }
    flush();
    if (!line.trim()) return;
    if (heading) {
      blocks.push(
        <p key={`h${i}`} className="pt-1 text-[0.95em] font-semibold">
          <Inline text={heading[1] ?? ""} />
        </p>,
      );
      return;
    }
    blocks.push(
      <p key={`p${i}`}>
        <Inline text={line} />
      </p>,
    );
  });
  flush();

  return <div className={cn("space-y-2 leading-relaxed", className)}>{blocks}</div>;
}

/** Strips markdown so text-to-speech doesn't read the symbols out loud. */
export function plainText(text: string) {
  return text
    .replace(/[*_`#>]/g, "")
    .replace(/\s*\n\s*/g, ". ")
    .replace(/\.\s*\./g, ".")
    .trim();
}
