import { useTranslations } from 'next-intl'
import { Link } from '../_lib/i18n/navigation'

/** 本地化首页。 */
export default function Home() {
  const t = useTranslations('Home')

  return (
    <div className="flex flex-1 items-center justify-center">
      <main className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
        <p className="text-sm text-[#6b6b6b]">{t('description')}</p>
        <Link href="/chat" className="rounded-full bg-blue-600 text-white px-8 py-3 hover:bg-blue-700 transition">
          {t('openChat')}
        </Link>
      </main>
    </div>
  );
}
