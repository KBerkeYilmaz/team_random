import { Inter } from "next/font/google";
import ".././globals.css";
import { NextIntlClientProvider, useMessages } from "next-intl";
import { ThemeProvider } from "@/providers/theme-provider";
import SessionProvider from "@/providers/SessionProvider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });
export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function LocaleLayout({ children, params: { locale } }) {
  const messages = useMessages();
  return (
    <html suppressHydrationWarning lang={locale}>
      <body>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NextIntlClientProvider messages={messages}>
              <div className="grid h-screen">
                <Navbar />
                <div className="flex h-full w-full">{children}</div>
              </div>
            </NextIntlClientProvider>
          </ThemeProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
