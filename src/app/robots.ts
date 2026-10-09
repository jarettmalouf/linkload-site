import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/gate"],
    },
    sitemap: "https://linkload.co/sitemap.xml",
  };
}
