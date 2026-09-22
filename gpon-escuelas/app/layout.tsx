import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: [
    {
      path: "./fonts/Inter-Variable.ttf",
      style: "normal",
      weight: "100 900",
    },
    {
      path: "./fonts/Inter-Italic-Variable.ttf",
      style: "italic",
      weight: "100 900",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: [
    {
      path: "./fonts/JetBrainsMono-Variable.ttf",
      style: "normal",
      weight: "100 900",
    },
    {
      path: "./fonts/JetBrainsMono-Italic-Variable.ttf",
      style: "italic",
      weight: "100 900",
    },
  ],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GPON Telecom - Sistema de Monitoreo Escolar",
  description:
    "Plataforma centralizada para la administración y seguimiento de conectividad en instituciones educativas del Estado de México.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}