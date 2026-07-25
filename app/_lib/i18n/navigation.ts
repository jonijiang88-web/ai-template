import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/** 提供保留当前 locale 的导航组件与 Hooks。 */
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
