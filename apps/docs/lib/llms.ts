import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { generateDefinition } from "nextra/tsdoc";

interface DocPage {
  slug: string;
  title: string;
  description?: string;
  content: string;
  section: string;
}

interface DocSection {
  title: string;
  pages: DocPage[];
}

const DOCS_DIR = path.join(process.cwd(), "app/docs");

/** Layout-only MDX components: strip tags but keep inner Markdown */
const JSX_LAYOUT_UNWRAP = ["Steps", "Callout"];

type PlainSegment =
  | { kind: "text"; value: string }
  | { kind: "code"; value: string; fenceSuffix: string };

/**
 * Split MDX so transformations never touch fenced code (imports, JSX examples, etc.).
 */
function splitByCodeFences(source: string): PlainSegment[] {
  const parts: PlainSegment[] = [];
  let i = 0;
  while (i < source.length) {
    const fenceStart = source.indexOf("```", i);
    if (fenceStart === -1) {
      parts.push({ kind: "text", value: source.slice(i) });
      break;
    }
    if (fenceStart > i) {
      parts.push({ kind: "text", value: source.slice(i, fenceStart) });
    }
    const lineEnd = source.indexOf("\n", fenceStart + 3);
    if (lineEnd === -1) {
      parts.push({ kind: "text", value: source.slice(fenceStart) });
      break;
    }
    const fenceSuffix = source.slice(fenceStart + 3, lineEnd);
    const bodyStart = lineEnd + 1;
    const close = source.indexOf("```", bodyStart);
    if (close === -1) {
      parts.push({ kind: "text", value: source.slice(fenceStart) });
      break;
    }
    parts.push({
      kind: "code",
      value: source.slice(bodyStart, close),
      fenceSuffix,
    });
    let after = close + 3;
    if (source[after] === "\r") after++;
    if (source[after] === "\n") after++;
    i = after;
  }
  return parts;
}

function joinPlainSegments(parts: PlainSegment[]): string {
  let out = "";
  for (const p of parts) {
    if (p.kind === "code") {
      out += "```";
      out += p.fenceSuffix;
      out += "\n";
      out += p.value;
      out += "\n```";
    } else {
      out += p.value;
    }
  }
  return out;
}

/**
 * Remove top-level MDX import lines (only from the first prose segment before any fence).
 */
function stripLeadingMdxImports(parts: PlainSegment[]): void {
  let seenCode = false;
  for (const p of parts) {
    if (p.kind === "code") {
      seenCode = true;
      continue;
    }
    if (seenCode) continue;
    const lines = p.value.split(/\r?\n/);
    let j = 0;
    while (j < lines.length) {
      const line = lines[j] ?? "";
      if (/^\s*import\s+.+$/.test(line)) {
        j++;
        continue;
      }
      if (line.trim() === "") {
        j++;
        continue;
      }
      break;
    }
    p.value = lines.slice(j).join("\n");
    break;
  }
}

/**
 * Remove a paired JSX tag (and self-closing), preserving children. Handles nesting of the same tag.
 */
function unwrapJsxTag(source: string, tagName: string): string {
  const openPrefix = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  let result = "";
  let i = 0;
  while (i < source.length) {
    const start = source.indexOf(openPrefix, i);
    if (start === -1) {
      result += source.slice(i);
      break;
    }
    const boundary = start + openPrefix.length;
    const nextCh = source[boundary];
    if (nextCh && /[A-Za-z0-9]/.test(nextCh)) {
      result += source.slice(i, start + 1);
      i = start + 1;
      continue;
    }
    result += source.slice(i, start);
    const gt = source.indexOf(">", boundary);
    if (gt === -1) {
      result += source.slice(start);
      break;
    }
    const openTagSlice = source.slice(start, gt + 1);
    if (openTagSlice.endsWith("/>")) {
      i = gt + 1;
      continue;
    }
    let depth = 1;
    let search = gt + 1;
    let matched = false;
    while (search < source.length) {
      const nextClose = source.indexOf(closeTag, search);
      const nextOpen = source.indexOf(openPrefix, search);
      const openValid =
        nextOpen !== -1 &&
        (nextClose === -1 || nextOpen < nextClose) &&
        (nextOpen + openPrefix.length >= source.length ||
          !/[A-Za-z0-9]/.test(source[nextOpen + openPrefix.length] ?? ""));
      if (openValid) {
        const openGt = source.indexOf(">", nextOpen);
        if (openGt === -1) break;
        const frag = source.slice(nextOpen, openGt + 1);
        if (!frag.endsWith("/>")) depth++;
        search = openGt + 1;
        continue;
      }
      if (nextClose === -1) break;
      depth--;
      if (depth === 0) {
        result += source.slice(gt + 1, nextClose);
        i = nextClose + closeTag.length;
        matched = true;
        break;
      }
      search = nextClose + closeTag.length;
    }
    if (!matched) {
      result += source.slice(start);
      break;
    }
  }
  return result;
}

function unwrapLayoutComponents(text: string): string {
  let t = text;
  for (const name of JSX_LAYOUT_UNWRAP) {
    t = unwrapJsxTag(t, name);
  }
  return t;
}

function extractTemplateLiteralAfterKey(
  block: string,
  key: string,
): string | null {
  const idx = block.indexOf(key);
  if (idx === -1) return null;
  let i = idx + key.length;
  while (i < block.length && /\s/.test(block[i] ?? "")) i++;
  if (block[i] !== "`") return null;
  i++;
  let escaped = false;
  let buf = "";
  while (i < block.length) {
    const c = block[i] ?? "";
    if (escaped) {
      buf += c;
      escaped = false;
      i++;
      continue;
    }
    if (c === "\\") {
      escaped = true;
      buf += c;
      i++;
      continue;
    }
    if (c === "`") break;
    buf += c;
    i++;
  }
  if (i >= block.length || block[i] !== "`") return null;
  return buf;
}

function parseTsdocGenerateOptions(block: string): {
  code: string;
  exportName?: string;
  flattened?: boolean;
} | null {
  const code = extractTemplateLiteralAfterKey(block, "code:");
  if (!code) return null;
  const exportNameMatch = block.match(/exportName:\s*["']([^"']+)["']/);
  const flatMatch = block.match(/flattened:\s*(true|false)/);
  return {
    code,
    ...(exportNameMatch && { exportName: exportNameMatch[1] }),
    ...(flatMatch && { flattened: flatMatch[1] === "true" }),
  };
}

function formatTypeField(
  field: {
    name: string;
    type: string;
    description?: string;
    optional?: boolean;
    tags?: Record<string, string>;
  },
  indent: string,
): string {
  let line = `${indent}- **${field.name}**${field.optional ? " (optional)" : ""}: \`${field.type}\``;
  if (field.description) line += `\n${indent}  ${field.description}`;
  if (field.tags && Object.keys(field.tags).length > 0) {
    for (const [k, v] of Object.entries(field.tags)) {
      line += `\n${indent}  @${k} ${v}`;
    }
  }
  return `${line}\n`;
}

function formatGeneratedDefinition(def: Record<string, unknown>): string {
  const lines: string[] = [];
  if (typeof def.name === "string") {
    lines.push(`**${def.name}**`);
    lines.push("");
  }
  if (typeof def.description === "string" && def.description.trim()) {
    lines.push(def.description.trim());
    lines.push("");
  }
  if (def.tags && typeof def.tags === "object") {
    for (const [k, v] of Object.entries(def.tags as Record<string, string>)) {
      lines.push(`@${k} ${v}`);
    }
    if (Object.keys(def.tags as object).length) lines.push("");
  }
  if (Array.isArray(def.signatures)) {
    for (const sig of def.signatures as Array<{
      params?: unknown[];
      returns?: unknown;
    }>) {
      lines.push("**Signatures**");
      lines.push("");
      if (Array.isArray(sig.params)) {
        for (const p of sig.params) {
          lines.push(formatTypeField(p as never, "  ").trimEnd());
        }
      }
      if (sig.returns) {
        lines.push("**Returns**");
        lines.push("");
        if (Array.isArray(sig.returns)) {
          for (const r of sig.returns) {
            if (r && typeof r === "object" && "name" in (r as object)) {
              lines.push(formatTypeField(r as never, "  ").trimEnd());
            } else if (r && typeof r === "object" && "type" in (r as object)) {
              lines.push(`  - \`${(r as { type: string }).type}\``);
            }
          }
        } else if (
          sig.returns &&
          typeof sig.returns === "object" &&
          "type" in (sig.returns as object)
        ) {
          lines.push(`  \`${(sig.returns as { type: string }).type}\``);
        }
      }
      lines.push("");
    }
  }
  if (Array.isArray(def.entries)) {
    lines.push("**Members**");
    lines.push("");
    for (const e of def.entries) {
      lines.push(formatTypeField(e as never, "  ").trimEnd());
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

function expandTsdocBlocksInText(text: string): string {
  return text.replace(/<TSDoc[\s\S]*?\/>/g, (block) => {
    const opts = parseTsdocGenerateOptions(block);
    if (!opts) {
      return "\n<!-- TSDoc: could not parse generateDefinition options -->\n";
    }
    try {
      const def = generateDefinition({
        code: opts.code,
        exportName: opts.exportName ?? "default",
        flattened: opts.flattened ?? false,
      }) as Record<string, unknown>;
      const formatted = formatGeneratedDefinition(def);
      return `\n### API (from TypeScript)\n\n${formatted}\n`;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return `\n### API (TSDoc expansion failed)\n\n${msg}\n\n\`\`\`ts\n${opts.code}\n\`\`\`\n`;
    }
  });
}

function stripRemainingJsxAndHtml(text: string): string {
  return (
    text
      // Self-closing PascalCase components (not already handled)
      .replace(/<[A-Z][A-Za-z0-9]*[^>]*\/>/g, "")
      // Paired PascalCase tags — drop tags, keep inner text
      .replace(/<[A-Z][A-Za-z0-9]*[^>]*>/g, "")
      .replace(/<\/[A-Z][A-Za-z0-9]*>/g, "")
      // HTML-like tags
      .replace(/<\/?[a-z][a-zA-Z0-9:-]*[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Clean MDX body for plain-text LLM output (never mutates fenced code bodies).
 */
function cleanMdxContent(body: string): string {
  const parts = splitByCodeFences(body);
  stripLeadingMdxImports(parts);
  for (const p of parts) {
    if (p.kind !== "text") continue;
    let t = p.value;
    t = unwrapLayoutComponents(t);
    t = expandTsdocBlocksInText(t);
    t = stripRemainingJsxAndHtml(t);
    p.value = t;
  }
  return joinPlainSegments(parts).trim();
}

/**
 * Extract frontmatter and content from MDX file using gray-matter
 */
function parseMdxFile(content: string): {
  frontmatter: Record<string, string>;
  body: string;
  isEmpty: boolean;
} {
  try {
    const parsed = matter(content);
    const frontmatter: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      frontmatter[key] = String(value);
    }
    return {
      frontmatter,
      body: parsed.content.trim(),
      isEmpty: !parsed.content.trim() && Object.keys(parsed.data).length === 0,
    };
  } catch {
    return { frontmatter: {}, body: content, isEmpty: false };
  }
}

/**
 * Extract title from MDX content (frontmatter or first heading)
 */
function extractTitle(
  frontmatter: Record<string, string>,
  body: string,
): string {
  if (frontmatter.title) {
    return frontmatter.title;
  }

  const headingMatch = body.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1] ?? "Untitled";
  }

  return "Untitled";
}

function firstPlainParagraphFromCleaned(plain: string): string | undefined {
  const lines = plain
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    if (line.startsWith("#")) continue;
    if (line.startsWith("```")) continue;
    if (line.startsWith("---")) continue;
    if (line.startsWith("### API")) continue;
    return line.slice(0, 200);
  }
  return undefined;
}

/**
 * Extract description from content (first paragraph after imports/heading)
 */
function extractDescription(body: string): string | undefined {
  return firstPlainParagraphFromCleaned(cleanMdxContent(body));
}

/**
 * Skip placeholder MDX routes (e.g. frontmatter-only stubs).
 */
function shouldSkipDocPage(
  isEmpty: boolean,
  frontmatter: Record<string, string>,
  body: string,
): boolean {
  if (!body.trim() && !frontmatter.title) return true;
  if (isEmpty && !frontmatter.title) return true;
  return false;
}

/**
 * Determine section from path parts
 */
function getSectionFromPath(pathParts: string[]): string {
  if (pathParts.length === 0 || pathParts[0] === "") {
    return "Overview";
  }

  if (pathParts[0] === "ts-aptos-labs-siwa") {
    return pathParts[1] === "reference"
      ? "@aptos-labs/siwa API Reference"
      : "@aptos-labs/siwa";
  }

  if (pathParts[0] === "ts-aptos-labs-wallet-adapter-react") {
    return "@aptos-labs/wallet-adapter-react";
  }

  if (pathParts[0] === "ts-aptos-labs-wallet-standard") {
    return "@aptos-labs/wallet-standard";
  }

  if (pathParts[0] === "wallet-integrations") {
    return "Support";
  }

  return "Overview";
}

/**
 * Recursively read all MDX files from a directory
 */
function readMdxFiles(dir: string, basePath = ""): DocPage[] {
  const pages: DocPage[] = [];

  if (!fs.existsSync(dir)) {
    return pages;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith("_")) continue;

      const newBasePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      pages.push(...readMdxFiles(fullPath, newBasePath));
    } else if (entry.name === "page.mdx") {
      const content = fs.readFileSync(fullPath, "utf-8");
      const { frontmatter, body, isEmpty } = parseMdxFile(content);
      if (shouldSkipDocPage(isEmpty, frontmatter, body)) continue;

      const title = extractTitle(frontmatter, body);
      const description = extractDescription(body);

      const pathParts = basePath ? basePath.split("/") : [];
      const section = getSectionFromPath(pathParts);

      pages.push({
        slug: basePath || "index",
        title,
        description,
        content: cleanMdxContent(body),
        section,
      });
    }
  }

  return pages;
}

/**
 * Get all documentation pages organized by section
 */
export function getDocPages(): DocSection[] {
  const pages = readMdxFiles(DOCS_DIR);

  const sectionMap = new Map<string, DocPage[]>();

  for (const page of pages) {
    const existing = sectionMap.get(page.section) || [];
    existing.push(page);
    sectionMap.set(page.section, existing);
  }

  for (const [, sectionPages] of sectionMap) {
    sectionPages.sort((a, b) => a.slug.localeCompare(b.slug));
  }

  const sectionOrder = [
    "Overview",
    "@aptos-labs/siwa",
    "@aptos-labs/siwa API Reference",
    "@aptos-labs/wallet-adapter-react",
    "@aptos-labs/wallet-standard",
    "Support",
  ];

  const sections: DocSection[] = [];
  const used = new Set<string>();

  for (const title of sectionOrder) {
    const sectionPages = sectionMap.get(title);
    if (sectionPages && sectionPages.length > 0) {
      sections.push({ title, pages: sectionPages });
      used.add(title);
    }
  }

  const remainingTitles = [...sectionMap.keys()]
    .filter((t) => !used.has(t))
    .sort((a, b) => a.localeCompare(b));
  for (const title of remainingTitles) {
    const sectionPages = sectionMap.get(title);
    if (sectionPages && sectionPages.length > 0) {
      sections.push({ title, pages: sectionPages });
    }
  }

  return sections;
}

/**
 * Generate llms.txt content (overview with links)
 */
export function generateLlmsTxt(baseUrl: string): string {
  const sections = getDocPages();

  let output = `# Sign in with Aptos (SIWA)

> Authenticate users securely using their Aptos account. A standardized authentication protocol for Aptos accounts that replaces the traditional connect + signMessage flow with a streamlined one-click signIn method.

The "Sign in with Aptos" (SIWA) standard introduces a secure and user-friendly way for users to authenticate to off-chain resources by proving ownership of their Aptos account. SIWA leverages Aptos accounts to avoid reliance on traditional schemes like SSO while incorporating security measures to combat phishing attacks and improve user visibility.

`;

  for (const section of sections) {
    output += `## ${section.title}\n\n`;

    for (const page of section.pages) {
      const url = page.slug === "index" ? "/docs" : `/docs/${page.slug}`;
      const description = page.description ? `: ${page.description}` : "";
      output += `- [${page.title}](${url})${description}\n`;
    }

    output += "\n";
  }

  output += `## External Resources

- [AIP-116](https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-116.md): Aptos Improvement Proposal for SIWA
- [GitHub Repository](https://github.com/aptos-labs/sign-in-with-aptos): Source code and examples
- [Wallet Adapter Documentation](https://aptos.dev/en/build/sdks/wallet-adapter/dapp): Official Aptos wallet adapter docs

## Optional: llms-full.txt

For a more comprehensive version with full page content, see [llms-full.txt](${baseUrl}/llms-full.txt)
`;

  return output;
}

/**
 * Generate llms-full.txt content (full documentation)
 */
export function generateLlmsFullTxt(baseUrl: string): string {
  const sections = getDocPages();

  let output = `# Sign in with Aptos (SIWA) - Full Documentation

> Authenticate users securely using their Aptos account. A standardized authentication protocol for Aptos accounts.

Source: ${baseUrl}
GitHub: https://github.com/aptos-labs/sign-in-with-aptos

---

`;

  for (const section of sections) {
    output += `## ${section.title}\n\n`;

    for (const page of section.pages) {
      output += `### ${page.title}\n\n`;
      output += `${page.content}\n\n`;
      output += "---\n\n";
    }
  }

  output += `## External Resources

- AIP-116: https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-116.md
- GitHub Repository: https://github.com/aptos-labs/sign-in-with-aptos
- Wallet Adapter Documentation: https://aptos.dev/en/build/sdks/wallet-adapter/dapp
- EIP-4361: https://eips.ethereum.org/EIPS/eip-4361
- CAIP-122: https://chainagnostic.org/CAIPs/caip-122
`;

  return output;
}
