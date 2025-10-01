export interface UserProps {
  id: string
  email: string
  createdAt: Date
  metadata?: Record<string, any>
}

export class User {
  private readonly id: string
  private readonly email: string
  private readonly createdAt: Date
  private readonly metadata?: Record<string, any>

  constructor(props: UserProps) {
    this.validateProps(props)

    this.id = props.id
    this.email = props.email
    this.createdAt = props.createdAt
    this.metadata = props.metadata
  }

  private validateProps(props: UserProps): void {
    if (!props.id) {
      throw new Error('User ID is required')
    }
    if (!props.email) {
      throw new Error('Email is required')
    }
    if (!this.isValidEmail(props.email)) {
      throw new Error('Invalid email format')
    }
    if (!props.createdAt) {
      throw new Error('Created date is required')
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  getId(): string {
    return this.id
  }

  getEmail(): string {
    return this.email
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getMetadata(): Record<string, any> | undefined {
    return this.metadata
  }

  hasMetadata(): boolean {
    return !!this.metadata && Object.keys(this.metadata).length > 0
  }

  toJSON(): UserProps {
    return {
      id: this.id,
      email: this.email,
      createdAt: this.createdAt,
      metadata: this.metadata,
    }
  }

  equals(other: User): boolean {
    return this.id === other.id
  }

  static fromSupabaseUser(supabaseUser: any): User {
    return new User({
      id: supabaseUser.id,
      email: supabaseUser.email,
      createdAt: new Date(supabaseUser.created_at || supabaseUser.createdAt),
      metadata: supabaseUser.user_metadata || supabaseUser.metadata,
    })
  }
}