import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mappingcrimefrance.fr"),
  title: "Mapping Crime France | Carte des crimes et délits en France",
  description: "Explorez la carte citoyenne des crimes, délits et alertes communales en France. Recherchez par ville, date ou catégorie et consultez les sources des faits publiés.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "Mapping Crime France",
    title: "Mapping Crime France | Carte des crimes et délits",
    description: "Carte citoyenne des faits publiés et des alertes communales en France.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Mapping Crime France",
            url: "https://www.mappingcrimefrance.fr/",
          }) }}
        />{children}</body>
    </html>
  );
}
