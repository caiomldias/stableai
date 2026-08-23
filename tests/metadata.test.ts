import { describe, expect, it } from "vitest";
import { extractProductMetadata } from "@/app/api/metadata/route";

describe("product metadata", () => {
  it("reads Product JSON-LD and selects the lowest offer", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@type": "Product",
      name: "Fone &amp; estojo",
      image: "/produto.jpg",
      offers: [
        { "@type": "Offer", price: "1.999,00", priceCurrency: "BRL" },
        { "@type": "Offer", price: "1.499,00", priceCurrency: "BRL" },
      ],
    })}</script>`;

    expect(extractProductMetadata(html, "https://loja.test/produto")).toEqual({
      title: "Fone & estojo",
      image: "https://loja.test/produto.jpg",
      price: 1499,
      currency: "BRL",
      missing: [],
    });
  });

  it("keeps the metadata fallback for US-formatted prices", () => {
    const html = '<meta property="og:title" content="Headphones"><meta property="product:price:amount" content="1,499.00"><meta property="product:price:currency" content="USD">';

    expect(extractProductMetadata(html, "https://store.test/item")).toMatchObject({ title: "Headphones", price: 1499, currency: "USD" });
  });
});
