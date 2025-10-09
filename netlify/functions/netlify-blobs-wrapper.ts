// netlify-blobs-wrapper.ts
// @netlify/blobs の getStore 互換ラッパー
import fs from "fs/promises";
import path from "path";

export function getStore({ name }: { name: string }) {
  // 本番等の読み取り専用ファイルシステムで失敗しないよう、/tmp 配下を優先
  const baseDir = (process.env.NETLIFY === 'true' && process.env.NETLIFY_DEV !== 'true')
    ? path.posix.join('/tmp', '.blobs', name)
    : path.resolve(".blobs", name);

  async function ensureDir() {
    await fs.mkdir(baseDir, { recursive: true });
  }

  return {
    async get(key: string) {
      try {
        const file = path.join(baseDir, key + ".json");
        const data = await fs.readFile(file, "utf8");
        return data;
      } catch (e) {
        return null;
      }
    },
    async set(key: string, value: any) {
      await ensureDir();
      const file = path.join(baseDir, key + ".json");
      await fs.writeFile(file, typeof value === "string" ? value : JSON.stringify(value), "utf8");
    },
    async delete(key: string) {
      const file = path.join(baseDir, key + ".json");
      await fs.rm(file, { force: true });
    },
    async list() {
      await ensureDir();
      const files = await fs.readdir(baseDir);
      return { keys: files.map(f => f.replace(/\.json$/, "")) };
    }
  };
}
