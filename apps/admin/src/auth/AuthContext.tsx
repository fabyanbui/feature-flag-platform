import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import type { ReactNode } from 'react';
import { setActiveDemoToken } from '../lib/api';
import {
    DEMO_IDENTITIES,
    roleCan,
} from './model';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context';

const defaultIdentity = DEMO_IDENTITIES[0];

setActiveDemoToken(defaultIdentity.token);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [identity, setIdentity] = useState(defaultIdentity);

    useEffect(() => {
        setActiveDemoToken(identity.token);
    }, [identity]);

    const value = useMemo<AuthContextValue>(
        () => ({
            identity,
            identities: DEMO_IDENTITIES,
            configured: DEMO_IDENTITIES.every(
                (candidate) => candidate.token.trim().length > 0,
            ),
            can: (permission) => roleCan(identity.role, permission),
            selectIdentity: (key) => {
                const nextIdentity = DEMO_IDENTITIES.find(
                    (candidate) => candidate.key === key,
                );
                if (nextIdentity) {
                    setIdentity(nextIdentity);
                }
            },
        }),
        [identity],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
