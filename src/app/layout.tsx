import type { Metadata } from "next";
import { Montserrat, Montserrat_Alternates, Quicksand } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

const montserratAlt = Montserrat_Alternates({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-montserrat-alt",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Abacus",
  description: "Learning made accountable",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${montserratAlt.variable} ${quicksand.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
