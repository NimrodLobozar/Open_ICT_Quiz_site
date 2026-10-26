import { defineConfig } from 'vitest/config'

// npm run test:api: test alle API-routes tegen een échte PostgreSQL, maar een APARTE database (quiz_test).
// Zo worden je eigen accounts en quizzen in de database "quiz" nooit gewist.
// Docker moet draaien (de database is bereikbaar op localhost:5433). Een andere database? Zet TEST_DATABASE_URL.
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? 'postgresql://quiz:quiz@localhost:5433/quiz_test'

export default defineConfig({
  test: {
    include: ['backend/tests/api/**/*.test.js'],
    globalSetup: ['backend/tests/api/globalSetup.js'],
    env: { DATABASE_URL: testDatabaseUrl, NODE_ENV: 'test', BCRYPT_COST: '4', APP_URL: 'http://quiz.test' },
    // Alle testbestanden delen één database, dus niet tegelijk draaien.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
})
