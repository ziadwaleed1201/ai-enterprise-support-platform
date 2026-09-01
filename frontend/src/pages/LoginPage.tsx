import { useState } from "react";
import type { FormEvent } from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../auth/useAuth";

function LoginPage() {
  const navigate = useNavigate();

  const {
    login,
    user,
    loading: authLoading,
  } = useAuth();

  const [email, setEmail] =
    useState("ziad@test.com");

  const [password, setPassword] =
    useState("Test1234");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  if (authLoading) {
    return (
      <div className="login-clean-loading">
        <div className="login-clean-logo">
          S
        </div>

        <span>
          Loading SupportAI...
        </span>
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  const handleLogin = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(
        email,
        password
      );

      navigate("/dashboard");
    } catch {
      setError(
        "Unable to sign in. Check your email and password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-clean-page">
      <div className="login-clean-shell">
        <section className="login-clean-brand-side">
          <div className="login-clean-brand">
            <div className="login-clean-brand-mark">
              S
            </div>

            <div>
              <strong>
                SupportAI
              </strong>

              <span>
                Enterprise Service Desk
              </span>
            </div>
          </div>

          <div className="login-clean-brand-content">
            <h1>
              Support operations
              in one workspace.
            </h1>

            <p>
              Manage support requests,
              assignments, service levels,
              notifications, and administration
              from a single platform.
            </p>
          </div>

          <div className="login-clean-brand-footer">
            Internal support platform
          </div>
        </section>

        <section className="login-clean-form-side">
          <div className="login-clean-card">
            <div className="login-clean-card-header">
              <h2>
                Sign in
              </h2>

              <p>
                Enter your account details to continue.
              </p>
            </div>

            <form
              className="login-clean-form"
              onSubmit={handleLogin}
            >
              <div className="login-clean-field">
                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-clean-field">
                <label htmlFor="password">
                  Password
                </label>

                <div className="login-clean-password">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-clean-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="login-clean-submit"
                disabled={submitting}
              >
                {submitting
                  ? "Signing in..."
                  : "Sign in"}
              </button>
            </form>
          </div>

          <p className="login-clean-footer">
            SupportAI · Internal Enterprise Support Platform
          </p>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;