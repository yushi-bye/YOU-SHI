'use client'
import { useState, useEffect } from 'react'
export default function CalendarPage(){
  const [events,setEvents]=useState<any[]>([])
  const [title,setTitle]=useState('')
  const [time,setTime]=useState('')
  useEffect(()=>{fetch('/api/calendar/list').then(r=>r.json()).then(d=>setEvents(d.events||[]))},[])
  return (<main className="p-6 max-w-md mx-auto bg-[#FFFBF5] min-h-screen">
    <h1 className="text-3xl font-bold mb-4">📅 家人行事曆</h1>
    <p className="text-zinc-500 mb-4 text-sm">玉里家人共用</p>
    <div className="bg-white p-4 rounded-2xl shadow border mb-6">
      <input placeholder="例如：帶阿嬤回診" value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-3 border rounded-xl mb-3"/>
      <input type="datetime-local" value={time} onChange={e=>setTime(e.target.value)} className="w-full p-3 border rounded-xl mb-3"/>
      <button onClick={()=>{if(!title||!time)return alert('請填時間');fetch('/api/calendar/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,start_time:time})}).then(()=>location.reload())}} className="w-full p-3 bg-zinc-900 text-white rounded-xl">新增行程</button>
    </div>
    <div className="space-y-3">{events.map((ev:any)=><div key={ev.id} className="p-4 bg-white rounded-xl border">{ev.title} - {new Date(ev.start_time).toLocaleString('zh-TW')}</div>)}</div>
  </main>)
}
