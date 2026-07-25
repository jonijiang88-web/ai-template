import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <main className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold">Hello Next.js</h1>
        <Link href="/chat" className="rounded-full bg-blue-600 text-white px-8 py-3 hover:bg-blue-700 transition">
          打开 ChatBox
        </Link>
      </main>
    </div>
  );
}
