import { codeToHtml } from "shiki";
import { CopyButton } from "./copy-button";

export async function CodeBlock({
  code,
  lang = "tsx",
  filename,
}: {
  code: string;
  lang?: string;
  filename?: string;
}) {
  const html = await codeToHtml(code, {
    lang,
    theme: "github-dark",
  });

  return (
    <div className="overflow-hidden rounded-md border border-bg-700 bg-bg-900">
      <div className="flex items-center justify-between border-b border-bg-700 px-3 py-1.5">
        <span className="font-mono text-xs text-text-600">
          {filename ?? lang}
        </span>
        <CopyButton code={code} />
      </div>
      <div
        className="overflow-x-auto p-3 text-[13px] leading-relaxed [&_pre]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
