import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  PreconditionFailedException,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { makeEtag, etagMatches } from '../common/etag.util';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { FeaturesService } from './features.service';

@ApiTags('features')
@Controller('features')
export class FeaturesController {
  constructor(private featuresService: FeaturesService) {}

  @Post()
  async create(@Body() dto: CreateFeatureDto, @Req() req: Request) {
    return this.featuresService.createFeature(dto, (req as any).apiKeyId ?? null);
  }

  @Get()
  async list() {
    return this.featuresService.listFeatures();
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: Request) {
    const feature = await this.featuresService.getFeature(id);
    const etag = makeEtag(`${feature.id}:${feature.updatedAt.toISOString()}`);
    (req.res as any)?.setHeader('ETag', etag);
    return feature;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFeatureDto,
    @Req() req: Request,
    @Headers('if-match') ifMatch?: string,
  ) {
    const feature = await this.featuresService.getFeature(id);
    const etag = makeEtag(`${feature.id}:${feature.updatedAt.toISOString()}`);
    if (!etagMatches(etag, ifMatch)) {
      throw new PreconditionFailedException('ETag does not match');
    }

    const updated = await this.featuresService.updateFeature(
      id,
      dto,
      (req as any).apiKeyId ?? null,
    );

    (req.res as any)?.setHeader(
      'ETag',
      makeEtag(`${updated.id}:${updated.updatedAt.toISOString()}`),
    );

    return updated;
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string, @Req() req: Request) {
    return this.featuresService.archiveFeature(id, (req as any).apiKeyId ?? null);
  }

  @Post(':id/rules')
  async createRule(
    @Param('id') featureId: string,
    @Body() dto: CreateRuleDto,
    @Req() req: Request,
  ) {
    return this.featuresService.createRule(featureId, dto, (req as any).apiKeyId ?? null);
  }

  @Get(':id/rules')
  async listRules(@Param('id') featureId: string) {
    return this.featuresService.listRules(featureId);
  }

  @Get(':id/rules/:ruleId')
  async getRule(
    @Param('id') featureId: string,
    @Param('ruleId') ruleId: string,
    @Req() req: Request,
  ) {
    const rule = await this.featuresService.getRule(featureId, ruleId);
    const etag = makeEtag(`${rule.id}:${rule.updatedAt.toISOString()}`);
    (req.res as any)?.setHeader('ETag', etag);
    return rule;
  }

  @Patch(':id/rules/:ruleId')
  async updateRule(
    @Param('id') featureId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateRuleDto,
    @Req() req: Request,
    @Headers('if-match') ifMatch?: string,
  ) {
    const rule = await this.featuresService.getRule(featureId, ruleId);
    const etag = makeEtag(`${rule.id}:${rule.updatedAt.toISOString()}`);
    if (!etagMatches(etag, ifMatch)) {
      throw new PreconditionFailedException('ETag does not match');
    }

    const updated = await this.featuresService.updateRule(
      featureId,
      ruleId,
      dto,
      (req as any).apiKeyId ?? null,
    );

    (req.res as any)?.setHeader(
      'ETag',
      makeEtag(`${updated.id}:${updated.updatedAt.toISOString()}`),
    );

    return updated;
  }

  @Post(':id/rules/:ruleId/disable')
  async disableRule(
    @Param('id') featureId: string,
    @Param('ruleId') ruleId: string,
    @Req() req: Request,
  ) {
    return this.featuresService.disableRule(featureId, ruleId, (req as any).apiKeyId ?? null);
  }

  @Delete(':id/rules/:ruleId')
  async deleteRule(
    @Param('id') featureId: string,
    @Param('ruleId') ruleId: string,
    @Req() req: Request,
  ) {
    const rule = await this.featuresService.deleteRule(
      featureId,
      ruleId,
      (req as any).apiKeyId ?? null,
    );

    if (!rule) throw new NotFoundException('Rule not found');
    return { id: ruleId };
  }
}
