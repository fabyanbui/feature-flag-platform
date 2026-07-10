import type {
    ApiError,
    AuditLog,
    EvaluationContext,
    EvaluationResult,
    FeatureFlag,
    FlagStats,
    FlagStatsSummary,
    FlagGroup,
    FlagConfigStatus,
    FlagRule,
    PageResponse,
    Project,
    RuleInput,
    ServingMode,
} from './types';

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/v1'
).replace(/\/+$/, '');

let activeDemoToken = '';

export function setActiveDemoToken(token: string): void {
    activeDemoToken = token;
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    query?: QueryParams;
    body?: unknown;
    authenticated?: boolean;
};

export class AdminApiError extends Error {
    readonly code: string;
    readonly details?: ApiError['details'];
    readonly requestId?: string;
    readonly status: number;

    constructor(status: number, error: ApiError) {
        super(error.message);
        this.name = 'AdminApiError';
        this.status = status;
        this.code = error.code;
        this.details = error.details;
        this.requestId = error.requestId;
    }
}

function buildUrl(path: string, query?: QueryParams): string {
    const url = new URL(`${API_BASE_URL}${path}`);

    Object.entries(query ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    });

    return url.toString();
}

async function parseResponse(response: Response): Promise<unknown> {
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
        return response.json();
    }

    return response.text();
}

export async function apiRequest<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const response = await fetch(buildUrl(path, options.query), {
        method: options.method ?? 'GET',
        headers: {
            Accept: 'application/json',
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.authenticated !== false && activeDemoToken
                ? { Authorization: `Bearer ${activeDemoToken}` }
                : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        const fallbackError: ApiError = {
            code: 'REQUEST_FAILED',
            message:
                typeof data === 'object' && data !== null && 'message' in data
                    ? String(data.message)
                    : `Request failed with status ${response.status}.`,
        };

        throw new AdminApiError(response.status, {
            ...fallbackError,
            ...(typeof data === 'object' && data !== null ? data : {}),
        } as ApiError);
    }

    return data as T;
}

function projectPath(projectKey: string): string {
    return `/projects/${encodeURIComponent(projectKey)}`;
}

function flagPath(projectKey: string, flagKey: string): string {
    return `${projectPath(projectKey)}/flags/${encodeURIComponent(flagKey)}`;
}

export type ListProjectsQuery = {
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'asc' | 'desc';
};

export type CreateProjectInput = {
    key: string;
    name: string;
    description?: string;
};

export type UpdateProjectInput = {
    name?: string;
    description?: string | null;
};

export type ListFlagsQuery = {
    search?: string;
    status?: FlagConfigStatus;
    lifecycleStatus?: 'ACTIVE' | 'ARCHIVED';
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'asc' | 'desc';
};

export type CreateFlagInput = {
    key: string;
    name: string;
    description?: string;
};

export type UpdateFlagInput = {
    name?: string;
    description?: string;
    status?: FlagConfigStatus;
    servingMode?: ServingMode;
    killSwitch?: boolean;
};

export type ListRulesQuery = {
    type?: string;
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'asc' | 'desc';
};

export type ListAuditLogsQuery = {
    targetType?: string;
    targetKey?: string;
    actor?: string;
    action?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'asc' | 'desc';
};

export type ListFlagHistoryQuery = {
    limit?: number;
    offset?: number;
    sort?: 'createdAt';
    order?: 'asc' | 'desc';
};

export type ListFlagGroupsQuery = {
    search?: string;
    environmentKey?: string;
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'asc' | 'desc';
};

export type ListFlagStatsQuery = {
    environmentKey?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
    sort?: 'totalEvaluations' | 'enabledCount' | 'disabledCount' | 'flagKey';
    order?: 'asc' | 'desc';
};

export type CreateFlagGroupInput = {
    key: string;
    name: string;
};

export const adminApi = {
    listProjects(query: ListProjectsQuery = {}) {
        return apiRequest<PageResponse<Project>>('/projects', { query });
    },

    createProject(body: CreateProjectInput) {
        return apiRequest<Project>('/projects', {
            method: 'POST',
            body,
        });
    },

    updateProject(projectKey: string, body: UpdateProjectInput) {
        return apiRequest<Project>(projectPath(projectKey), {
            method: 'PATCH',
            body,
        });
    },

    deleteProject(projectKey: string) {
        return apiRequest<void>(projectPath(projectKey), {
            method: 'DELETE',
        });
    },

    listFlags(projectKey: string, query: ListFlagsQuery = {}) {
        return apiRequest<PageResponse<FeatureFlag>>(
            `${projectPath(projectKey)}/flags`,
            { query },
        );
    },

    listDeletedFlags(projectKey: string, query: ListFlagsQuery = {}) {
        return apiRequest<PageResponse<FeatureFlag>>(
            `${projectPath(projectKey)}/flags/deleted`,
            { query },
        );
    },

    getFlag(projectKey: string, flagKey: string) {
        return apiRequest<FeatureFlag>(flagPath(projectKey, flagKey));
    },

    createFlag(projectKey: string, body: CreateFlagInput) {
        return apiRequest<FeatureFlag>(`${projectPath(projectKey)}/flags`, {
            method: 'POST',
            body,
        });
    },

    updateFlag(projectKey: string, flagKey: string, body: UpdateFlagInput) {
        return apiRequest<FeatureFlag>(flagPath(projectKey, flagKey), {
            method: 'PATCH',
            body,
        });
    },

    archiveFlag(projectKey: string, flagKey: string) {
        return apiRequest<FeatureFlag>(
            `${flagPath(projectKey, flagKey)}/archive`,
            {
                method: 'POST',
            },
        );
    },

    restoreFlag(projectKey: string, flagKey: string) {
        return apiRequest<FeatureFlag>(
            `${flagPath(projectKey, flagKey)}/restore`,
            {
                method: 'POST',
            },
        );
    },

    restoreDeletedFlag(projectKey: string, flagKey: string) {
        return apiRequest<FeatureFlag>(
            `${flagPath(projectKey, flagKey)}/restore-deleted`,
            {
                method: 'POST',
            },
        );
    },

    deleteFlag(projectKey: string, flagKey: string) {
        return apiRequest<void>(flagPath(projectKey, flagKey), {
            method: 'DELETE',
        });
    },

    listFlagGroups(projectKey: string, query: ListFlagGroupsQuery = {}) {
        return apiRequest<PageResponse<FlagGroup>>(
            `${projectPath(projectKey)}/groups`,
            { query },
        );
    },

    createFlagGroup(projectKey: string, body: CreateFlagGroupInput) {
        return apiRequest<FlagGroup>(`${projectPath(projectKey)}/groups`, {
            method: 'POST',
            body,
        });
    },

    updateFlagGroup(projectKey: string, groupKey: string, name: string) {
        return apiRequest<FlagGroup>(
            `${projectPath(projectKey)}/groups/${encodeURIComponent(groupKey)}`,
            {
                method: 'PATCH',
                body: { name },
            },
        );
    },

    deleteFlagGroup(projectKey: string, groupKey: string) {
        return apiRequest<void>(
            `${projectPath(projectKey)}/groups/${encodeURIComponent(groupKey)}`,
            {
                method: 'DELETE',
            },
        );
    },

    updateFlagGroupConfig(
        projectKey: string,
        groupKey: string,
        body: { environmentKey: string; killSwitch: boolean },
    ) {
        return apiRequest<FlagGroup>(
            `${projectPath(projectKey)}/groups/${encodeURIComponent(groupKey)}/config`,
            {
                method: 'PUT',
                body,
            },
        );
    },

    assignFlagGroup(projectKey: string, flagKey: string, groupKey: string) {
        return apiRequest<FeatureFlag>(
            `${flagPath(projectKey, flagKey)}/group`,
            {
                method: 'PUT',
                body: { groupKey },
            },
        );
    },

    unassignFlagGroup(projectKey: string, flagKey: string) {
        return apiRequest<FeatureFlag>(
            `${flagPath(projectKey, flagKey)}/group`,
            {
                method: 'DELETE',
            },
        );
    },

    listRules(projectKey: string, flagKey: string, query: ListRulesQuery = {}) {
        return apiRequest<PageResponse<FlagRule>>(
            `${flagPath(projectKey, flagKey)}/rules`,
            { query },
        );
    },

    listFlagHistory(
        projectKey: string,
        flagKey: string,
        query: ListFlagHistoryQuery = {},
    ) {
        return apiRequest<PageResponse<AuditLog>>(
            `${flagPath(projectKey, flagKey)}/history`,
            { query },
        );
    },

    replaceRules(projectKey: string, flagKey: string, rules: RuleInput[]) {
        return apiRequest<FlagRule[]>(
            `${flagPath(projectKey, flagKey)}/rules`,
            {
                method: 'PUT',
                body: { rules },
            },
        );
    },

    listAuditLogs(projectKey: string, query: ListAuditLogsQuery = {}) {
        return apiRequest<PageResponse<AuditLog>>(
            `${projectPath(projectKey)}/audit-logs`,
            { query },
        );
    },

    listFlagStats(projectKey: string, query: ListFlagStatsQuery = {}) {
        return apiRequest<PageResponse<FlagStatsSummary>>(
            `${projectPath(projectKey)}/stats/flags`,
            { query },
        );
    },

    getFlagStats(
        projectKey: string,
        flagKey: string,
        query: {
            environmentKey?: string;
            from?: string;
            to?: string;
        } = {},
    ) {
        return apiRequest<FlagStats>(
            `${flagPath(projectKey, flagKey)}/stats`,
            { query },
        );
    },

    evaluateFlag(body: {
        projectKey: string;
        flagKey: string;
        environmentKey?: string;
        context: EvaluationContext;
    }) {
        return apiRequest<EvaluationResult>('/evaluate', {
            method: 'POST',
            body,
            authenticated: false,
        });
    },
};
