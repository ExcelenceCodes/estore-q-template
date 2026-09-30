import { site } from "./site";

export function buildBreadcrumbSchema(origin: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path}`,
    })),
  };
}

export function buildWebSiteSchema(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: origin,
    name: site.brand.name,
    description: site.seo.defaultDescription,
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildOrganizationSchema(origin: string, contactsData?: any) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": site.seo.organizationType || "Organization",
    name: site.brand.legalName,
    alternateName: site.brand.name,
    url: origin,
    logo: `${origin}${site.brand.logo}`,
    image: `${origin}${site.brand.logo}`,
    description: site.seo.defaultDescription,
    slogan: site.brand.motto,
  };

  if (contactsData) {
    if (contactsData.phones?.length) schema.telephone = contactsData.phones;
    if (contactsData.emails?.length) schema.email = contactsData.emails[0];

    schema.address = {
      "@type": "PostalAddress",
      streetAddress: contactsData.addressLines?.join(", ") || site.seo.geo.street,
      addressLocality: site.seo.geo.locality,
      addressRegion: site.seo.geo.region,
      addressCountry: site.seo.geo.country,
      postalCode: site.seo.geo.postalCode,
    };
  }

  // Inject Advanced Geo / LocalBusiness properties
  if (site.seo.geo.latitude && site.seo.geo.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: site.seo.geo.latitude,
      longitude: site.seo.geo.longitude,
    };
  }

  if (site.seo.geo.openingHours?.length) {
    schema.openingHoursSpecification = site.seo.geo.openingHours.map((hours) => {
      // Basic support for "Mo-Fr 08:00-17:00" format in JSON-LD
      const [days, time] = hours.split(" ");
      const [opens, closes] = (time || "").split("-");
      const dayMap: Record<string, string> = {
        Mo: "Monday",
        Tu: "Tuesday",
        We: "Wednesday",
        Th: "Thursday",
        Fr: "Friday",
        Sa: "Saturday",
        Su: "Sunday",
      };

      const parts = (days || "").split("-");
      const dayOfWeek =
        parts.length === 2
          ? Object.keys(dayMap)
              .slice(
                Object.keys(dayMap).indexOf(parts[0]),
                Object.keys(dayMap).indexOf(parts[1]) + 1,
              )
              .map((d) => dayMap[d])
          : [dayMap[parts[0]]];

      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: dayOfWeek.filter(Boolean),
        opens: opens || "00:00",
        closes: closes || "23:59",
      };
    });
  }

  if (site.seo.geo.priceRange) {
    schema.priceRange = site.seo.geo.priceRange;
  }

  schema.areaServed = site.seo.geo.locality;

  if (contactsData?.socials) {
    schema.sameAs = contactsData.socials.filter((s: any) => s.url).map((s: any) => s.url);
  }

  return schema;
}

export function buildServiceSchema(origin: string, service: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.summary,
    url: `${origin}/services/${service.slug}`,
    provider: {
      "@type": "Organization",
      name: site.brand.name,
      image: `${origin}${site.brand.logo}`,
    },
    areaServed: {
      "@type": "State",
      name: site.seo.geo.region,
    },
  };
}

export function buildProductSchema(origin: string, product: any, images?: string[]) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.sku,
    url: `${origin}/shop/product/${product.slug}`,
    brand: product.brand?.name
      ? {
          "@type": "Brand",
          name: product.brand.name,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: `${origin}/shop/product/${product.slug}`,
      priceCurrency: product.currency || "USD",
      price: Number(product.price),
      availability: product.status === "published"
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: site.brand.name,
      },
    },
  };

  if (images?.length) {
    schema.image = images.map((img) => (img.startsWith("http") ? img : `${origin}${img}`));
  }

  if (product.compare_at_price && Number(product.compare_at_price) > Number(product.price)) {
    schema.offers.priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  }

  return Object.fromEntries(Object.entries(schema).filter(([, v]) => v !== undefined));
}

export function buildItemListSchema(origin: string, items: { name: string; url: string; image?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${origin}${item.url}`,
      ...(item.image ? { image: item.image.startsWith("http") ? item.image : `${origin}${item.image}` } : {}),
    })),
  };
}

export function buildOrganizationJsonLd(origin: string) {
  return buildOrganizationSchema(origin);
}

export function buildWebSiteJsonLd(origin: string) {
  return buildWebSiteSchema(origin);
}
