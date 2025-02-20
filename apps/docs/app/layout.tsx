import type { Metadata, Viewport } from "next";
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

import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import AppProviders from "@/context/AppProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://siwa.aptos.dev"),
  title: {
    default: "Sign in with Aptos (SIWA)",
    template: "%s | Sign in with Aptos",
  },
  description:
    "Authenticate users securely using their Aptos account. A standardized authentication protocol for Aptos accounts.",
  keywords: [
    "aptos",
    "authentication",
    "blockchain",
    "web3",
    "siwa",
    "crypto",
    "wallet",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://siwa.aptos.dev",
    siteName: "Sign in with Aptos",
    title: "Sign in with Aptos (SIWA)",
    description:
      "Authenticate users securely using their Aptos account. A standardized authentication protocol for Web3 applications.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign in with Aptos (SIWA)",
    description:
      "Authenticate users securely using their Aptos account. A standardized authentication protocol for Web3 applications.",
    creator: "@AptosLabs",
  },
  appleWebApp: { title: "SIWA" },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <Head />
      <AppProviders>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Layout
            navbar={
              <Navbar
                projectLink="https://github.com/aptos-labs/sign-in-with-aptos"
                logo={
                  <div className="gap-2 flex items-center">
                    <img
                      src="./navicon.svg"
                      alt="Aptos Logo"
                      style={{
                        borderRadius: "4px",
                        height: "24px",
                        width: "24px",
                      }}
                    />
                    <span className="text-xl leading-tighter font-landing">
                      SIWA
                    </span>
                  </div>
                }
              />
            }
            pageMap={await getPageMap()}
            docsRepositoryBase="https://github.com/aptos-labs/sign-in-with-aptos"
            footer={
              <Footer>
                © {new Date().getFullYear()} Aptos Labs. All rights reserved.
              </Footer>
            }
          >
            {children}
          </Layout>
        </body>
      </AppProviders>
    </html>
  );
}
