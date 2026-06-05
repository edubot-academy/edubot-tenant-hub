import { useState } from "react";

export interface GeneratedQuiz {
  id: string;
  title: string;
  course: string;
  questions: number;
  lastUsed: string;
  uses: number;
  content: string;
}

const STORAGE_KEY = "questlms_generated_quizzes";

function load(): GeneratedQuiz[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(list: GeneratedQuiz[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function useGeneratedQuizzes() {
  const [list, setList] = useState<GeneratedQuiz[]>(load);

  const add = (quiz: GeneratedQuiz) => {
    setList((prev) => {
      const next = [quiz, ...prev];
      save(next);
      return next;
    });
  };

  const remove = (id: string) => {
    setList((prev) => {
      const next = prev.filter((q) => q.id !== id);
      save(next);
      return next;
    });
  };

  return { list, add, remove };
}

export function getGeneratedQuizzes(): GeneratedQuiz[] {
  return load();
}
