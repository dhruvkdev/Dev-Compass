FROM oven/bun:1

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

RUN bun run build

EXPOSE 5173

CMD ["sh", "-c", "bunx drizzle-kit push && bun run scripts/ingest-codeforces.ts && bun run scripts/ingest-leetcode.ts && bun run scripts/normalize-leetcode-tags.ts && bun run preview --host 0.0.0.0 --port 5173"]