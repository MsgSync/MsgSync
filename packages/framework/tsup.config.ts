import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/servers/*.ts',
    'src/internal/*.ts',
    'src/ai-sdk/*.ts',
    'src/langchain/*.ts',
    'src/cards.ts',
    'src/validators.ts',
    'src/step-resolver.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
});
