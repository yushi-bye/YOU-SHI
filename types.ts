export enum AppMode {
  FLASH_APP = 'flash_app',
  CHAT = 'chat',
  EYE = 'eye'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  type?: 'text' | 'chart' | 'map' | 'code' | 'image';
  data?: any; // For structured data like charts
  image?: string; // Base64 image data
  timestamp: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ChartConfig {
  title: string;
  type: 'bar' | 'line' | 'pie';
  data: ChartDataPoint[];
  xAxisKey: string;
  dataKey: string;
}

export interface GeneratedApp {
  html: string;
  description: string;
  createdAt: number;
}