import { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const handler: Handler = async () => {
  try {
    const store = getStore("quizzes");
    const { blobs } = await store.list();
    const quizzes = [];

    for (const blob of blobs) {
      const data = await store.get(blob.key, { type: "json" });
      if (data) quizzes.push({ id: blob.key, ...data });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(quizzes),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
};

export { handler };
