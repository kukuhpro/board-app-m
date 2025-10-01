import Image from 'next/image'
import { useState } from 'react'
import clsx from 'clsx'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  className?: string
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  fallback?: string
}

/**
 * Optimized image component using Next.js Image
 * Automatically handles format conversion, lazy loading, and responsive sizing
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  sizes,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  fallback = '/images/placeholder.svg'
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setImageError(true)
    setIsLoading(false)
  }

  // Use fallback image if error occurred
  const imageSrc = imageError ? fallback : src

  return (
    <div className={clsx('relative', className)}>
      {/* Loading skeleton */}
      {isLoading && !priority && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}

      <Image
        src={imageSrc}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        priority={priority}
        sizes={sizes || (fill ? '100vw' : undefined)}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={clsx(
          'transition-opacity duration-300',
          isLoading && !priority ? 'opacity-0' : 'opacity-100',
          fill && 'object-cover'
        )}
      />
    </div>
  )
}

// Preset configurations for common image types
export const imagePresets = {
  avatar: {
    width: 40,
    height: 40,
    quality: 90,
    className: 'rounded-full overflow-hidden'
  },
  thumbnail: {
    width: 150,
    height: 150,
    quality: 70,
    className: 'rounded-lg overflow-hidden'
  },
  card: {
    width: 400,
    height: 250,
    quality: 75,
    className: 'rounded-lg overflow-hidden'
  },
  hero: {
    fill: true,
    priority: true,
    quality: 85,
    sizes: '100vw',
    className: 'w-full h-full'
  },
  banner: {
    fill: true,
    quality: 80,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw',
    className: 'w-full h-full'
  }
}

// Avatar component with optimized defaults
export function Avatar({
  src,
  alt,
  size = 40,
  className
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality={90}
      className={clsx('rounded-full overflow-hidden', className)}
      fallback="/images/default-avatar.svg"
    />
  )
}

// Company logo component with optimized defaults
export function CompanyLogo({
  src,
  alt,
  className
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={120}
      height={40}
      quality={95}
      className={clsx('object-contain', className)}
      fallback="/images/default-company.svg"
    />
  )
}