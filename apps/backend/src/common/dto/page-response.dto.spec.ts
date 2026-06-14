import { createPageResponse } from './page-response.dto';

describe('createPageResponse', () => {
  it('returns items unchanged with pagination metadata', () => {
    const items = [
      {
        id: 'item-1',
        name: 'Item 1',
      },
    ];

    expect(createPageResponse(items, 20, 0, 1)).toEqual({
      items,
      page: {
        limit: 20,
        offset: 0,
        total: 1,
        hasNext: false,
      },
    });
  });

  it('sets hasNext=true when offset plus limit is less than total', () => {
    const result = createPageResponse([], 20, 0, 21);

    expect(result.page.hasNext).toBe(true);
  });

  it('sets hasNext=false when offset plus limit equals total', () => {
    const result = createPageResponse([], 20, 0, 20);

    expect(result.page.hasNext).toBe(false);
  });

  it('sets hasNext=false when offset plus limit is greater than total', () => {
    const result = createPageResponse([], 20, 20, 30);

    expect(result.page.hasNext).toBe(false);
  });

  it('works with empty item arrays', () => {
    expect(createPageResponse([], 20, 0, 0)).toEqual({
      items: [],
      page: {
        limit: 20,
        offset: 0,
        total: 0,
        hasNext: false,
      },
    });
  });
});
