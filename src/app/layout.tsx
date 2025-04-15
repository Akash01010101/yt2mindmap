import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import Providers from "@/components/providers";
import { GoogleAnalytics } from "@next/third-parties/google";
import JsonLd from "@/components/json-ld";
const inter = Inter({ subsets: ["latin"] })
import { Metadata } from "next";

export const metadata: Metadata = { 
  metadataBase: new URL("https://yt2mindmap.com"),
  title: "YouTube to Mind Map | Transform Videos into Interactive Mind Maps",
  description: "Transform YouTube videos into interactive mind maps. Our AI-powered platform helps you learn smarter by converting video content into visual knowledge maps.",
  openGraph: {
    siteName: "YouTube to Mind Map",
    type: "website",
    locale: "en_US",
    title: "YouTube to Mind Map - Visual Learning Revolution",
    description: "Convert YouTube videos into interactive mind maps. Learn faster, understand better, and retain more with AI-powered visual learning.",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: "index, follow"
  },
  alternates: {
    types: {
      "application/rss+xml": "https://yt2mindmap.com/rss.xml"
    }
  },
  applicationName: "YouTube to Mind Map",
  appleWebApp: {
    title: "YouTube to Mind Map",
    statusBarStyle: "default",
    capable: true
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_ID",
    yandex: ["YOUR_YANDEX_VERIFICATION_ID"],
    other: {
      "msvalidate.01": ["YOUR_BING_VERIFICATION_ID"],
      "facebook-domain-verification": ["YOUR_FACEBOOK_DOMAIN_VERIFICATION_ID"]
    }
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        type: "image/x-icon"
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png"
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png"
      },
      {
        url: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png"
      },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      }
    ],
    shortcut: [
      {
        url: "/favicon.ico",
        type: "image/x-icon"
      }
    ],
    apple: [
      {
        url: "/apple-icon-57x57.png",
        sizes: "57x57",
        type: "image/png"
      },
      {
        url: "/apple-icon-60x60.png",
        sizes: "60x60",
        type: "image/png"
      },
      {
        url: "/apple-icon-72x72.png",
        sizes: "72x72",
        type: "image/png"
      },
      {
        url: "/apple-icon-76x76.png",
        sizes: "76x76",
        type: "image/png"
      },
      {
        url: "/apple-icon-114x114.png",
        sizes: "114x114",
        type: "image/png"
      },
      {
        url: "/apple-icon-120x120.png",
        sizes: "120x120",
        type: "image/png"
      },
      {
        url: "/apple-icon-144x144.png",
        sizes: "144x144",
        type: "image/png"
      },
      {
        url: "/apple-icon-152x152.png",
        sizes: "152x152",
        type: "image/png"
      },
      {
        url: "/apple-icon-180x180.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <JsonLd />
      </head>
      {process.env.NODE_ENV === "production" && (
        <>
          <GoogleAnalytics gaId="G-XXXXXXXXXX" />
          {/* other scripts */}
        </>
      )}
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

