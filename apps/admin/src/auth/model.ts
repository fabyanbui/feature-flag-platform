export type DemoRole = 'ADMIN' | 'DEVELOPER' | 'VIEWER';

export type Permission =
    | 'CONTROL_PLANE_READ'
    | 'PROJECT_MANAGE'
    | 'FLAG_MANAGE'
    | 'FLAG_LIFECYCLE_MANAGE'
    | 'RULE_MANAGE'
    | 'GROUP_MANAGE'
    | 'GROUP_ASSIGN'
    | 'GROUP_KILL_SWITCH'
    | 'SAMPLE_USER_MANAGE';

export type DemoIdentity = {
    key: 'admin' | 'developer' | 'viewer';
    label: string;
    actor: string;
    role: DemoRole;
    token: string;
};

const ROLE_PERMISSIONS: Record<DemoRole, ReadonlySet<Permission>> = {
    ADMIN: new Set([
        'CONTROL_PLANE_READ',
        'PROJECT_MANAGE',
        'FLAG_MANAGE',
        'FLAG_LIFECYCLE_MANAGE',
        'RULE_MANAGE',
        'GROUP_MANAGE',
        'GROUP_ASSIGN',
        'GROUP_KILL_SWITCH',
        'SAMPLE_USER_MANAGE',
    ]),
    DEVELOPER: new Set([
        'CONTROL_PLANE_READ',
        'FLAG_MANAGE',
        'RULE_MANAGE',
        'GROUP_ASSIGN',
    ]),
    VIEWER: new Set(['CONTROL_PLANE_READ']),
};

export const DEMO_IDENTITIES: DemoIdentity[] = [
    {
        key: 'admin',
        label: 'Admin',
        actor: 'demo-admin',
        role: 'ADMIN',
        token: import.meta.env.VITE_DEMO_ADMIN_TOKEN ?? '',
    },
    {
        key: 'developer',
        label: 'Developer',
        actor: 'demo-developer',
        role: 'DEVELOPER',
        token: import.meta.env.VITE_DEMO_DEVELOPER_TOKEN ?? '',
    },
    {
        key: 'viewer',
        label: 'Viewer',
        actor: 'demo-viewer',
        role: 'VIEWER',
        token: import.meta.env.VITE_DEMO_VIEWER_TOKEN ?? '',
    },
];

export function roleCan(role: DemoRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].has(permission);
}
