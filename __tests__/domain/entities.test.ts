import { Job, JobProps } from '@/domain/entities/Job'
import { User, UserProps } from '@/domain/entities/User'
import { JobType, JobTypeValue } from '@/domain/valueObjects/JobType'

describe('Domain Entities', () => {
  describe('JobType Value Object', () => {
    it('should create valid JobType instance', () => {
      const jobType = new JobTypeValue(JobType.FULL_TIME)
      expect(jobType.getValue()).toBe(JobType.FULL_TIME)
      expect(jobType.getLabel()).toBe('Full-Time')
      expect(jobType.toString()).toBe('Full-Time')
    })

    it('should validate JobType enum values', () => {
      expect(() => new JobTypeValue(JobType.FULL_TIME)).not.toThrow()
      expect(() => new JobTypeValue(JobType.PART_TIME)).not.toThrow()
      expect(() => new JobTypeValue(JobType.CONTRACT)).not.toThrow()
    })

    it('should throw error for invalid job type', () => {
      expect(() => new JobTypeValue('Invalid')).toThrow('Invalid job type: Invalid')
    })

    it('should compare JobType values correctly', () => {
      const jobType1 = new JobTypeValue(JobType.FULL_TIME)
      const jobType2 = new JobTypeValue(JobType.FULL_TIME)
      const jobType3 = new JobTypeValue(JobType.PART_TIME)

      expect(jobType1.equals(jobType2)).toBe(true)
      expect(jobType1.equals(jobType3)).toBe(false)
    })

    it('should create JobType from string', () => {
      const jobType = JobTypeValue.fromString('Full-Time')
      expect(jobType.getValue()).toBe(JobType.FULL_TIME)
    })

    it('should get all job types', () => {
      const allTypes = JobTypeValue.getAllTypes()
      expect(allTypes).toEqual([
        JobType.FULL_TIME,
        JobType.PART_TIME,
        JobType.CONTRACT
      ])
    })
  })

  describe('Job Entity', () => {
    const validJobProps: JobProps = {
      id: 'job-123',
      title: 'Software Engineer',
      company: 'Tech Corp',
      description: 'We are looking for a skilled software engineer',
      location: 'San Francisco',
      jobType: JobType.FULL_TIME,
      userId: 'user-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    it('should create Job entity with valid data', () => {
      const job = new Job(validJobProps)

      expect(job.getId()).toBe('job-123')
      expect(job.getTitle()).toBe('Software Engineer')
      expect(job.getCompany()).toBe('Tech Corp')
      expect(job.getDescription()).toBe('We are looking for a skilled software engineer')
      expect(job.getLocation()).toBe('San Francisco')
      expect(job.getJobType()).toBe(JobType.FULL_TIME)
      expect(job.getUserId()).toBe('user-123')
      expect(job.getCreatedAt()).toEqual(new Date('2024-01-01'))
      expect(job.getUpdatedAt()).toEqual(new Date('2024-01-01'))
    })

    it('should validate required fields', () => {
      expect(() => new Job({ ...validJobProps, id: '' })).toThrow('Job ID is required')
      expect(() => new Job({ ...validJobProps, title: '' })).toThrow('Job title is required')
      expect(() => new Job({ ...validJobProps, company: '' })).toThrow('Company name is required')
      expect(() => new Job({ ...validJobProps, description: '' })).toThrow('Job description is required')
      expect(() => new Job({ ...validJobProps, location: '' })).toThrow('Location is required')
      expect(() => new Job({ ...validJobProps, userId: '' })).toThrow('User ID is required')
    })

    it('should validate field length constraints', () => {
      const longString = 'a'.repeat(101)
      const veryLongString = 'a'.repeat(5001)

      expect(() => new Job({ ...validJobProps, title: longString }))
        .toThrow('Job title must be 100 characters or less')
      expect(() => new Job({ ...validJobProps, company: longString }))
        .toThrow('Company name must be 100 characters or less')
      expect(() => new Job({ ...validJobProps, description: veryLongString }))
        .toThrow('Job description must be 5000 characters or less')
      expect(() => new Job({ ...validJobProps, location: longString }))
        .toThrow('Location must be 100 characters or less')
    })

    it('should update job title', () => {
      const job = new Job(validJobProps)
      const originalUpdatedAt = job.getUpdatedAt()

      // Add small delay to ensure timestamp changes
      jest.useFakeTimers()
      jest.advanceTimersByTime(1000)

      job.updateTitle('Senior Software Engineer')

      expect(job.getTitle()).toBe('Senior Software Engineer')
      expect(job.getUpdatedAt().getTime()).toBeGreaterThan(originalUpdatedAt.getTime())

      jest.useRealTimers()
    })

    it('should update job company', () => {
      const job = new Job(validJobProps)
      job.updateCompany('New Tech Corp')
      expect(job.getCompany()).toBe('New Tech Corp')
    })

    it('should update job description', () => {
      const job = new Job(validJobProps)
      job.updateDescription('Updated job description')
      expect(job.getDescription()).toBe('Updated job description')
    })

    it('should update job location', () => {
      const job = new Job(validJobProps)
      job.updateLocation('New York')
      expect(job.getLocation()).toBe('New York')
    })

    it('should update job type', () => {
      const job = new Job(validJobProps)
      job.updateJobType(JobType.PART_TIME)
      expect(job.getJobType()).toBe(JobType.PART_TIME)
    })

    it('should check ownership', () => {
      const job = new Job(validJobProps)
      expect(job.isOwnedBy('user-123')).toBe(true)
      expect(job.isOwnedBy('user-456')).toBe(false)
    })

    it('should serialize to JSON', () => {
      const job = new Job(validJobProps)
      const json = job.toJSON()

      expect(json).toEqual(validJobProps)
    })

    it('should create new Job with generated ID and timestamps', () => {
      const props = {
        title: 'New Job',
        company: 'New Company',
        description: 'Job description',
        location: 'Location',
        jobType: JobType.CONTRACT,
        userId: 'user-456',
      }

      const job = Job.create(props)

      expect(job.getId()).toBeDefined()
      expect(job.getId().length).toBeGreaterThan(0)
      expect(job.getTitle()).toBe('New Job')
      expect(job.getCompany()).toBe('New Company')
      expect(job.getJobType()).toBe(JobType.CONTRACT)
      expect(job.getCreatedAt()).toBeInstanceOf(Date)
      expect(job.getUpdatedAt()).toBeInstanceOf(Date)
      expect(job.getCreatedAt()).toEqual(job.getUpdatedAt())
    })

    it('should validate update operations', () => {
      const job = new Job(validJobProps)

      expect(() => job.updateTitle('')).toThrow('Job title is required')
      expect(() => job.updateTitle('a'.repeat(101))).toThrow('Job title must be 100 characters or less')

      expect(() => job.updateCompany('')).toThrow('Company name is required')
      expect(() => job.updateCompany('a'.repeat(101))).toThrow('Company name must be 100 characters or less')

      expect(() => job.updateDescription('')).toThrow('Job description is required')
      expect(() => job.updateDescription('a'.repeat(5001))).toThrow('Job description must be 5000 characters or less')

      expect(() => job.updateLocation('')).toThrow('Location is required')
      expect(() => job.updateLocation('a'.repeat(101))).toThrow('Location must be 100 characters or less')
    })
  })

  describe('User Entity', () => {
    const validUserProps: UserProps = {
      id: 'user-123',
      email: 'test@example.com',
      createdAt: new Date('2024-01-01'),
      metadata: { role: 'employer' },
    }

    it('should create User entity with valid data', () => {
      const user = new User(validUserProps)

      expect(user.getId()).toBe('user-123')
      expect(user.getEmail()).toBe('test@example.com')
      expect(user.getCreatedAt()).toEqual(new Date('2024-01-01'))
      expect(user.getMetadata()).toEqual({ role: 'employer' })
      expect(user.hasMetadata()).toBe(true)
    })

    it('should create User without metadata', () => {
      const props = { ...validUserProps }
      delete props.metadata

      const user = new User(props)

      expect(user.getId()).toBe('user-123')
      expect(user.getEmail()).toBe('test@example.com')
      expect(user.getMetadata()).toBeUndefined()
      expect(user.hasMetadata()).toBe(false)
    })

    it('should validate required fields', () => {
      expect(() => new User({ ...validUserProps, id: '' })).toThrow('User ID is required')
      expect(() => new User({ ...validUserProps, email: '' })).toThrow('Email is required')
      expect(() => new User({ ...validUserProps, createdAt: null as any })).toThrow('Created date is required')
    })

    it('should validate email format', () => {
      expect(() => new User({ ...validUserProps, email: 'invalid' }))
        .toThrow('Invalid email format')
      expect(() => new User({ ...validUserProps, email: '@example.com' }))
        .toThrow('Invalid email format')
      expect(() => new User({ ...validUserProps, email: 'user@' }))
        .toThrow('Invalid email format')
      expect(() => new User({ ...validUserProps, email: 'user@example' }))
        .toThrow('Invalid email format')

      // Valid email formats
      expect(() => new User({ ...validUserProps, email: 'user@example.com' })).not.toThrow()
      expect(() => new User({ ...validUserProps, email: 'user.name@example.co.uk' })).not.toThrow()
      expect(() => new User({ ...validUserProps, email: 'user+tag@example.com' })).not.toThrow()
    })

    it('should serialize to JSON', () => {
      const user = new User(validUserProps)
      const json = user.toJSON()

      expect(json).toEqual(validUserProps)
    })

    it('should compare users by ID', () => {
      const user1 = new User(validUserProps)
      const user2 = new User(validUserProps)
      const user3 = new User({ ...validUserProps, id: 'user-456' })

      expect(user1.equals(user2)).toBe(true)
      expect(user1.equals(user3)).toBe(false)
    })

    it('should create User from Supabase user object', () => {
      const supabaseUser = {
        id: 'supabase-123',
        email: 'supabase@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: { name: 'Test User' },
      }

      const user = User.fromSupabaseUser(supabaseUser)

      expect(user.getId()).toBe('supabase-123')
      expect(user.getEmail()).toBe('supabase@example.com')
      expect(user.getCreatedAt()).toEqual(new Date('2024-01-01T00:00:00Z'))
      expect(user.getMetadata()).toEqual({ name: 'Test User' })
    })

    it('should handle alternative Supabase user format', () => {
      const supabaseUser = {
        id: 'supabase-456',
        email: 'alt@example.com',
        createdAt: '2024-02-01T00:00:00Z',
        metadata: { role: 'admin' },
      }

      const user = User.fromSupabaseUser(supabaseUser)

      expect(user.getId()).toBe('supabase-456')
      expect(user.getEmail()).toBe('alt@example.com')
      expect(user.getCreatedAt()).toEqual(new Date('2024-02-01T00:00:00Z'))
      expect(user.getMetadata()).toEqual({ role: 'admin' })
    })

    it('should handle empty metadata object', () => {
      const user = new User({ ...validUserProps, metadata: {} })
      expect(user.hasMetadata()).toBe(false)
    })
  })
})