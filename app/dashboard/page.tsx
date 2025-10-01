"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAuthenticated, useAuthStore } from "@/stores/authStore";
import { Button, LoadingSpinner } from "@/components/atoms";
import { JobCard, EmptyState } from "@/components/molecules";
import type { JobCardData } from "@/components/molecules";
import Link from "next/link";

interface UserJobsResponse {
  success: boolean;
  data: {
    jobs: JobCardData[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const { user } = useAuthStore();

  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchUserJobs = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });

      const response = await fetch(`/api/users/jobs?${params.toString()}`);

      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data: UserJobsResponse = await response.json();

      if (data.success) {
        setJobs(data.data.jobs);
        setCurrentPage(data.data.page);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
      } else {
        setError("Failed to load your jobs");
      }
    } catch (err) {
      console.error("Error fetching user jobs:", err);
      setError("Failed to load your jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (job: JobCardData) => {
    router.push(`/jobs/${job.id}`);
  };

  const handleCreateJob = () => {
    router.push("/jobs/new");
  };

  const handleEditJob = (job: JobCardData) => {
    router.push(`/jobs/${job.id}/edit`);
  };

  const handleDeleteJob = async (job: JobCardData) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      const data = await response.json();

      if (data.success) {
        // Refresh the jobs list
        fetchUserJobs(currentPage);
      } else {
        alert("Failed to delete job. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting job:", err);
      alert("Failed to delete job. Please try again.");
    }
  };

  const handleLogout = () => {
    const { logout } = useAuthStore.getState();
    logout();
    router.push("/");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUserJobs(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return (
      <nav
        className="flex items-center justify-center mt-8"
        aria-label="Pagination"
      >
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          {Array.from(
            { length: endPage - startPage + 1 },
            (_, i) => startPage + i
          ).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 text-sm rounded ${
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          ))}

          <Button
            variant="secondary"
            size="small"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </nav>
    );
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    fetchUserJobs();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {user?.getEmail()}
              </p>
            </div>
            <div className="flex space-x-4">
              <Link href="/">
                <Button variant="secondary">Browse Jobs</Button>
              </Link>
              <Button variant="primary" onClick={handleCreateJob}>
                + Post New Job
              </Button>
              <Button variant="danger" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Jobs Posted
                </p>
                <p className="text-2xl font-semibold text-gray-900">{total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Listings
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {jobs?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {
                    jobs?.filter((job) => {
                      const jobDate = new Date(job.createdAt);
                      const now = new Date();
                      return (
                        jobDate.getMonth() === now.getMonth() &&
                        jobDate.getFullYear() === now.getFullYear()
                      );
                    }).length || 0
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Job Postings
              </h2>
              <Button variant="primary" size="small" onClick={handleCreateJob}>
                Post New Job
              </Button>
            </div>
          </div>

          <div className="p-6">
            {!jobs || jobs.length === 0 ? (
              <EmptyState
                title="No job postings yet"
                description="Get started by posting your first job opportunity. It's quick and easy!"
                action={{
                  label: "Post Your First Job",
                  onClick: handleCreateJob,
                }}
              />
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleJobClick(job)}
                    >
                      <JobCard
                        job={job}
                        className="border-none shadow-none p-0 hover:shadow-none"
                      />
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleEditJob(job)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDeleteJob(job)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {renderPagination()}
          </div>
        </div>
      </main>
    </div>
  );
}
