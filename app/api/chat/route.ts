export async function POST(request: Request) {
  const { message } = await request.json()

  // 简单回复逻辑
  const reply = `你说了: "${message}"`

  return Response.json({ reply })
}
