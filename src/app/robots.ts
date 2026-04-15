import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_MARKETING_URL || "https://mysitelaunch.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/checkout", "/api/", "/auth/", "/s/*/start/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
