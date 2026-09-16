export default function FamilyPage(){
 return (<main className="min-h-screen bg-white p-6 max-w-2xl mx-auto">
  <h1 className="text-4xl font-bold">尤氏家族 · 玉里</h1>
  <p className="mt-4 text-xl leading-relaxed">這是給玉里家人的智慧入口。<br/>阿嬤只要掃描 QR Code，就能直接跟 YOUSI 對話，問天氣、記事情、找家人。</p>
  <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-200">
   <h2 className="text-2xl font-bold">怎麼用？</h2>
   <ol className="list-decimal ml-6 mt-3 text-lg space-y-2">
    <li>打開相機掃描 QR Code</li>
    <li>會自動打開 YOUSI 網頁</li>
    <li>按「開始聊天」就能用語音說話</li>
   </ol>
  </div>
  <div className="mt-6 text-zinc-500">📍 花蓮玉里 · 0910 家人聯絡網 · 已公開於 GitHub yushi-bye/YOU-SHI</div>
 </main>)
}
