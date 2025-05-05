"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  bufferValue?: number
  showText?: boolean
  text?: string
  height?: number
  color?: string
  bufferColor?: string
  backgroundColor?: string
}

export function ProgressBar({
  value,
  bufferValue,
  showText = true,
  text,
  height = 24,
  color = "bg-blue-600",
  bufferColor = "bg-blue-300",
  backgroundColor = "bg-gray-200",
  className,
  ...props
}: ProgressBarProps) {
  // Ensure values are within 0-100 range
  const progress = Math.min(100, Math.max(0, value))
  const buffer = bufferValue
    ? Math.min(100, Math.max(progress, bufferValue))
    : progress

  // Default text is the percentage if not provided
  const displayText = text || `${Math.round(progress)}%`

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full",
        backgroundColor,
        className,
      )}
      style={{ height: `${height}px` }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div className="relative h-full w-full">
        {/* Buffer Progress */}
        {bufferValue && (
          <div
            className={cn(
              "absolute left-0 top-0 h-full transition-all duration-300 ease-in-out",
              bufferColor,
            )}
            style={{ width: `${buffer}%` }}
          />
        )}

        {/* Main Progress */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full transition-all duration-300 ease-in-out",
            color,
          )}
          style={{ width: `${progress}%` }}
        />

        {/* Text */}
        {showText && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-white drop-shadow-md">
              {displayText}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
