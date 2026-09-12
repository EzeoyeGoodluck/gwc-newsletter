import type { Metadata } from "next";
import { Manrope, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-gwc-heading",
  weight: ["400", "500", "600", "700"],
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  variable: "--font-gwc-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "GWC Newsletter",
  description: "Newsletter and communication platform for Glory Worship Church",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${beVietnamPro.variable} font-gwc-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
