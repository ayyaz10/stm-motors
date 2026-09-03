import { useEffect } from "react";

interface PageMetadataOptions {
  title: string;
  description: string;
  pathname: string;
  imagePath?: string;
  structuredData?: object | object[];
  canonicalOrigin?: string;
  noIndex?: boolean;
  openGraphType?: "website" | "article" | "product";
}

function ensureMetaTag(
  selector: string,
  create: () => HTMLMetaElement | HTMLLinkElement,
) {
  const existingElement = document.head.querySelector(selector);

  if (existingElement) {
    return existingElement as HTMLMetaElement | HTMLLinkElement;
  }

  const nextElement = create();
  document.head.appendChild(nextElement);
  return nextElement;
}

export function usePageMetadata({
  title,
  description,
  pathname,
  imagePath = "/stm-social-card.svg",
  structuredData,
  canonicalOrigin,
  noIndex = false,
  openGraphType = "website",
}: PageMetadataOptions) {
  useEffect(() => {
    const origin = canonicalOrigin || window.location.origin;
    const canonicalUrl = new URL(pathname, origin).toString();
    const imageUrl = new URL(imagePath, origin).toString();

    document.title = title;

    const descriptionMeta = ensureMetaTag('meta[name="description"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      return meta;
    }) as HTMLMetaElement;
    descriptionMeta.setAttribute("content", description);

    const canonicalLink = ensureMetaTag('link[rel="canonical"]', () => {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      return link;
    }) as HTMLLinkElement;
    canonicalLink.setAttribute("href", canonicalUrl);

    const openGraphTitle = ensureMetaTag('meta[property="og:title"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:title");
      return meta;
    }) as HTMLMetaElement;
    openGraphTitle.setAttribute("content", title);

    const openGraphDescription = ensureMetaTag(
      'meta[property="og:description"]',
      () => {
        const meta = document.createElement("meta");
        meta.setAttribute("property", "og:description");
        return meta;
      },
    ) as HTMLMetaElement;
    openGraphDescription.setAttribute("content", description);

    const openGraphTypeMeta = ensureMetaTag('meta[property="og:type"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:type");
      return meta;
    }) as HTMLMetaElement;
    openGraphTypeMeta.setAttribute("content", openGraphType);

    const robotsMeta = ensureMetaTag('meta[name="robots"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      return meta;
    }) as HTMLMetaElement;
    robotsMeta.setAttribute("content", noIndex ? "noindex, nofollow" : "index, follow");

    const openGraphUrl = ensureMetaTag('meta[property="og:url"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:url");
      return meta;
    }) as HTMLMetaElement;
    openGraphUrl.setAttribute("content", canonicalUrl);

    const openGraphImage = ensureMetaTag('meta[property="og:image"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:image");
      return meta;
    }) as HTMLMetaElement;
    openGraphImage.setAttribute("content", imageUrl);

    const twitterCard = ensureMetaTag('meta[name="twitter:card"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "twitter:card");
      return meta;
    }) as HTMLMetaElement;
    twitterCard.setAttribute("content", "summary_large_image");

    const twitterTitle = ensureMetaTag('meta[name="twitter:title"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "twitter:title");
      return meta;
    }) as HTMLMetaElement;
    twitterTitle.setAttribute("content", title);

    const twitterDescription = ensureMetaTag(
      'meta[name="twitter:description"]',
      () => {
        const meta = document.createElement("meta");
        meta.setAttribute("name", "twitter:description");
        return meta;
      },
    ) as HTMLMetaElement;
    twitterDescription.setAttribute("content", description);

    const twitterImage = ensureMetaTag('meta[name="twitter:image"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "twitter:image");
      return meta;
    }) as HTMLMetaElement;
    twitterImage.setAttribute("content", imageUrl);

    const previousStructuredData = document.getElementById(
      "page-structured-data",
    );
    previousStructuredData?.remove();

    if (structuredData) {
      const script = document.createElement("script");
      script.id = "page-structured-data";
      script.type = "application/ld+json";
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      if (!structuredData) {
        document.getElementById("page-structured-data")?.remove();
      }
    };
  }, [canonicalOrigin, description, imagePath, noIndex, openGraphType, pathname, structuredData, title]);
}
