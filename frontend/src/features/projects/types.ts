export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE'

export interface Project {
  id: string
  name: string
  description?: string | null
  status: ProjectStatus
  startDate?: string | null
  endDate?: string | null
  dealId?: string | null
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  title: string
  dueDate?: string | null
  status: MilestoneStatus
}

export interface ProjectRelDeal {
  id: string
  title: string
}

export interface ProjectDetail extends Project {
  milestones: Milestone[]
  deal?: ProjectRelDeal | null
}

/** Campos del formulario de proyecto. */
export interface ProjectForm {
  name: string
  description: string
  status: ProjectStatus
  startDate: string
  endDate: string
}

/** Campos del formulario de hito. */
export interface MilestoneForm {
  title: string
  dueDate: string
  status: MilestoneStatus
}
