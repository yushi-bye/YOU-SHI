# YOUSI 尤氏 - 玉里家人 AI

> 給阿嬤的智慧家庭入口，一個 QR Code 就回家。

**版本 v1.6** - PWA + Supabase Realtime + AI Gateway

## 功能
- `/` 首頁 - 尤氏再見 閃應用
- `/family` 家人說明頁 (給玉里長輩看的大字版)
- `/qr` 阿嬤掃描大字版 QR
- `/chat` 真實聊天 (Supabase Realtime)

## 玉里在地
定位：玉里 (Yüli, Hualien) 0910-XXXXXX 家人聯絡網

## 部署
```bash
npm install
npm run dev
```

環境變數 `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY= 或 GEMINI_API_KEY=
```

## Vercel 部署
Import from GitHub: yushi-bye/YOU-SHI -> 自動部署
