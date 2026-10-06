// Alle env-variabelen op één plek. Importeer `config` in plaats van overal process.env te lezen.
import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'verander-mij', // TODO(team): pas nodig bij L1 (accounts)
}
