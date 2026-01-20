
import { Language, TranslationStrings } from './types';

export const translations: Record<Language, TranslationStrings> = {
  [Language.PL]: {
    header: "Twój Wirtualny Asystent",
    welcome: "Cześć! Nazywam się Sofia. Jak mogę Ci pomóc?",
    whatICanDo: "Co ja umiem?",
    capabilities: [
      "Wyszukiwanie odpowiedzi w polskim ustawodawstwie (księgowość/podatki/kadry)",
      "Odpowiedzi biznesowe związane z prowadzeniem działalności w Polsce",
      "Streszczanie dokumentów: 'o co chodzi' + 'co trzeba zrobić'"
    ],
    placeholder: "Wpisz pytanie lub przeciągnij plik tutaj...",
    send: "Wyślij",
    recording: "Nagrywanie...",
    stopRecording: "Zatrzymaj",
    summarizing: "Analizuję...",
    answer: "Odpowiedź",
    listen: "Odtwórz odpowiedź",
    uploadHint: "PDF, DOCX, JPG, PNG",
    legalNotice: "Wskazówka: Moje odpowiedzi opierają się na polskim prawie. Zawsze podaję podstawę prawną, jeśli jest dostępna.",
    consultation: "To jest informacja ogólna. W celu uzyskania wiążącej opinii zalecam konsultację ze specjalistą."
  },
  [Language.RU]: {
    header: "Ваш виртуальный помощник",
    welcome: "Здравствуйте! Меня зовут София. Чем могу помочь?",
    whatICanDo: "Что я умею?",
    capabilities: [
      "Поиск ответов в польском законодательстве (бухгалтерия/налоги/кадры)",
      "Бизнес-консультации по ведению деятельности в Польше",
      "Краткий обзор документов: «о чем речь» + «что нужно сделать»"
    ],
    placeholder: "Введите вопрос или перетащите файл сюда...",
    send: "Отправить",
    recording: "Запись...",
    stopRecording: "Остановить",
    summarizing: "Анализирую...",
    answer: "Ответ",
    listen: "Прослушать ответ",
    uploadHint: "PDF, DOCX, JPG, PNG",
    legalNotice: "Примечание: Мои ответы основаны на польском праве. Я всегда указываю правовую основу, если она доступна.",
    consultation: "Это общая информация. Для получения официального заключения рекомендую проконсультироваться со специалистом."
  }
};
