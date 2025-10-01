import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, RegisterSchema } from "@/lib/validations/job";
import type { LoginInput, RegisterInput } from "@/lib/validations/job";
import { FormField } from "@/components/molecules";
import { Button, ErrorMessage } from "@/components/atoms";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { User } from "@/domain/entities/User";
import clsx from "clsx";

export interface AuthFormProps {
  mode: "login" | "register";
  onSuccess?: () => void;
  className?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({
  mode: initialMode,
  onSuccess,
  className,
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>("");
  const router = useRouter();
  const { login } = useAuthStore();

  const isLogin = mode === "login";
  const schema = isLogin ? LoginSchema : RegisterSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<LoginInput | RegisterInput>({
    resolver: zodResolver(schema),
  });

  const password = watch("password");

  const toggleMode = () => {
    setMode(isLogin ? "register" : "login");
    setServerError("");
    reset();
  };

  const handleAuth = async (data: LoginInput | RegisterInput) => {
    setIsSubmitting(true);
    setServerError("");

    try {
      const response = await fetch(
        `/api/auth/${isLogin ? "login" : "register"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Authentication failed");
      }

      const result = await response.json();

      // Update auth store with user data
      if (result.user) {
        const user = User.fromSupabaseUser(result.user);
        login(user);
      }

      // Handle success redirect
      if (onSuccess) {
        onSuccess();
      } else {
        // Default redirect to dashboard
        router.push("/dashboard");
      }
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={clsx("w-full max-w-md mx-auto", className)}>
      <div className="bg-white shadow-lg rounded-lg px-8 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin
              ? "Sign in to access your account"
              : "Join us to start posting and finding jobs"}
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mb-4">
            <ErrorMessage message={serverError} />
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit(handleAuth)}
          className="space-y-6"
          noValidate
        >
          <FormField
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            register={register("email")}
            error={errors.email?.message}
            autoComplete="email"
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            placeholder={isLogin ? "Enter your password" : "Create a password"}
            required
            register={register("password")}
            error={errors.password?.message}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />

          {!isLogin && (
            <FormField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              required
              register={register("confirmPassword" as any)}
              error={(errors as any).confirmPassword?.message}
              autoComplete="new-password"
            />
          )}

          {/* Remember Me / Forgot Password */}
          {isLogin && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
              ? "Sign In"
              : "Create Account"}
          </Button>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={toggleMode}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
