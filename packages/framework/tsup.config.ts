import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/servers/express.ts',
    'src/servers/next.ts',
    'src/internal/client.ts',
    'src/internal/messages.ts',
    'src/ai-sdk/index.ts',
    'src/langchain/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
});
