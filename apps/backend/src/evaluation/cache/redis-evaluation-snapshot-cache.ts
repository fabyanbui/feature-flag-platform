import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';
import type { EvaluationSnapshot } from '../engine/evaluation.types';
import {
  buildEvaluationSnapshotCacheKey,
  DEFAULT_ENVIRONMENT_CACHE_SCOPE,
  type EvaluationSnapshotCache,
  type EvaluationSnapshotCacheAddress,
  type EvaluationSnapshotInvalidationTarget,
} from './evaluation-snapshot-cache';
import { DEFAULT_EVALUATION_CACHE_TTL_MS } from './in-memory-evaluation-snapshot-cache';

const DEFAULT_REDIS_URL = 'redis://localhost:6379';
const REDIS_CONNECT_TIMEOUT_MS = 500;
const REDIS_SCAN_COUNT = 100;

@Injectable()
export class RedisEvaluationSnapshotCache
  implements EvaluationSnapshotCache, OnModuleDestroy
{
  private readonly logger = new Logger(RedisEvaluationSnapshotCache.name);
  private readonly redisUrl: string;
  private readonly ttlMs: number;
  private client: RedisClientType | null = null;
  private connectionPromise: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) {
    this.redisUrl = this.resolveRedisUrl();
    this.ttlMs = this.resolveTtlMs();
  }

  async onModuleDestroy(): Promise<void> {
    const client = this.client;

    if (!client?.isOpen) {
      return;
    }

    await client.quit();
  }

  async get(
    address: EvaluationSnapshotCacheAddress,
  ): Promise<EvaluationSnapshot | null> {
    const client = await this.getConnectedClient();
    const key = buildEvaluationSnapshotCacheKey(address);
    const serializedSnapshot = await client.get(key);

    if (!serializedSnapshot) {
      return null;
    }

    try {
      return JSON.parse(serializedSnapshot) as EvaluationSnapshot;
    } catch {
      await client.del(key);
      return null;
    }
  }

  async set(
    address: EvaluationSnapshotCacheAddress,
    snapshot: EvaluationSnapshot,
  ): Promise<void> {
    const client = await this.getConnectedClient();
    const key = buildEvaluationSnapshotCacheKey(address);

    await client.set(key, JSON.stringify(snapshot), {
      PX: this.ttlMs,
    });
  }

  async invalidateFlag(address: EvaluationSnapshotCacheAddress): Promise<void> {
    const client = await this.getConnectedClient();

    if (address.environmentKey) {
      await client.del([
        buildEvaluationSnapshotCacheKey(address),
        buildEvaluationSnapshotCacheKey({
          ...address,
          environmentKey: DEFAULT_ENVIRONMENT_CACHE_SCOPE,
        }),
      ]);
      return;
    }

    await this.deleteByPattern(
      client,
      this.buildPattern(address.projectKey, '*', address.flagKey),
    );
  }

  async invalidateFlags(
    target: EvaluationSnapshotInvalidationTarget,
  ): Promise<void> {
    const uniqueFlagKeys = [...new Set(target.flagKeys)];

    for (const flagKey of uniqueFlagKeys) {
      await this.invalidateFlag({
        projectKey: target.projectKey,
        environmentKey: target.environmentKey,
        flagKey,
      });
    }
  }

  async clear(): Promise<void> {
    const client = await this.getConnectedClient();

    await this.deleteByPattern(client, this.buildPattern('*', '*', '*'));
  }

  private async getConnectedClient(): Promise<RedisClientType> {
    const client = this.getOrCreateClient();

    if (client.isOpen) {
      return client;
    }

    if (!this.connectionPromise) {
      this.connectionPromise = client
        .connect()
        .then(() => undefined)
        .finally(() => {
          this.connectionPromise = null;
        });
    }

    await this.connectionPromise;

    return client;
  }

  private getOrCreateClient(): RedisClientType {
    if (this.client) {
      return this.client;
    }

    const client = createClient({
      url: this.redisUrl,
      disableOfflineQueue: true,
      socket: {
        connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
        reconnectStrategy: false,
      },
    });

    client.on('error', (error: Error) => {
      this.logger.warn(
        'Redis evaluation cache client error; evaluation will use repository fallback when cache operations fail.',
        error.stack,
      );
    });

    this.client = client;

    return client;
  }

  private async deleteByPattern(
    client: RedisClientType,
    pattern: string,
  ): Promise<void> {
    for await (const keys of client.scanIterator({
      MATCH: pattern,
      COUNT: REDIS_SCAN_COUNT,
    })) {
      if (keys.length > 0) {
        await client.del(keys);
      }
    }
  }

  private buildPattern(
    projectKey: string,
    environmentKey: string,
    flagKey: string,
  ): string {
    return ['evaluation-snapshot', projectKey, environmentKey, flagKey].join(
      ':',
    );
  }

  private resolveRedisUrl(): string {
    const configuredValue = this.configService.get<string>('REDIS_URL')?.trim();

    return configuredValue || DEFAULT_REDIS_URL;
  }

  private resolveTtlMs(): number {
    const configuredValue = this.configService.get<string | number>(
      'EVALUATION_CACHE_TTL_MS',
    );
    const parsedValue = Number(configuredValue);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return DEFAULT_EVALUATION_CACHE_TTL_MS;
    }

    return parsedValue;
  }
}
