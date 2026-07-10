import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EvaluationSnapshot } from '../engine/evaluation.types';
import {
  buildEvaluationSnapshotCacheKey,
  DEFAULT_ENVIRONMENT_CACHE_SCOPE,
  type EvaluationSnapshotCache,
  type EvaluationSnapshotCacheAddress,
  type EvaluationSnapshotInvalidationTarget,
} from './evaluation-snapshot-cache';

export const DEFAULT_EVALUATION_CACHE_TTL_MS = 30_000;

interface EvaluationSnapshotCacheEntry {
  address: EvaluationSnapshotCacheAddress;
  snapshot: EvaluationSnapshot;
  expiresAt: number;
}

@Injectable()
export class InMemoryEvaluationSnapshotCache implements EvaluationSnapshotCache {
  private readonly entries = new Map<string, EvaluationSnapshotCacheEntry>();

  private readonly ttlMs: number;

  constructor(private readonly configService: ConfigService) {
    this.ttlMs = this.resolveTtlMs();
  }

  get(
    address: EvaluationSnapshotCacheAddress,
  ): Promise<EvaluationSnapshot | null> {
    const key = buildEvaluationSnapshotCacheKey(address);
    const entry = this.entries.get(key);

    if (!entry) {
      return Promise.resolve(null);
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return Promise.resolve(null);
    }

    return Promise.resolve(entry.snapshot);
  }

  set(
    address: EvaluationSnapshotCacheAddress,
    snapshot: EvaluationSnapshot,
  ): Promise<void> {
    const key = buildEvaluationSnapshotCacheKey(address);

    this.entries.set(key, {
      address: { ...address },
      snapshot,
      expiresAt: Date.now() + this.ttlMs,
    });

    return Promise.resolve();
  }

  invalidateFlag(address: EvaluationSnapshotCacheAddress): Promise<void> {
    for (const [key, entry] of this.entries) {
      if (this.matchesFlag(entry.address, address)) {
        this.entries.delete(key);
      }
    }

    return Promise.resolve();
  }

  invalidateFlags(target: EvaluationSnapshotInvalidationTarget): Promise<void> {
    const flagKeys = new Set(target.flagKeys);

    for (const [key, entry] of this.entries) {
      if (entry.address.projectKey !== target.projectKey) {
        continue;
      }

      if (!flagKeys.has(entry.address.flagKey)) {
        continue;
      }

      if (!this.matchesEnvironment(entry.address, target.environmentKey)) {
        continue;
      }

      this.entries.delete(key);
    }

    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.entries.clear();

    return Promise.resolve();
  }

  private matchesFlag(
    cached: EvaluationSnapshotCacheAddress,
    target: EvaluationSnapshotCacheAddress,
  ): boolean {
    return (
      cached.projectKey === target.projectKey &&
      cached.flagKey === target.flagKey &&
      this.matchesEnvironment(cached, target.environmentKey)
    );
  }

  private matchesEnvironment(
    cached: EvaluationSnapshotCacheAddress,
    environmentKey?: string,
  ): boolean {
    if (!environmentKey) {
      return true;
    }

    return (
      cached.environmentKey === environmentKey ||
      cached.environmentKey === undefined ||
      cached.environmentKey === DEFAULT_ENVIRONMENT_CACHE_SCOPE
    );
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
