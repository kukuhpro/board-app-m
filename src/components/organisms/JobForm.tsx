import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateJobSchema, UpdateJobSchema } from '@/lib/validations/job'
import type { CreateJobInput, UpdateJobInput } from '@/lib/validations/job'
import { FormField } from '@/components/molecules'
import { Button } from '@/components/atoms'
import { JobType } from '@/domain/valueObjects/JobType'
import clsx from 'clsx'

export interface JobFormProps {
  initialValues?: Partial<CreateJobInput>
  onSubmit: (data: CreateJobInput | UpdateJobInput) => Promise<void>
  mode?: 'create' | 'edit'
  className?: string
  onCancel?: () => void
}

const JobForm: React.FC<JobFormProps> = ({
  initialValues,
  onSubmit,
  mode = 'create',
  className,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const schema = mode === 'create' ? CreateJobSchema : UpdateJobSchema

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm<CreateJobInput | UpdateJobInput>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      title: '',
      company: '',
      description: '',
      location: '',
      jobType: JobType.FULL_TIME
    }
  })

  const jobTypeOptions = [
    { value: JobType.FULL_TIME, label: 'Full-Time' },
    { value: JobType.PART_TIME, label: 'Part-Time' },
    { value: JobType.CONTRACT, label: 'Contract' }
  ]

  const handleFormSubmit = async (data: CreateJobInput | UpdateJobInput) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      if (mode === 'create') {
        reset()
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    reset(initialValues || {
      title: '',
      company: '',
      description: '',
      location: '',
      jobType: JobType.FULL_TIME
    })
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={clsx('space-y-6', className)}
      noValidate
    >
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Post a New Job' : 'Edit Job'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {mode === 'create'
              ? 'Fill in the details to create a new job posting.'
              : 'Update the job posting details.'}
          </p>
        </div>

        <div className="space-y-4">
          <FormField
            label="Job Title"
            name="title"
            type="text"
            placeholder="e.g., Senior Software Engineer"
            required
            register={register('title')}
            error={errors.title?.message}
          />

          <FormField
            label="Company Name"
            name="company"
            type="text"
            placeholder="e.g., Tech Corp"
            required
            register={register('company')}
            error={errors.company?.message}
          />

          <FormField
            label="Location"
            name="location"
            type="text"
            placeholder="e.g., San Francisco, CA or Remote"
            required
            register={register('location')}
            error={errors.location?.message}
          />

          <FormField
            label="Job Type"
            name="jobType"
            type="select"
            options={jobTypeOptions}
            required
            register={register('jobType')}
            error={errors.jobType?.message}
          />

          <div className="space-y-1">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Job Description
              <span className="ml-1 text-red-500" aria-label="required">
                *
              </span>
            </label>
            <textarea
              id="description"
              rows={6}
              className={clsx(
                'block w-full rounded-md border px-3 py-2',
                'text-gray-900 placeholder-gray-500',
                'focus:outline-none focus:ring-2',
                errors.description
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              )}
              placeholder="Describe the role, responsibilities, requirements, and benefits..."
              {...register('description')}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <p
                id="description-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-4">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}

          {mode === 'create' && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={isSubmitting || !isDirty}
            >
              Reset
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? mode === 'create'
                ? 'Creating...'
                : 'Updating...'
              : mode === 'create'
              ? 'Post Job'
              : 'Update Job'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default JobForm