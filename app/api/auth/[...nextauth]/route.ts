import { handlers } from '../../../_auth/auth'

// 此路由由 NextAuth 的 handlers 完整处理，内部已有自己的错误处理逻辑，
// 因此不套用本项目的 withApiErrorHandler 包装器。
export const { GET, POST } = handlers
