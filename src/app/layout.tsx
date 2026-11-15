import type { Metadata, Viewport } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "Kanastro",
  description:
    "Vedic astrology charts, birth profiles, and side-by-side comparison.",
  metadataBase: new URL("https://kanastro.kahansonani.com"),
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0f0c",
};

const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('kanastro-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
