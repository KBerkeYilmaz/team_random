import "../globals.css";
import { NextIntlClientProvider, useMessages } from "next-intl";
import { ThemeProvider } from "@/providers/theme-provider";
import SessionProvider from "@/providers/SessionProvider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { EdgeStoreProvider } from "@/lib/edgestore";
import { inter } from "../fonts";

export const metadata = {
  title: "Team Random",
  description: "Coding your digital future",
};

export default function LocaleLayout({ children, params: { locale } }) {
  const messages = useMessages();
  return (
    <html suppressHydrationWarning lang={locale} className={inter.className}>
      <body>
        <EdgeStoreProvider>
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
        </EdgeStoreProvider>
        <Toaster />
      </body>
    </html>
  );
}
