import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/competitor-analyze
 * Body: { url: string }
 *
 * Fetches a competitor website, extracts key information, and optionally
 * generates an AI summary. Used by the Competitor Analyzer form field.
 *
 * This endpoint is intentionally public (no auth) because it is called from
 * the public-facing submission form on client subdomains. It only fetches and
 * parses publicly-available HTML — no user data is accessed.
 */
export async function POST(req: NextRequest) {
  let body: { url: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url } = body;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url field" }, { status: 400 });
  }

  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Fetch the page with a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinqMe/1.0; +https://linqme.co)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch site (HTTP ${response.status})` },
        { status: 502 },
      );
    }

    const html = await response.text();

    // Extract basic metadata from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,
    ) ?? html.match(
      /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i,
    );
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i,
    ) ?? html.match(
      /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i,
    );

    // Extract visible text (strip tags, scripts, styles)
    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " [NAV] ")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " [HEADER] ")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " [FOOTER] ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Extract headings for structure analysis
    const headings: string[] = [];
    const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
    let hMatch;
    while ((hMatch = headingRegex.exec(html)) !== null && headings.length < 20) {
      const text = hMatch[1].replace(/<[^>]+>/g, "").trim();
      if (text) headings.push(text);
    }

    // Extract links for navigation analysis
    const navLinks: string[] = [];
    const linkRegex = /<a[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let lMatch;
    while ((lMatch = linkRegex.exec(html)) !== null && navLinks.length < 15) {
      const linkText = lMatch[2].replace(/<[^>]+>/g, "").trim();
      if (linkText && linkText.length < 50) navLinks.push(linkText);
    }

    // Build analysis result
    const result = {
      url: parsed.toString(),
      title: titleMatch?.[1]?.trim() ?? null,
      description: descMatch?.[1]?.trim() ?? null,
      ogImage: ogImageMatch?.[1]?.trim() ?? null,
      headings: headings.slice(0, 10),
      navLinks: [...new Set(navLinks)].slice(0, 10),
      textPreview: cleaned.slice(0, 500),
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("abort")) {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: `Fetch failed: ${message}` }, { status: 502 });
  }
}
