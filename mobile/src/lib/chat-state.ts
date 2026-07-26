/**
 * 判断聊天输入是否可以提交。
 *
 * 历史加载完成前禁止发送，避免异步历史覆盖本地刚追加的对话状态。
 *
 * @param input - 当前输入内容
 * @param isHistoryLoading - 是否正在加载历史消息
 * @param isStreaming - 是否正在接收 AI 流式响应
 * @returns 当前是否允许发送消息
 */
export function canSendChatMessage(
  input: string,
  isHistoryLoading: boolean,
  isStreaming: boolean,
): boolean {
  return Boolean(input.trim()) && !isHistoryLoading && !isStreaming
}
