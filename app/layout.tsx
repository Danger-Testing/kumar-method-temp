import type { Metadata, Viewport } from "next";
import { EB_Garamond, IM_Fell_English, IM_Fell_English_SC } from "next/font/google";
import "./globals.css";
import "./kumar.css";
import NoZoom from "@/components/NoZoom";

const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-garamond",
});

const fell = IM_Fell_English({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: "400",
  variable: "--font-fell",
});

const fellSC = IM_Fell_English_SC({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fell-sc",
});

export const metadata: Metadata = {
  title: "The Kumar Method",
  description: "A short list of plain rules about money and about life.",
  openGraph: {
    title: "The Kumar Method",
    description: "A short list of plain rules about money and about life.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "The Kumar Method" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

/* no pinch/double-tap zoom anywhere on the site (owner) — the 3D
   scene and the page layout are composed to the viewport */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${garamond.variable} ${fell.variable} ${fellSC.variable}`}>
        <NoZoom />
        {children}
      </body>
    </html>
  );
}
