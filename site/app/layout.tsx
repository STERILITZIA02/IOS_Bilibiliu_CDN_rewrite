import type { Metadata, Viewport } from "next";
import "./globals.css";

const socialImage =
  "https://raw.githubusercontent.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/main/site/public/og.png";

export const metadata: Metadata = {
  title: {
    default: "BiliFlow · Shadowrocket 模块定制器",
    template: "%s · BiliFlow",
  },
  description:
    "按需选择 Bilibili CDN、Bilibili iOS 9.5.0 Story/搜索/后台广告过滤、首页六条普通视频流及首页/我的页模块，一键生成可持续更新的 Shadowrocket 模块。",
  applicationName: "BiliFlow",
  authors: [{ name: "STERILITZIA02" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "BiliFlow · Bilibili 模块定制器",
    description:
      "选择你想显示的功能，一键安装始终跟随 GitHub main 最新代码的 Shadowrocket 模块。",
    images: [{ url: socialImage, width: 1200, height: 630 }],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BiliFlow · Bilibili 模块定制器",
    description: "iPhone 与 iPad 优先的 Shadowrocket 模块定制器。",
    images: [socialImage],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#101820" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
