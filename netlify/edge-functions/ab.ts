// netlify/edge-functions/ab.ts  (thebluebridge.net test)
import type { Context } from "https://edge.netlify.com";

// Even split: each page is equally likely.
const VARIANTS = [
  { name: "main", path: "/services" },
  { name: "me",   path: "/services-me" },
  { name: "you",  path: "/services-you" },
];

export default async (request: Request, context: Context) => {
  // Sticky: returning visitors keep the variant they were first given.
  let variant = VARIANTS.find(v => v.name === context.cookies.get("lp_services"));

  if (!variant) {
    variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
    context.cookies.set({
      name: "lp_services",
      value: variant.name,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "Lax",
      secure: true,
    });
  }

  // Server-side rewrite: URL stays /services-offer; UTMs, gclid and fbclid pass through.
  const { search } = new URL(request.url);
  return context.rewrite(variant.path + search);
};

// The fixed URL. Must not exist as a real page or redirect rule.
export const config = { path: ["/services-offer", "/services-offer/"] };
