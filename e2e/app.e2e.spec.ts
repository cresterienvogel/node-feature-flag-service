import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Feature Flag Service (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const apiKey = 'test-root-key';

  beforeAll(async () => {
    process.env.ROOT_API_KEY = apiKey;
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ||
      'postgresql://app:app@localhost:15432/feature_flags?schema=public';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:16379';

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.evaluation.deleteMany();
    await prisma.rule.deleteMany();
    await prisma.feature.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('evaluates and invalidates cache after rule update', async () => {
    const featureRes = await request(app.getHttpServer())
      .post('/v1/features')
      .set('X-API-Key', apiKey)
      .send({
        key: 'checkout_new_ui',
        environment: 'dev',
        description: 'Test feature',
      })
      .expect(201);

    const featureId = featureRes.body.id;

    const ruleRes = await request(app.getHttpServer())
      .post(`/v1/features/${featureId}/rules`)
      .set('X-API-Key', apiKey)
      .send({
        priority: 100,
        ruleType: 'percentage',
        rolloutPercent: 100,
        enabled: true,
      })
      .expect(201);

    const ruleId = ruleRes.body.id;

    const eval1 = await request(app.getHttpServer())
      .post('/v1/evaluate')
      .set('X-API-Key', apiKey)
      .send({
        featureKey: 'checkout_new_ui',
        environment: 'dev',
        subject: { key: 'user-1' },
      })
      .expect(201);

    expect(eval1.body.enabled).toBe(true);

    const ruleGet = await request(app.getHttpServer())
      .get(`/v1/features/${featureId}/rules/${ruleId}`)
      .set('X-API-Key', apiKey)
      .expect(200);

    const etag = ruleGet.headers['etag'];

    await request(app.getHttpServer())
      .patch(`/v1/features/${featureId}/rules/${ruleId}`)
      .set('X-API-Key', apiKey)
      .set('If-Match', etag)
      .send({ rolloutPercent: 0 })
      .expect(200);

    const eval2 = await request(app.getHttpServer())
      .post('/v1/evaluate')
      .set('X-API-Key', apiKey)
      .send({
        featureKey: 'checkout_new_ui',
        environment: 'dev',
        subject: { key: 'user-1' },
      })
      .expect(201);

    expect(eval2.body.enabled).toBe(false);
  });
});
