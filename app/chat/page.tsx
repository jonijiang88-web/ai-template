import ChatBox from './_components/ChatBox'

export default function ChatPage() {
  return (
    <div className="flex flex-col h-dvh">
      <header className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">ChatBox</h1>
      </header>
      <ChatBox />
    </div>
  )
}
