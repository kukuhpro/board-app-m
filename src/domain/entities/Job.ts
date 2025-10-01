import { JobType, JobTypeValue } from '../valueObjects/JobType'

export interface JobProps {
  id: string
  title: string
  company: string
  description: string
  location: string
  jobType: JobType
  userId: string
  createdAt: Date
  updatedAt: Date
}

export class Job {
  private readonly id: string
  private title: string
  private company: string
  private description: string
  private location: string
  private jobType: JobTypeValue
  private readonly userId: string
  private readonly createdAt: Date
  private updatedAt: Date

  constructor(props: JobProps) {
    this.validateProps(props)

    this.id = props.id
    this.title = props.title
    this.company = props.company
    this.description = props.description
    this.location = props.location
    this.jobType = new JobTypeValue(props.jobType)
    this.userId = props.userId
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  private validateProps(props: JobProps): void {
    if (!props.id) {
      throw new Error('Job ID is required')
    }
    if (!props.title || props.title.length === 0) {
      throw new Error('Job title is required')
    }
    if (props.title.length > 100) {
      throw new Error('Job title must be 100 characters or less')
    }
    if (!props.company || props.company.length === 0) {
      throw new Error('Company name is required')
    }
    if (props.company.length > 100) {
      throw new Error('Company name must be 100 characters or less')
    }
    if (!props.description || props.description.length === 0) {
      throw new Error('Job description is required')
    }
    if (props.description.length > 5000) {
      throw new Error('Job description must be 5000 characters or less')
    }
    if (!props.location || props.location.length === 0) {
      throw new Error('Location is required')
    }
    if (props.location.length > 100) {
      throw new Error('Location must be 100 characters or less')
    }
    if (!props.userId) {
      throw new Error('User ID is required')
    }
    if (!props.createdAt) {
      throw new Error('Created date is required')
    }
    if (!props.updatedAt) {
      throw new Error('Updated date is required')
    }
  }

  getId(): string {
    return this.id
  }

  getTitle(): string {
    return this.title
  }

  getCompany(): string {
    return this.company
  }

  getDescription(): string {
    return this.description
  }

  getLocation(): string {
    return this.location
  }

  getJobType(): JobType {
    return this.jobType.getValue()
  }

  getUserId(): string {
    return this.userId
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  updateTitle(title: string): void {
    if (!title || title.length === 0) {
      throw new Error('Job title is required')
    }
    if (title.length > 100) {
      throw new Error('Job title must be 100 characters or less')
    }
    this.title = title
    this.updateTimestamp()
  }

  updateCompany(company: string): void {
    if (!company || company.length === 0) {
      throw new Error('Company name is required')
    }
    if (company.length > 100) {
      throw new Error('Company name must be 100 characters or less')
    }
    this.company = company
    this.updateTimestamp()
  }

  updateDescription(description: string): void {
    if (!description || description.length === 0) {
      throw new Error('Job description is required')
    }
    if (description.length > 5000) {
      throw new Error('Job description must be 5000 characters or less')
    }
    this.description = description
    this.updateTimestamp()
  }

  updateLocation(location: string): void {
    if (!location || location.length === 0) {
      throw new Error('Location is required')
    }
    if (location.length > 100) {
      throw new Error('Location must be 100 characters or less')
    }
    this.location = location
    this.updateTimestamp()
  }

  updateJobType(jobType: JobType): void {
    this.jobType = new JobTypeValue(jobType)
    this.updateTimestamp()
  }

  private updateTimestamp(): void {
    this.updatedAt = new Date()
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId
  }

  toJSON(): JobProps {
    return {
      id: this.id,
      title: this.title,
      company: this.company,
      description: this.description,
      location: this.location,
      jobType: this.jobType.getValue(),
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  static create(props: Omit<JobProps, 'id' | 'createdAt' | 'updatedAt'>): Job {
    const now = new Date()
    return new Job({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
  }
}