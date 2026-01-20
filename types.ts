
export enum Language {
  PL = 'PL',
  RU = 'RU'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  file?: {
    name: string;
    type: string;
    data: string;
  };
  audioUrl?: string;
  // Added grounding sources for compliance with Google Search tool requirements
  groundingSources?: { title: string; uri: string }[];
}

export interface TranslationStrings {
  header: string;
  welcome: string;
  whatICanDo: string;
  capabilities: string[];
  placeholder: string;
  send: string;
  recording: string;
  stopRecording: string;
  summarizing: string;
  answer: string;
  listen: string;
  uploadHint: string;
  legalNotice: string;
  consultation: string;
}
