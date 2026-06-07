export interface PageMetadata {
    limit: number;
    offset: number;
    total: number;
    hasNext: boolean;
}

export interface PageResponse<T> {
    items: T[];
    page: PageMetadata;
}

export function createPageResponse<T>(
    items: T[],
    limit: number,
    offset: number,
    total: number,
): PageResponse<T> {
    return {
        items,
        page: {
            limit,
            offset,
            total,
            hasNext: offset + limit < total,
        },
    };
}