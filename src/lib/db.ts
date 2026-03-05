import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set.");
}

// Railway Postgres uses SSL, disable cert verification for internal connections
const sql = postgres(DATABASE_URL, {
  ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export { sql };

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