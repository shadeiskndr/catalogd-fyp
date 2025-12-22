import { parseArgs } from "node:util";
import { $ } from "bun";
import { parseSync } from "oxc-parser";

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

const SKIP = [/^convex\/_generated\//, /^public\//, /^next-env\.d\.ts$/];

const KEEP = [
  /^[a-z][\w-]*-(disable|ignore|enable)(-[\w-]+)?\b/i,
  /^\/\s*<reference/,
  /^@ts-(expect-error|ignore|nocheck|check)/,
  /^(v8|c8|istanbul|node:coverage)\s+ignore/i,
  /^(@vite-ignore|@jsxImportSource|@jsx\b|@vitest-environment)/i,
  /^(#__PURE__|@__PURE__|webpackChunkName|webpackIgnore|webpackPrefetch|webpackPreload)/,
];

const LEGAL = /@license|@preserve|@copyright|\bCopyright\b|SPDX-License-Identifier/i;

const TODO = /\b(TODO|FIXME|HACK|XXX|@deprecated)\b/;

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    write: { type: "boolean", default: false },
    "keep-jsdoc": { type: "boolean", default: false },
    "keep-todo": { type: "boolean", default: false },
    "keep-pattern": { type: "string", multiple: true, default: [] },
    "no-format": { type: "boolean", default: false },
    quiet: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`Usage: bun run scripts/strip-comments.ts [paths...] [options]

  paths          files or directories to process (default: all tracked sources)

  --write        rewrite files in place (default: dry run)
  --keep-jsdoc   keep JSDoc doc blocks
  --keep-todo    keep TODO / FIXME / HACK / XXX / @deprecated comments
  --keep-pattern keep comments matching this regex (repeatable)
  --no-format    skip the biome format pass over rewritten files
  --quiet        only print the summary`);
  process.exit(0);
}

const files = (await $`git ls-files -z -- ${positionals.length > 0 ? positionals : "."}`.text())
  .split("\0")
  .filter(Boolean)
  .filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext)))
  .filter((file) => !SKIP.some((re) => re.test(file)));

const extraKeep = (values["keep-pattern"] ?? []).map((pattern) => new RegExp(pattern));

const isKept = (type: "Line" | "Block", value: string, raw: string) => {
  const body = (type === "Block" ? value.replace(/^[\s*]+/, "") : value).trimStart();
  if (KEEP.some((re) => re.test(body))) return true;
  if (extraKeep.some((re) => re.test(raw))) return true;
  if (LEGAL.test(raw)) return true;
  if (values["keep-jsdoc"] && raw.startsWith("/**")) return true;
  if (values["keep-todo"] && TODO.test(raw)) return true;
  return false;
};

const findJsxContainers = (node: unknown, out: Array<[number, number]> = []) => {
  if (Array.isArray(node)) {
    for (const child of node) findJsxContainers(child, out);
    return out;
  }
  if (node === null || typeof node !== "object") return out;
  const record = node as Record<string, unknown> & { type?: string; start?: number; end?: number };
  if (
    record.type === "JSXExpressionContainer" &&
    (record["expression"] as { type?: string } | undefined)?.type === "JSXEmptyExpression"
  ) {
    out.push([record.start as number, record.end as number]);
  }
  for (const key in record) {
    if (key === "type" || key === "start" || key === "end" || key === "range") continue;
    findJsxContainers(record[key], out);
  }
  return out;
};

type Edit = { start: number; end: number; text: string };

const toEdit = (source: string, start: number, end: number): Edit => {
  const lineStart = source.lastIndexOf("\n", start - 1) + 1;
  const newline = source.indexOf("\n", end);
  const lineEnd = newline === -1 ? source.length : newline;
  const before = source.slice(lineStart, start);
  const after = source.slice(end, lineEnd);

  if (before.trim() === "" && after.trim() === "") {
    return { start: lineStart, end: newline === -1 ? lineEnd : lineEnd + 1, text: "" };
  }
  if (after.trim() === "") {
    return { start: start - (before.length - before.trimEnd().length), end: lineEnd, text: "" };
  }
  return { start, end, text: " " };
};

let filesChanged = 0;
let removed = 0;
let kept = 0;
const skipped: string[] = [];
const rewritten: string[] = [];

for (const file of files) {
  const source = await Bun.file(file).text();
  if (!source.includes("//") && !source.includes("/*")) continue;

  const parsed = parseSync(file, source);
  if (parsed.errors.some((error) => error.severity === "Error")) {
    skipped.push(`${file} — parse error: ${parsed.errors[0]?.message}`);
    continue;
  }
  if (parsed.comments.length === 0) continue;

  const raw = (start: number, end: number) => source.slice(start, end);
  const doomed = parsed.comments.filter((c) => !isKept(c.type, c.value, raw(c.start, c.end)));
  kept += parsed.comments.length - doomed.length;
  if (doomed.length === 0) continue;

  const containers = findJsxContainers(parsed.program).filter(([start, end]) => {
    const inside = parsed.comments.filter((c) => c.start >= start && c.end <= end);
    return inside.length > 0 && inside.every((c) => doomed.includes(c));
  });
  const inContainer = (start: number, end: number) =>
    containers.some(([s, e]) => start >= s && end <= e);

  const edits = doomed
    .filter((c) => !inContainer(c.start, c.end))
    .map((c) => toEdit(source, c.start, c.end))
    .concat(containers.map(([start, end]) => toEdit(source, start, end)))
    .sort((a, b) => b.start - a.start);

  let output = source;
  for (const edit of edits) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  output = output.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
  if (output === source) continue;

  if (parseSync(file, output).errors.some((error) => error.severity === "Error")) {
    skipped.push(`${file} — output no longer parses, left untouched`);
    continue;
  }

  filesChanged++;
  removed += doomed.length;
  rewritten.push(file);
  if (!values.quiet) console.log(`${values.write ? "✂" : "·"} ${file} — ${doomed.length}`);
  if (values.write) await Bun.write(file, output);
}

if (values.write && !values["no-format"] && rewritten.length > 0) {
  await $`bunx biome format --write --no-errors-on-unmatched ${rewritten}`.quiet();
}

const verb = values.write ? "Removed" : "Would remove";
console.log(
  `\n${verb} ${removed} comment${removed === 1 ? "" : "s"} across ${filesChanged} file${filesChanged === 1 ? "" : "s"}; kept ${kept}.`
);
if (skipped.length > 0) console.error(`\nSkipped ${skipped.length}:\n  ${skipped.join("\n  ")}`);
if (!values.write) console.log("Dry run — pass --write to apply.");
