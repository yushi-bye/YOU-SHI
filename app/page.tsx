import Link from 'next/link'
export default function Home(){
 return (<main className="min-h-screen flex flex-col items-center justify-center p-8">
  <h1 className="text-5xl font-bold mb-2">尤氏再見</h1>
  <p className="text-xl text-zinc-600 mb-8">YOUSI AI · 玉里家人閃應用生成器</p>
  <div className="grid gap-4 w-full max-w-sm">
   <Link href="/family" className="p-6 bg-white rounded-2xl shadow border text-center hover:shadow-lg">👨‍👩‍👧‍👦 /family 家人說明頁</Link>
   <Link href="/qr" className="p-6 bg-zinc-900 text-white rounded-2xl shadow text-center hover:bg-black">📱 /qr 阿嬤大字 QR</Link>
   <Link href="/chat" className="p-6 bg-white rounded-2xl shadow border text-center hover:shadow-lg">💬 /chat 真實聊天</Link>
  </div>
  <p className="mt-8 text-sm text-zinc-500">Yüli, Hualien · v1.6 PWA</p>
 </main>)
}
