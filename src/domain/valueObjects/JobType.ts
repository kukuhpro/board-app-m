export enum JobType {
  FULL_TIME = 'Full-Time',
  PART_TIME = 'Part-Time',
  CONTRACT = 'Contract'
}

export const JobTypeLabels: Record<JobType, string> = {
  [JobType.FULL_TIME]: 'Full-Time',
  [JobType.PART_TIME]: 'Part-Time',
  [JobType.CONTRACT]: 'Contract',
}

export class JobTypeValue {
  private readonly value: JobType

  constructor(value: string) {
    if (!this.isValidJobType(value)) {
      throw new Error(`Invalid job type: ${value}`)
    }
    this.value = value as JobType
  }

  private isValidJobType(value: string): value is JobType {
    return Object.values(JobType).includes(value as JobType)
  }

  getValue(): JobType {
    return this.value
  }

  getLabel(): string {
    return JobTypeLabels[this.value]
  }

  equals(other: JobTypeValue): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  static fromString(value: string): JobTypeValue {
    return new JobTypeValue(value)
  }

  static getAllTypes(): JobType[] {
    return Object.values(JobType)
  }
}