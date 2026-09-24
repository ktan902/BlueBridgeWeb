// netlify/edge-functions/ab.ts
import type { Context } from "https://edge.netlify.com";

// Each set has 3 pages: main, brochure, report.
const pages = (base: string) => [
  { name: "main",     path: `/${base}.html` },
  { name: "brochure", path: `/${base}-brochure.html` },
  { name: "report",   path: `/${base}-report.html` },
];

// Fixed URL (what goes in the ad server) -> its set of 3 pages.
const SETS: Record<string, { set: string; variants: { name: string; path: string }[] }> = {
  "/roas-offer.html":          { set: "roas",          variants: pages("roas") },
  "/stranger-offer.html":      { set: "stranger",      variants: pages("stranger") },
  "/roi-offer.html":           { set: "roi",           variants: pages("roi") },
  "/fuel-business-offer.html": { set: "fuel-business", variants: pages("fuel-business") },
};

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const cfg = SETS[url.pathname];
  if (!cfg) return; // not one of our fixed URLs: pass through untouched

  // One cookie per set, so a visitor's variant is remembered separately for each.
  const cookieName = `lp_${cfg.set}`;
  let variant = cfg.variants.find(v => v.name === context.cookies.get(cookieName));

  if (!variant) {
    // Even split: each of the 3 pages is equally likely.
    variant = cfg.variants[Math.floor(Math.random() * cfg.variants.length)];
    context.cookies.set({
      name: cookieName,
      value: variant.name,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "Lax",
      secure: true,
    });
  }

  // Server-side rewrite: URL stays the fixed URL; UTMs, gclid and fbclid pass through.
  return context.rewrite(variant.path + url.search);
};

export const config = {
  path: ["/roas-offer.html", "/stranger-offer.html", "/roi-offer.html", "/fuel-business-offer.html"],
};
