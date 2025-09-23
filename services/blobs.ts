import { createClient } from "@netlify/blobs";

// "quizzes" ストアに接続
const client = createClient({ store: "quizzes" });

export async function saveQuiz(id: string, data: object) {
  await client.setJSON(id, data);
}

export async function getQuiz(id: string) {
  return await client.getJSON(id);
}
