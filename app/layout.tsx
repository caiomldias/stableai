import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Archivo, Geist_Mono } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "StableAI", template: "%s | StableAI" },
  description: "Seu assistente pessoal para organizar contas, gastos e planos.",
  applicationName: "StableAI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StableAI",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#071827",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${geistMono.variable}`} data-theme="dark">
      <body>
        <Theme appearance="dark" accentColor="blue" grayColor="slate" radius="none" scaling="100%">
          {children}
        </Theme>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
