import { useTranslations } from 'next-intl'
import { Link } from '../_lib/i18n/navigation'

/** 本地化首页。 */
export default function Home() {
  const t = useTranslations('Home')

  return (
    <div className="flex flex-1 justify-center px-6 py-16 sm:py-24">
      <main className="flex w-full max-w-xl flex-col items-start gap-5">
        <h1 className="text-3xl font-semibold text-foreground">{t('title')} (test)</h1>
        <p className="max-w-md text-base leading-6 text-muted">{t('description')}</p>
        <Link
          href="/chat"
          className="rounded-[6px] bg-accent px-4 py-2 text-sm font-medium text-white transition-colors duration-150 ease-in-out hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97]"
        >
          {t('openChat')}
        </Link>
      </main>
    </div>
  );
}
