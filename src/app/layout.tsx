import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Caprasimo,
  Instrument_Serif,
} from "next/font/google";
import { HeaderTabs } from "@/components/HeaderTabs";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const caprasimo = Caprasimo({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-caprasimo",
  display: "swap",
});

const instrument = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Frufru Digital Studio™ — design fofo, mas entrega",
  description:
    "Estúdio criativo de design, UI/UX e branding. Neobrutalismo pastel, Y2K e um gato espacial no meio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${caprasimo.variable} ${instrument.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="font-bricolage min-h-full bg-background text-foreground">
        <ThemeProvider>
          <HeaderTabs />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
