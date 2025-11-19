import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const docsDirectory = path.join(process.cwd(), "docs");

export interface DocMetadata {
  title: string;
  description?: string;
  order?: number;
  draft?: boolean;
}

export interface Doc extends DocMetadata {
  slug: string;
  content: string;
}

export function getAllDocSlugs(): string[] {
  if (!fs.existsSync(docsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(docsDirectory);
  return fileNames
    .filter((name) => name.endsWith(".md") || name.endsWith(".mdx"))
    .map((name) => name.replace(/\.(md|mdx)$/, ""));
}

function stripFirstH1(content: string): string {
  // Remove the first H1 (# heading) from the content
  return content.replace(/^#\s+.+$/m, "").trim();
}

function processInternalLinks(content: string): string {
  // Convert markdown links that reference other docs to proper paths
  // Matches [text](filename) or [text](filename.md) and converts to [text](/filename)
  return content.replace(
    /\[([^\]]+)\]\((?!https?:\/\/|\/|#)([^)]+?)(\.mdx?)?(\))/g,
    (_match, text, filename) => {
      // Remove any .md or .mdx extension and add / prefix
      const cleanFilename = filename.replace(/\.(mdx?|md)$/, "");
      return `[${text}](/${cleanFilename})`;
    },
  );
}

export function getDocBySlug(slug: string): Doc | null {
  try {
    let fullPath = path.join(docsDirectory, `${slug}.md`);
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(docsDirectory, `${slug}.mdx`);
    }

    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    // Process the content: strip first H1 and fix internal links
    const processedContent = processInternalLinks(stripFirstH1(content));

    return {
      slug,
      title: data.title || slug,
      description: data.description,
      order: data.order,
      draft: data.draft,
      content: processedContent,
    };
  } catch (_error) {
    return null;
  }
}

export function getAllDocs(): Doc[] {
  const slugs = getAllDocSlugs();

  const docs = slugs
    .map((slug) => getDocBySlug(slug))
    .filter((doc): doc is Doc => doc !== null)
    .filter((doc) => {
      // In production, hide drafts
      if (process.env.NODE_ENV === "production") {
        return !doc.draft;
      }
      // In development, show all
      return true;
    });

  return docs.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return a.title.localeCompare(b.title);
  });
}

export function getDocTitles(): Record<string, string> {
  const docs = getAllDocs();
  return docs.reduce(
    (acc, doc) => {
      acc[doc.slug] = doc.title;
      return acc;
    },
    {} as Record<string, string>,
  );
}

export function getOrderedDocSlugs(): string[] {
  return getAllDocs().map((doc) => doc.slug);
}

export function getNextDocSlug(currentSlug: string): string | null {
  const slugs = getOrderedDocSlugs();
  const currentIndex = slugs.indexOf(currentSlug);

  if (currentIndex === -1 || currentIndex === slugs.length - 1) {
    return null;
  }

  return slugs[currentIndex + 1] ?? null;
}
