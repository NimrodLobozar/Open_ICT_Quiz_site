import { defineConfig } from 'vitest/config'

// npm test: de snelle tests zonder database (regels, ranking, scoring, Game).
// De API-tests met database staan in backend/tests/api/ en draai je met npm run test:api (zie vitest.api.config.js).
export default defineConfig({
  test: {
    include: ['backend/tests/**/*.test.js'],
    exclude: ['backend/tests/api/**', 'node_modules/**'],
  },
})
