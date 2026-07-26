import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { designTokenCss } from '@ai-template/shared'
import "../globals.css";
import NavBar from "../_components/NavBar";
import { hasLocale, locales } from '../_lib/i18n/routing'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** 为当前 locale 生成页面元数据。 */
export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

/** 预生成全部受支持语言的静态路由参数。 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

/**
 * 按 locale 渲染的根布局组件。
 *
 * 移除了 NextAuth SessionProvider，改为纯 NavBar + children 结构。
 * 用户认证状态由 NavBar 内部通过 Supabase 客户端获取。
 */
export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params

  if (!hasLocale(locale)) {
    notFound()
  }

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
      <head>
        <style>{designTokenCss}</style>
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <NavBar />
          {children}
        </NextIntlClientProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
