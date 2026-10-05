import { stripHtml, truncate } from "./format";
import { absoluteUrl } from "./site";
import type { Product, ProductDetail, Review, StoreSettings } from "./types";

type LD = Record<string, unknown>;

export function organizationLd(settings: StoreSettings, siteUrl: string): LD {
  const sameAs = Object.values(settings.social).filter((v) => typeof v === "string" && /^https?:\/\//.test(v));
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: settings.general.store_name,
    url: siteUrl,
    ...(settings.general.logo_url ? { logo: settings.general.logo_url } : {}),
    ...(settings.general.contact_email ? { email: settings.general.contact_email } : {}),
    ...(settings.general.contact_phone ? { telephone: settings.general.contact_phone } : {}),
    ...(settings.general.address ? { address: settings.general.address } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteLd(settings: StoreSettings, siteUrl: string): LD {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: settings.general.store_name,
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbLd(siteUrl: string, items: { name: string; path: string }[]): LD {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(siteUrl, it.path),
    })),
  };
}

export function itemListLd(siteUrl: string, name: string, products: Product[], offset = 0): LD {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: offset + i + 1,
      url: absoluteUrl(siteUrl, `/products/${p.slug}`),
      name: p.name,
    })),
  };
}

export function productLd(settings: StoreSettings, siteUrl: string, product: ProductDetail, reviews: Review[]): LD {
  const url = absoluteUrl(siteUrl, `/products/${product.slug}`);
  const description = truncate(stripHtml(product.meta_description || product.short_description || product.description), 5000);
  const ld: LD = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    url,
    image: product.images.map((i) => i.url),
    ...(description ? { description } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(product.category ? { category: product.category.name } : {}),
    offers: {
      "@type": "Offer",
      url,
      price: Number(product.price).toFixed(2),
      priceCurrency: settings.general.currency,
      availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: settings.general.store_name },
    },
  };
  if (product.rating_count > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.rating_avg).toFixed(1),
      reviewCount: product.rating_count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  if (reviews.length) {
    ld.review = reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author_name || "Customer" },
      datePublished: r.created_at?.slice(0, 10),
      ...(r.title ? { name: r.title } : {}),
      ...(r.body ? { reviewBody: r.body } : {}),
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    }));
  }
  return ld;
}
