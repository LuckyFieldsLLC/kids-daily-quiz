import { getStore } from "@netlify/blobs";

// "quizzes" ストアに接続
const store = getStore("quizzes");

export async function saveQuiz(id: string, data: object) {
  await store.setJSON(id, data);
}

export async function getQuiz(id: string) {
  return await store.get(id, { type: "json" });
}
