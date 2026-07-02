import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/useAuth';
import { ConfirmDialog } from '../components/ConfirmDialog';
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

type EditProjectForm = {
    name: string;
    description: string;
};

const initialCreateForm: CreateProjectForm = {
    key: '',
    name: '',
    description: '',
};

const initialEditForm: EditProjectForm = {
    name: '',
    description: '',
};

export function ProjectListPage({ onOpenProject }: ProjectListPageProps) {
    const { can } = useAuth();
    const canManageProjects = can('PROJECT_MANAGE');
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [updatingProjectKey, setUpdatingProjectKey] = useState<string | null>(
        null,
    );
    const [deletingProjectKey, setDeletingProjectKey] = useState<string | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);
    const [createForm, setCreateForm] =
        useState<CreateProjectForm>(initialCreateForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<EditProjectForm>(initialEditForm);
    const [editError, setEditError] = useState<string | null>(null);
    const [pendingEdit, setPendingEdit] = useState<Project | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

    const loadProjects = useCallback(async () => {
        try {
            const response = await adminApi.listProjects({
                sort: 'updatedAt',
                order: 'desc',
                limit: 50,
            });

            setProjects(response.items);
            setError(null);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to load projects.',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadProjects();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadProjects]);

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

    function openEditProject(project: Project) {
        setPendingEdit(project);
        setEditForm({
            name: project.name,
            description: project.description ?? '',
        });
        setEditError(null);
    }

    function cancelEditProject() {
        if (updatingProjectKey) {
            return;
        }

        setPendingEdit(null);
        setEditForm(initialEditForm);
        setEditError(null);
    }

    async function handleUpdateProject(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!pendingEdit) {
            return;
        }

        if (!canManageProjects) {
            setEditError('Only administrators can update projects.');
            return;
        }

        const nameError = validateRequired(editForm.name, 'Project name');

        if (nameError) {
            setEditError(nameError);
            return;
        }

        setUpdatingProjectKey(pendingEdit.key);
        setEditError(null);
        setError(null);

        try {
            await adminApi.updateProject(pendingEdit.key, {
                name: editForm.name.trim(),
                description: editForm.description.trim() || null,
            });
            setPendingEdit(null);
            setEditForm(initialEditForm);
            await loadProjects();
        } catch (requestError) {
            setEditError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to update project.',
            );
        } finally {
            setUpdatingProjectKey(null);
        }
    }

    async function confirmDeleteProject() {
        if (!pendingDelete) {
            return;
        }

        setDeletingProjectKey(pendingDelete.key);
        setError(null);

        try {
            await adminApi.deleteProject(pendingDelete.key);
            setPendingDelete(null);
            await loadProjects();
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to delete project.',
            );
            setPendingDelete(null);
        } finally {
            setDeletingProjectKey(null);
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
                        create, update, or delete empty projects.
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
                        <p>Newest updated projects appear first.</p>
                    </div>
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
                                        disabled={
                                            deletingProjectKey === project.key ||
                                            updatingProjectKey === project.key
                                        }
                                    >
                                        Open flags
                                    </button>

                                    <button
                                        type="button"
                                        className="button button-secondary"
                                        onClick={() => openEditProject(project)}
                                        disabled={
                                            !canManageProjects ||
                                            deletingProjectKey === project.key ||
                                            updatingProjectKey === project.key
                                        }
                                        title={
                                            !canManageProjects
                                                ? 'Only administrators can update projects.'
                                                : 'Update project name and description.'
                                        }
                                    >
                                        Edit project
                                    </button>

                                    <button
                                        type="button"
                                        className="button button-danger"
                                        onClick={() => setPendingDelete(project)}
                                        disabled={
                                            !canManageProjects ||
                                            deletingProjectKey === project.key ||
                                            updatingProjectKey === project.key
                                        }
                                        title={
                                            !canManageProjects
                                                ? 'Only administrators can delete projects.'
                                                : 'Only projects with no visible flags, groups, or sample users can be deleted.'
                                        }
                                    >
                                        Delete project
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : null}
            </section>

            {pendingEdit ? (
                <div className="dialog-backdrop" role="presentation">
                    <section
                        className="dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-project-title"
                        aria-describedby="edit-project-description"
                        onKeyDown={(event) => {
                            if (event.key === 'Escape' && !updatingProjectKey) {
                                cancelEditProject();
                            }
                        }}
                    >
                        <div>
                            <p className="eyebrow">Project settings</p>
                            <h2 id="edit-project-title">Edit project</h2>
                            <p id="edit-project-description">
                                Update the display name and description for{' '}
                                <code>{pendingEdit.key}</code>. The project key stays
                                immutable so API clients keep working.
                            </p>
                        </div>

                        <form className="form-grid dialog-form" onSubmit={handleUpdateProject}>
                            <label className="form-grid-full">
                                Project name
                                <input
                                    value={editForm.name}
                                    onChange={(event) =>
                                        setEditForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    disabled={updatingProjectKey !== null}
                                    autoFocus
                                />
                            </label>

                            <label className="form-grid-full">
                                Description
                                <textarea
                                    value={editForm.description}
                                    onChange={(event) =>
                                        setEditForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                    disabled={updatingProjectKey !== null}
                                    rows={4}
                                />
                            </label>

                            {editError ? (
                                <p className="form-error form-grid-full" role="alert">
                                    {editError}
                                </p>
                            ) : null}

                            <div className="dialog-actions form-grid-full">
                                <button
                                    type="button"
                                    className="button button-secondary"
                                    onClick={cancelEditProject}
                                    disabled={updatingProjectKey !== null}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="button button-primary"
                                    disabled={updatingProjectKey !== null}
                                >
                                    {updatingProjectKey ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            ) : null}

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Delete project?"
                description={
                    pendingDelete
                        ? `Delete "${pendingDelete.key}" as a soft delete. This only succeeds when the project is empty: no visible feature flags, flag groups, or sample users. Audit history remains append-only.`
                        : ''
                }
                confirmLabel="Delete project"
                destructive
                busy={deletingProjectKey !== null}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDeleteProject}
            />
        </section>
    );
}
