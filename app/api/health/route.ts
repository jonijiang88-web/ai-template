import { withApiErrorHandler } from '../../_lib/api-error-handler'

/**
 * 获取服务健康状态，无需认证。
 */
async function getHandler() {
  return Response.json({ status: 'ok' })
}

/** GET /api/health — 健康检查接口，无需认证，返回服务状态。 */
export const GET = withApiErrorHandler(getHandler)
