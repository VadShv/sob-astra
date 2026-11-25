import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App } from "antd";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Собесо",
  description: "for us",
  icons: {
    icon: { url: "/favicon.ico", type: "image/x-icon", sizes: "256x256" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="font-[family-name:var(--font-sans)] antialiased">
        <AntdRegistry>
          <ThemeProvider>
            <App>
              <Providers>{children}</Providers>
            </App>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
