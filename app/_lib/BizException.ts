/**
 * 统一业务异常类。
 *
 * 继承自 Error，携带稳定的业务编码（code）、面向客户端的消息（message）、
 * 以及 HTTP 状态码（status）。**仅允许 4xx 状态码**，传入非法 status 时
 * 在构造时抛出 RangeError。
 */
export class BizException extends Error {
  /** 稳定业务编码，如 'AUTH_FAILED'、'VALIDATION_ERROR' */
  public readonly code: string

  /** 面向客户端的错误消息 */
  public readonly message: string

  /** HTTP 状态码，范围 400–499 */
  public readonly status: number

  /**
   * @param code    - 稳定业务编码
   * @param message - 面向客户端的错误消息
   * @param status  - HTTP 状态码，仅允许 400–499
   * @throws RangeError 当 status 不在 400–499 范围时抛出
   */
  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'BizException'
    this.code = code
    this.message = message

    if (status < 400 || status > 499) {
      throw new RangeError(
        `BizException status 必须为 4xx，当前值: ${status}`,
      )
    }
    this.status = status
  }

  /**
   * 返回格式化的异常描述字符串，包含 name、code 和 message。
   */
  toString(): string {
    return `${this.name}[${this.code}]: ${this.message}`
  }
}
