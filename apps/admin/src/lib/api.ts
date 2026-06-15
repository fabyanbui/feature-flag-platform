import type {
    ApiError,
    AuditLog,
    EvaluationContext,
    EvaluationResult,
    FeatureFlag,
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

const ADMIN_ACTOR =
    import.meta.env.VITE_ADMIN_ACTOR ?? 'admin@example.local';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    query?: QueryParams;
    body?: unknown;
    actor?: boolean;
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
            ...(options.actor ? { 'X-Actor': ADMIN_ACTOR } : {}),
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
    search?: string;
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
    description?: string;
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

export const adminApi = {
    listProjects(query: ListProjectsQuery = {}) {
        return apiRequest<PageResponse<Project>>('/projects', { query });
    },

    createProject(body: CreateProjectInput) {
        return apiRequest<Project>('/projects', {
            method: 'POST',
            body,
            actor: true,
        });
    },

    updateProject(projectKey: string, body: UpdateProjectInput) {
        return apiRequest<Project>(projectPath(projectKey), {
            method: 'PATCH',
            body,
            actor: true,
        });
    },

    listFlags(projectKey: string, query: ListFlagsQuery = {}) {
        return apiRequest<PageResponse<FeatureFlag>>(
            `${projectPath(projectKey)}/flags`,
            { query },
        );
    },

    createFlag(projectKey: string, body: CreateFlagInput) {
        return apiRequest<FeatureFlag>(`${projectPath(projectKey)}/flags`, {
            method: 'POST',
            body,
            actor: true,
        });
    },

    updateFlag(projectKey: string, flagKey: string, body: UpdateFlagInput) {
        return apiRequest<FeatureFlag>(flagPath(projectKey, flagKey), {
            method: 'PATCH',
            body,
            actor: true,
        });
    },

    archiveFlag(projectKey: string, flagKey: string) {
        return apiRequest<FeatureFlag>(`${flagPath(projectKey, flagKey)}/archive`, {
            method: 'POST',
            actor: true,
        });
    },

    restoreFlag(projectKey: string, flagKey: string) {
        return apiRequest<FeatureFlag>(`${flagPath(projectKey, flagKey)}/restore`, {
            method: 'POST',
            actor: true,
        });
    },

    listRules(
        projectKey: string,
        flagKey: string,
        query: ListRulesQuery = {},
    ) {
        return apiRequest<PageResponse<FlagRule>>(
            `${flagPath(projectKey, flagKey)}/rules`,
            { query },
        );
    },

    replaceRules(projectKey: string, flagKey: string, rules: RuleInput[]) {
        return apiRequest<FlagRule[]>(`${flagPath(projectKey, flagKey)}/rules`, {
            method: 'PUT',
            body: { rules },
            actor: true,
        });
    },

    listAuditLogs(projectKey: string, query: ListAuditLogsQuery = {}) {
        return apiRequest<PageResponse<AuditLog>>(
            `${projectPath(projectKey)}/audit-logs`,
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
        });
    },
};