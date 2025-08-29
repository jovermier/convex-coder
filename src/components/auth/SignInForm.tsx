import { useState } from "react";

import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/validation";

export function SignInForm() {
  const { signIn, signUp, loading, error } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      setLocalError(null);

      try {
        if (isSignUp) {
          await signUp(value.email, value.password, value.name);
        } else {
          await signIn(value.email, value.password);
        }
      } catch (err) {
        setLocalError(
          err instanceof Error ? err.message : "Authentication failed"
        );
      }
    },
  });

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignUp ? "Sign Up" : "Sign In"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {isSignUp && (
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) => validateName(value),
              }}
            >
              {(field) => (
                <div>
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <div className="mt-1 text-xs text-red-600">
                      {field.state.meta.errors[0]}
                    </div>
                  )}
                </div>
              )}
            </form.Field>
          )}

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => validateEmail(value),
            }}
          >
            {(field) => (
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <div className="mt-1 text-xs text-red-600">
                    {field.state.meta.errors[0]}
                  </div>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => validatePassword(value, isSignUp),
            }}
          >
            {(field) => (
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <div className="mt-1 text-xs text-red-600">
                    {field.state.meta.errors[0]}
                  </div>
                )}
                {isSignUp &&
                  !field.state.meta.errors.length &&
                  field.state.value && (
                    <div className="mt-1 text-xs text-gray-500">
                      Password must be at least 8 characters with uppercase,
                      lowercase, and number
                    </div>
                  )}
              </div>
            )}
          </form.Field>

          {isSignUp && (
            <form.Field
              name="confirmPassword"
              validators={{
                onChange: ({ value, fieldApi }) => {
                  const password = fieldApi.form.getFieldValue("password");
                  return validateConfirmPassword(password, value);
                },
              }}
            >
              {(field) => (
                <div>
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <div className="mt-1 text-xs text-red-600">
                      {field.state.meta.errors[0]}
                    </div>
                  )}
                </div>
              )}
            </form.Field>
          )}

          {(error || localError) && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">
              {error || localError}
            </div>
          )}

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isSubmitting || loading}
              >
                {loading || isSubmitting
                  ? "Loading..."
                  : isSignUp
                    ? "Sign Up"
                    : "Sign In"}
              </Button>
            )}
          </form.Subscribe>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsSignUp(!isSignUp);
              form.reset();
              setLocalError(null);
            }}
            className="w-full"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Need an account? Sign up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
