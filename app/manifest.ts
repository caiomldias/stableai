import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StableAI",
    short_name: "StableAI",
    description: "Assistente e organizador financeiro pessoal.",
    start_url: "/",
    display: "standalone",
    background_color: "#071827",
    theme_color: "#071827",
    orientation: "portrait-primary",
    lang: "pt-BR",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Gastos", short_name: "Gastos", url: "/?view=expenses", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Planejar", short_name: "Planejar", url: "/?view=plan", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
