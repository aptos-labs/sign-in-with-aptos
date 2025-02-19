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
  title: "Home | Sign in with Aptos",
  description: "Authenticate using your Aptos account",
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
                      src="/icon.svg"
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
