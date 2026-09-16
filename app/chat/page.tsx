'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
export default function ChatPage(){
 const [msgs,setMsgs]=useState<{role:string,content:string}[]>([{role:'assistant',content:'阿嬤妳好，我是 YOUSI，玉里的家人 AI，有什麼要幫忙的？'}])
 const [input,setInput]=useState('')
 const send=()=>{if(!input.trim())return; setMsgs(m=>[...m,{role:'user',content:input},{role:'assistant',content:`收到：「${input}」 玉里今天天氣不錯，家人都平安。 (此為本地回覆，接上 Supabase 後會變真實 AI)`}]); setInput('')}
 return (<main className="min-h-screen flex flex-col max-w-2xl mx-auto bg-white">
  <header className="p-4 border-b font-bold text-xl">💬 YOUSI 聊天 · 玉里</header>
  <div className="flex-1 overflow-auto p-4 space-y-3">
   {msgs.map((m,i)=><div key={i} className={`p-3 rounded-2xl max-w-[85%] ${m.role==='user'?'bg-zinc-900 text-white ml-auto':'bg-zinc-100'}`}>{m.content}</div>)}
  </div>
  <div className="p-4 border-t flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="跟 YOUSI 說話..." className="flex-1 p-3 border rounded-full"/><button onClick={send} className="px-6 py-3 bg-zinc-900 text-white rounded-full">送出</button></div>
 </main>)
}
