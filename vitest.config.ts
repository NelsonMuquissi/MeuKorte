import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolve os aliases do tsconfig (`@/*`) nativamente, sem plugin.
  resolve: { tsconfigPaths: true },
  test: {
    // Os testes são de lógica pura; o `localStorage` é substituído por um duplo
    // dentro do próprio ficheiro de teste, por isso não é preciso jsdom.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
