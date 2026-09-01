import {
  useEffect,
  useState,
} from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import type {
  Category,
  Department,
  TicketPriority,
} from "../types/ticket";

function CreateTicketPage() {
  const navigate = useNavigate();

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [departmentId, setDepartmentId] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [title, setTitle] = useState("");

  const [description, setDescription] =
    useState("");

  const [priority, setPriority] =
    useState<TicketPriority>("MEDIUM");

  const [loading, setLoading] =
    useState(false);

  const [loadingData, setLoadingData] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response =
          await api.get<Department[]>(
            "/departments"
          );

        setDepartments(
          response.data.filter(
            (department) => department.active
          )
        );
      } catch {
        setError(
          "Unable to load support departments."
        );
      } finally {
        setLoadingData(false);
      }
    };

    void loadDepartments();
  }, []);

  useEffect(() => {
    if (!departmentId) {
      return;
    }

    const loadCategories = async () => {
      try {
        const response =
          await api.get<Category[]>(
            `/categories/department/${departmentId}`
          );

        setCategories(
          response.data.filter(
            (category) => category.active
          )
        );
      } catch {
        setCategories([]);

        setError(
          "Unable to load categories for this department."
        );
      }
    };

    void loadCategories();
  }, [departmentId]);

  const handleDepartmentChange = (
    value: string
  ) => {
    setDepartmentId(value);
    setCategoryId("");
    setCategories([]);
    setError("");
  };

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!departmentId || !categoryId) {
      setError(
        "Please select a department and category."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post(
        "/tickets",
        {
          title,
          description,
          departmentId:
            Number(departmentId),
          categoryId:
            Number(categoryId),
          priority,
        }
      );

      navigate(
        `/tickets/${response.data.id}`
      );
    } catch {
      setError(
        "Unable to create the ticket. Please check the information and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedDepartment =
    departments.find(
      (department) =>
        String(department.id) === departmentId
    );

  const selectedCategory =
    categories.find(
      (category) =>
        String(category.id) === categoryId
    );

  const priorityDescription =
    priority === "LOW"
      ? "Minor issue with little operational impact."
      : priority === "MEDIUM"
        ? "Standard support request affecting normal work."
        : priority === "HIGH"
          ? "Significant issue requiring faster attention."
          : "Critical issue causing major business disruption.";

  if (loadingData) {
    return (
      <div className="ticket-page-loading">
        <div className="dashboard-loading-spinner" />

        <span>
          Loading support options...
        </span>
      </div>
    );
  }

  return (
    <div className="page-container create-ticket-page">
      <div className="create-ticket-header">
        <div>
          <span className="dashboard-kicker">
            NEW SUPPORT REQUEST
          </span>

          <h1>Create Ticket</h1>

          <p>
            Tell us what happened and route your request to the
            appropriate support team.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate("/tickets/my")
          }
        >
          ← Back to My Tickets
        </button>
      </div>

      <div className="create-ticket-layout">
        <section className="create-ticket-main-card">
          <div className="create-ticket-card-header">
            <div className="create-ticket-step">
              <span>01</span>

              <div>
                <strong>
                  Request details
                </strong>

                <small>
                  Provide the information needed by the
                  support team.
                </small>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="create-ticket-form"
          >
            <div className="create-ticket-section">
              <div className="create-ticket-section-heading">
                <span>Routing</span>

                <h2>
                  Where should this request go?
                </h2>

                <p>
                  Select the most relevant department and
                  category.
                </p>
              </div>

              <div className="ticket-form-grid">
                <div className="form-group">
                  <label htmlFor="department">
                    Department
                  </label>

                  <select
                    id="department"
                    value={departmentId}
                    onChange={(event) =>
                      handleDepartmentChange(
                        event.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select department
                    </option>

                    {departments.map(
                      (department) => (
                        <option
                          key={department.id}
                          value={department.id}
                        >
                          {department.name}
                        </option>
                      )
                    )}
                  </select>

                  <small className="form-helper-text">
                    Choose the team responsible for the issue.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="category">
                    Category
                  </label>

                  <select
                    id="category"
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(
                        event.target.value
                      )
                    }
                    disabled={!departmentId}
                    required
                  >
                    <option value="">
                      {departmentId
                        ? "Select category"
                        : "Select department first"}
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      )
                    )}
                  </select>

                  <small className="form-helper-text">
                    This helps support understand the issue
                    faster.
                  </small>
                </div>
              </div>
            </div>

            <div className="create-ticket-divider" />

            <div className="create-ticket-section">
              <div className="create-ticket-section-heading">
                <span>Issue</span>

                <h2>
                  Describe what happened
                </h2>

                <p>
                  Include enough detail for the support team to
                  understand and investigate the problem.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="title">
                  Ticket Title
                </label>

                <input
                  id="title"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="Example: Unable to connect to office Wi-Fi"
                  required
                />

                <small className="form-helper-text">
                  Keep the title short and specific.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Describe the problem, when it started, what you expected to happen, and anything you already tried..."
                  rows={8}
                  required
                />

                <div className="description-helper-row">
                  <small className="form-helper-text">
                    Include error messages or relevant context
                    when available.
                  </small>

                  <span>
                    {description.length} characters
                  </span>
                </div>
              </div>
            </div>

            <div className="create-ticket-divider" />

            <div className="create-ticket-section">
              <div className="create-ticket-section-heading">
                <span>Impact</span>

                <h2>
                  Set request priority
                </h2>

                <p>
                  Choose a level that reflects the actual
                  business impact.
                </p>
              </div>

              <div className="priority-selector-grid">
                {(
                  [
                    "LOW",
                    "MEDIUM",
                    "HIGH",
                    "CRITICAL",
                  ] as TicketPriority[]
                ).map(
                  (priorityOption) => (
                    <button
                      key={priorityOption}
                      type="button"
                      className={`priority-choice priority-choice-${priorityOption.toLowerCase()} ${
                        priority === priorityOption
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setPriority(
                          priorityOption
                        )
                      }
                    >
                      <span className="priority-choice-dot" />

                      <strong>
                        {priorityOption}
                      </strong>

                      <small>
                        {priorityOption === "LOW"
                          ? "Minor impact"
                          : priorityOption === "MEDIUM"
                            ? "Normal impact"
                            : priorityOption === "HIGH"
                              ? "Major impact"
                              : "Severe disruption"}
                      </small>
                    </button>
                  )
                )}
              </div>

              <input
                type="hidden"
                value={priority}
                readOnly
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="create-ticket-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  navigate("/tickets/my")
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button create-ticket-submit"
                disabled={loading}
              >
                {loading
                  ? "Creating Ticket..."
                  : "Create Ticket →"}
              </button>
            </div>
          </form>
        </section>

        <aside className="create-ticket-sidebar">
          <section className="create-ticket-summary-card">
            <div className="create-summary-header">
              <span className="dashboard-kicker">
                REQUEST SUMMARY
              </span>

              <h2>
                Ticket Preview
              </h2>
            </div>

            <div className="create-summary-item">
              <span>Department</span>

              <strong>
                {selectedDepartment?.name ??
                  "Not selected"}
              </strong>
            </div>

            <div className="create-summary-item">
              <span>Category</span>

              <strong>
                {selectedCategory?.name ??
                  "Not selected"}
              </strong>
            </div>

            <div className="create-summary-item">
              <span>Priority</span>

              <span
                className={`priority-badge priority-${priority.toLowerCase()}`}
              >
                {priority}
              </span>
            </div>

            <div className="create-summary-title">
              <span>Title</span>

              <strong>
                {title.trim() ||
                  "Your ticket title will appear here"}
              </strong>
            </div>
          </section>

          <section className="create-priority-card">
            <div className="create-priority-icon">
              !
            </div>

            <div>
              <span>
                {priority} PRIORITY
              </span>

              <strong>
                {priorityDescription}
              </strong>
            </div>
          </section>

          <section className="create-help-card">
            <span className="dashboard-kicker">
              BEFORE SUBMITTING
            </span>

            <h2>
              Help us resolve it faster
            </h2>

            <div className="create-help-list">
              <div>
                <span>✓</span>
                <p>
                  Use a clear and specific title.
                </p>
              </div>

              <div>
                <span>✓</span>
                <p>
                  Explain when the issue started.
                </p>
              </div>

              <div>
                <span>✓</span>
                <p>
                  Mention any troubleshooting already tried.
                </p>
              </div>

              <div>
                <span>✓</span>
                <p>
                  Select priority based on real impact.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default CreateTicketPage;