import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id          SERIAL PRIMARY KEY,
      wallet      VARCHAR(44)  NOT NULL,
      tokens      BIGINT       NOT NULL,
      type        VARCHAR(10)  NOT NULL CHECK (type IN ('image', 'text')),
      content     TEXT         NOT NULL,
      name        VARCHAR(50),
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC)
  `;
}

export type Post = {
  id: number;
  wallet: string;
  tokens: number;
  type: "image" | "text";
  content: string;
  name: string | null;
  created_at: string;
};
