"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAuthenticated } from "@/stores/authStore";
import { JobForm } from "@/components/organisms";
import { LoadingSpinner } from "@/components/atoms";
import { CreateJobSchema } from "@/lib/validations/job";
import type { CreateJobInput } from "@/lib/validations/job";
import Link from "next/link";

export default function CreateJobPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated]);

  const handleSubmit = async (data: CreateJobInput) => {
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create job");
      }

      const result = await response.json();

      if (result.success) {
        // Redirect to the created job's detail page
        router.push(`/jobs/${result.data.id}`);
      } else {
        throw new Error(result.error || "Failed to create job");
      }
    } catch (error) {
      console.error("Error creating job:", error);
      throw error; // Re-throw so JobForm can handle it
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Post a New Job
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Fill out the details below to create your job posting
              </p>
            </div>
            <Link href="/dashboard">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-8">
            <JobForm
              mode="create"
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              schema={CreateJobSchema}
            />
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Tips for writing a great job posting
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Write a clear, descriptive job title that accurately reflects
                the role
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Include specific requirements, skills, and qualifications needed
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Describe the company culture and what makes your workplace
                unique
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Be specific about the location, especially if remote work is
                available
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Proofread your posting for grammar and spelling errors
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
