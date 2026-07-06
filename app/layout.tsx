import type { Metadata } from "next";
import Script from "next/script";
import {
  Fraunces,
  Inter,
  JetBrains_Mono,
  Cormorant_Garamond,
} from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/components/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anthroscope Plan Builder — Planes de nutrición profesionales",
  description:
    "Sistema enfocado para nutriólogos y coaches: del intake al plan final con equivalentes, plantillas y cálculos automáticos. Powered by Anthroscope.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable} ${cormorant.variable} h-full antialiased`}
    >
      <head>
        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1476180747591915');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img height="1" width="1" style={{display:'none'}}
            src="https://www.facebook.com/tr?id=1476180747591915&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">
        <LocaleProvider>
          <LanguageToggle className="fixed right-4 top-4 z-[60]" />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
