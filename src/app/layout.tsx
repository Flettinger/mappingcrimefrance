import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mapping Crime France",
  description: "Cartographie citoyenne des crimes ou délits en France",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
