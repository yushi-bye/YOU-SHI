'use client'
import { useEffect, useState } from 'react'
export default function QRPage(){
 const [url,setUrl]=useState('')
 useEffect(()=>{setUrl(window.location.origin)},[])
 return (<main className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
  <h1 className="text-6xl font-black mb-6">掃我</h1>
  <div className="w-[300px] h-[300px] bg-zinc-100 rounded-3xl flex items-center justify-center border-4 border-zinc-900">
   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url+'/family')}`} alt="QR" className="rounded-2xl"/>
  </div>
  <p className="mt-6 text-3xl font-bold">{url}/family</p>
  <p className="mt-2 text-xl text-zinc-600">阿嬤，掃這個就回家</p>
  <div className="mt-8 p-4 bg-zinc-900 text-white rounded-xl text-center text-lg">長按圖片可儲存列印，貼在冰箱上</div>
 </main>)
}
