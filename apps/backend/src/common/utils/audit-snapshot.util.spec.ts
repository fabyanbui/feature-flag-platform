import { cleanAuditSnapshot } from './audit-snapshot.util';

describe('cleanAuditSnapshot', () => {
  it('returns null for null input', () => {
    expect(cleanAuditSnapshot(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(cleanAuditSnapshot(undefined)).toBeNull();
  });

  it('removes undefined object properties', () => {
    expect(
      cleanAuditSnapshot({
        id: 'project-1',
        key: undefined,
        name: 'Demo Project',
      }),
    ).toEqual({
      id: 'project-1',
      name: 'Demo Project',
    });
  });

  it('removes undefined array items', () => {
    expect(
      cleanAuditSnapshot({
        values: ['a', undefined, 'b'],
      }),
    ).toEqual({
      values: ['a', 'b'],
    });
  });

  it('converts dates to ISO strings', () => {
    expect(
      cleanAuditSnapshot({
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
      }),
    ).toEqual({
      createdAt: '2026-06-01T00:00:00.000Z',
    });
  });

  it('preserves JSON-safe primitives, arrays, objects, and null', () => {
    expect(
      cleanAuditSnapshot({
        stringValue: 'demo',
        numberValue: 123,
        booleanValue: true,
        nullValue: null,
        arrayValue: ['beta', 1, false, null],
        objectValue: {
          nested: 'value',
        },
      }),
    ).toEqual({
      stringValue: 'demo',
      numberValue: 123,
      booleanValue: true,
      nullValue: null,
      arrayValue: ['beta', 1, false, null],
      objectValue: {
        nested: 'value',
      },
    });
  });

  it('converts unsupported values to strings', () => {
    const symbol = Symbol('unsupported');

    expect(
      cleanAuditSnapshot({
        unsupported: symbol,
      }),
    ).toEqual({
      unsupported: 'Symbol(unsupported)',
    });
  });
});
