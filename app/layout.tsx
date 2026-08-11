import type { Metadata } from "next";
import { EB_Garamond, IM_Fell_English, IM_Fell_English_SC } from "next/font/google";
import "./globals.css";
import "./kumar.css";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${garamond.variable} ${fell.variable} ${fellSC.variable}`}>
        {children}
      </body>
    </html>
  );
}
