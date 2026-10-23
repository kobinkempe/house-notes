import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = new URL("https://house-notes.example.invalid");
const title = "House Notes — a private home idea book";
const description = "Save, organize, and illustrate the details you may want in a future house.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description,
  applicationName: "House Notes",
  manifest: "/manifest.webmanifest?v=4",
  icons: {
    icon: [
      { url: "/house-notes-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/house-notes-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/house-notes-icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "House Notes",
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    type: "website",
    title,
    description,
    images: [{ url: "/og.png", width: 1680, height: 945, alt: "House Notes architectural idea book" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
};

export const viewport: Viewport = {
  themeColor: "#173d32",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
