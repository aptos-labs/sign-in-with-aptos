import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

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

/**
 * JSX components to remove from content (with their children)
 * Add new components here as they are used in documentation
 */
const JSX_COMPONENTS_TO_REMOVE = ["Steps", "TSDoc", "Callout"];

/**
 * Extract frontmatter and content from MDX file using gray-matter
 */
function parseMdxFile(content: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  try {
    const parsed = matter(content);
    // Convert frontmatter values to strings for consistency
    const frontmatter: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      frontmatter[key] = String(value);
    }
    return {
      frontmatter,
      body: parsed.content.trim(),
    };
  } catch {
    // Fallback if gray-matter fails
    return { frontmatter: {}, body: content };
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
    return headingMatch[1];
  }

  return "Untitled";
}

/**
 * Extract description from content (first paragraph after imports/heading)
 */
function extractDescription(body: string): string | undefined {
  // Remove imports and JSX components
  const cleanedBody = body
    .replace(/^import\s+.*$/gm, "")
    .replace(/<[^>]+\/>/g, "")
    .replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, "")
    .trim();

  // Find first paragraph after heading
  const lines = cleanedBody.split(/\r?\n/).filter((line) => line.trim());
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("```") &&
      !trimmed.startsWith("<") &&
      !trimmed.startsWith("import")
    ) {
      return trimmed.slice(0, 200);
    }
  }

  return undefined;
}

/**
 * Clean MDX content for plain text output
 */
function cleanMdxContent(content: string): string {
  // Build regex patterns from the component list
  const componentsPattern = JSX_COMPONENTS_TO_REMOVE.join("|");

  return (
    content
      // Remove import statements
      .replace(/^import\s+.*$/gm, "")
      // Remove JSX/TSX components with their content
      .replace(
        new RegExp(`<(${componentsPattern})[^>]*>[\\s\\S]*?<\\/\\1>`, "g"),
        "",
      )
      .replace(new RegExp(`<(${componentsPattern})[^>]*\\/>`, "g"), "")
      // Remove self-closing JSX tags
      .replace(/<[A-Z][a-zA-Z]*[^>]*\/>/g, "")
      // Remove JSX component wrappers but keep content
      .replace(/<\/?[A-Z][a-zA-Z]*[^>]*>/g, "")
      // Remove HTML tags
      .replace(/<\/?[a-z][a-zA-Z]*[^>]*>/g, "")
      // Clean up extra newlines
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
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

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip _meta files directory
      if (entry.name.startsWith("_")) continue;

      const newBasePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      pages.push(...readMdxFiles(fullPath, newBasePath));
    } else if (entry.name === "page.mdx") {
      const content = fs.readFileSync(fullPath, "utf-8");
      const { frontmatter, body } = parseMdxFile(content);
      const title = extractTitle(frontmatter, body);
      const description = extractDescription(body);

      // Determine section from path - handle empty basePath correctly
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

  // Group by section
  const sectionMap = new Map<string, DocPage[]>();

  for (const page of pages) {
    const existing = sectionMap.get(page.section) || [];
    existing.push(page);
    sectionMap.set(page.section, existing);
  }

  // Define section order
  const sectionOrder = [
    "Overview",
    "@aptos-labs/siwa",
    "@aptos-labs/siwa API Reference",
    "@aptos-labs/wallet-adapter-react",
    "@aptos-labs/wallet-standard",
    "Support",
  ];

  const sections: DocSection[] = [];

  for (const title of sectionOrder) {
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
