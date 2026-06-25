import { createContext } from 'react';
import type { DemoIdentity, Permission } from './model';

export type AuthContextValue = {
    identity: DemoIdentity;
    identities: DemoIdentity[];
    configured: boolean;
    can: (permission: Permission) => boolean;
    selectIdentity: (key: DemoIdentity['key']) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
