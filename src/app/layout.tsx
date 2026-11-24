import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import { Providers } from "./providers";
import { baseTheme } from "@/lib/theme";
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
          <ConfigProvider theme={baseTheme} locale={ruRU}>
            <App>
              <Providers>{children}</Providers>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
