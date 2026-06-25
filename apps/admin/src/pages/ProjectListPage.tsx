import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/useAuth';
import { EmptyState, ErrorState, LoadingState } from '../components/DataState';
import { adminApi } from '../lib/api';
import type { Project } from '../lib/types';
import { validateKey, validateRequired } from '../lib/validation';

type ProjectListPageProps = {
    onOpenProject: (projectKey: string) => void;
};

type CreateProjectForm = {
    key: string;
    name: string;
    description: string;
};

const initialCreateForm: CreateProjectForm = {
    key: '',
    name: '',
    description: '',
};

export function ProjectListPage({ onOpenProject }: ProjectListPageProps) {
    const { can } = useAuth();
    const canManageProjects = can('PROJECT_MANAGE');
    const [projects, setProjects] = useState<Project[]>([]);
    const [search, setSearch] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createForm, setCreateForm] =
        useState<CreateProjectForm>(initialCreateForm);
    const [formError, setFormError] = useState<string | null>(null);

    const loadProjects = useCallback(async () => {
        try {
            const response = await adminApi.listProjects({
                search: submittedSearch,
                sort: 'updatedAt',
                order: 'desc',
                limit: 50,
            });

            setProjects(response.items);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to load projects.',
            );
        } finally {
            setLoading(false);
        }
    }, [submittedSearch]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadProjects();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadProjects]);

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSubmittedSearch(search.trim());
    }

    async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!canManageProjects) {
            setFormError('Only administrators can create projects.');
            return;
        }

        const keyError = validateKey(createForm.key);
        const nameError = validateRequired(createForm.name, 'Project name');

        if (keyError || nameError) {
            setFormError(keyError ?? nameError);
            return;
        }

        setCreating(true);
        setFormError(null);

        try {
            const project = await adminApi.createProject({
                key: createForm.key.trim(),
                name: createForm.name.trim(),
                description: createForm.description.trim() || undefined,
            });

            setCreateForm(initialCreateForm);
            await loadProjects();
            onOpenProject(project.key);
        } catch (requestError) {
            setFormError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to create project.',
            );
        } finally {
            setCreating(false);
        }
    }

    return (
        <section className="page-stack">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Control plane</p>
                    <h1>Projects</h1>
                    <p>
                        Select a project to manage feature flags, rollout rules, and audit
                        history.
                    </p>
                </div>
            </header>

            <section className="panel">
                <h2>Create project</h2>
                {!canManageProjects ? (
                    <p className="permission-notice" id="project-permission-help">
                        Read-only for this identity. Only administrators can
                        create projects.
                    </p>
                ) : null}

                <form className="form-grid" onSubmit={handleCreateProject}>
                    <label>
                        Project key
                        <input
                            value={createForm.key}
                            onChange={(event) =>
                                setCreateForm((current) => ({
                                    ...current,
                                    key: event.target.value,
                                }))
                            }
                            placeholder="demo-project"
                            disabled={creating || !canManageProjects}
                            aria-describedby={
                                !canManageProjects
                                    ? 'project-permission-help'
                                    : undefined
                            }
                        />
                    </label>

                    <label>
                        Project name
                        <input
                            value={createForm.name}
                            onChange={(event) =>
                                setCreateForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                            placeholder="Demo Project"
                            disabled={creating || !canManageProjects}
                        />
                    </label>

                    <label className="form-grid-full">
                        Description
                        <textarea
                            value={createForm.description}
                            onChange={(event) =>
                                setCreateForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                            placeholder="Project used for feature flag demos."
                            disabled={creating || !canManageProjects}
                            rows={3}
                        />
                    </label>

                    {formError ? (
                        <p className="form-error form-grid-full" role="alert">
                            {formError}
                        </p>
                    ) : null}

                    <div className="form-actions form-grid-full">
                        <button
                            type="submit"
                            className="button button-primary"
                            disabled={creating || !canManageProjects}
                        >
                            {creating ? 'Creating...' : 'Create project'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="panel">
                <div className="section-header">
                    <div>
                        <h2>Project list</h2>
                        <p>Search by project name or key.</p>
                    </div>

                    <form className="inline-form" onSubmit={handleSearchSubmit}>
                        <label className="sr-only" htmlFor="project-search">
                            Search projects
                        </label>
                        <input
                            id="project-search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search projects..."
                        />
                        <button type="submit" className="button button-secondary">
                            Search
                        </button>
                    </form>
                </div>

                {loading ? <LoadingState title="Loading projects..." /> : null}

                {!loading && error ? (
                    <ErrorState
                        title="Could not load projects"
                        description={error}
                        onAction={loadProjects}
                    />
                ) : null}

                {!loading && !error && projects.length === 0 ? (
                    <EmptyState
                        title="No projects found"
                        description="Create your first project to start managing feature flags."
                    />
                ) : null}

                {!loading && !error && projects.length > 0 ? (
                    <div className="card-grid">
                        {projects.map((project) => (
                            <article className="resource-card" key={project.id}>
                                <div>
                                    <h3>{project.name}</h3>
                                    <p className="muted">
                                        <code>{project.key}</code>
                                    </p>
                                    {project.description ? <p>{project.description}</p> : null}
                                </div>

                                <dl className="meta-list">
                                    <div>
                                        <dt>Updated</dt>
                                        <dd>{new Date(project.updatedAt).toLocaleString()}</dd>
                                    </div>
                                </dl>

                                <div className="card-actions">
                                    <button
                                        type="button"
                                        className="button button-primary"
                                        onClick={() => onOpenProject(project.key)}
                                    >
                                        Open flags
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : null}
            </section>
        </section>
    );
}
