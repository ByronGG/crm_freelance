import { api } from '../../lib/api'
import type {
  MilestoneForm,
  MilestoneStatus,
  Project,
  ProjectDetail,
  ProjectForm,
  ProjectStatus,
} from './types'

interface ListParams {
  status?: ProjectStatus
  search?: string
}

export async function listProjects(params: ListParams = {}): Promise<Project[]> {
  const query: Record<string, string> = {}
  if (params.status) query.status = params.status
  if (params.search) query.search = params.search
  const { data } = await api.get<Project[]>('/projects', {
    params: Object.keys(query).length ? query : undefined,
  })
  return data
}

export async function getProject(id: string): Promise<ProjectDetail> {
  const { data } = await api.get<ProjectDetail>(`/projects/${id}`)
  return data
}

function projectPayload(form: ProjectForm) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    status: form.status,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
  }
}

export async function createProject(form: ProjectForm): Promise<Project> {
  const { data } = await api.post<Project>('/projects', projectPayload(form))
  return data
}

export async function updateProject(
  id: string,
  form: ProjectForm,
): Promise<Project> {
  const { data } = await api.patch<Project>(`/projects/${id}`, projectPayload(form))
  return data
}

export async function changeStatus(
  id: string,
  status: ProjectStatus,
): Promise<Project> {
  const { data } = await api.patch<Project>(`/projects/${id}`, { status })
  return data
}

/** Convierte una oportunidad ganada en proyecto. */
export async function createFromDeal(dealId: string): Promise<Project> {
  const { data } = await api.post<Project>(`/projects/from-deal/${dealId}`)
  return data
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`)
}

// ───────────────────────────── hitos ─────────────────────────────

export async function addMilestone(
  projectId: string,
  form: MilestoneForm,
): Promise<void> {
  await api.post(`/projects/${projectId}/milestones`, {
    title: form.title.trim(),
    status: form.status,
    dueDate: form.dueDate || null,
  })
}

export async function updateMilestone(
  projectId: string,
  milestoneId: string,
  data: { title?: string; dueDate?: string | null; status?: MilestoneStatus },
): Promise<void> {
  await api.patch(`/projects/${projectId}/milestones/${milestoneId}`, data)
}

export async function removeMilestone(
  projectId: string,
  milestoneId: string,
): Promise<void> {
  await api.delete(`/projects/${projectId}/milestones/${milestoneId}`)
}
