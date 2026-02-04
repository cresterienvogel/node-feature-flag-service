process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://app:app@localhost:15432/feature_flags?schema=public';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:16379';
process.env.ROOT_API_KEY = process.env.ROOT_API_KEY || 'test-root-key';
