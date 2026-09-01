import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

interface Department {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  departmentId: number;
  departmentName: string;
}

interface DepartmentForm {
  name: string;
  description: string;
  active: boolean;
}

interface CategoryForm {
  name: string;
  description: string;
  departmentId: number | "";
  active: boolean;
}

const EMPTY_DEPARTMENT_FORM: DepartmentForm = {
  name: "",
  description: "",
  active: true,
};

const EMPTY_CATEGORY_FORM: CategoryForm = {
  name: "",
  description: "",
  departmentId: "",
  active: true,
};

function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [departmentForm, setDepartmentForm] =
    useState<DepartmentForm>(EMPTY_DEPARTMENT_FORM);

  const [categoryForm, setCategoryForm] =
    useState<CategoryForm>(EMPTY_CATEGORY_FORM);

  const [editingDepartmentId, setEditingDepartmentId] =
    useState<number | null>(null);

  const [editingCategoryId, setEditingCategoryId] =
    useState<number | null>(null);

  const [departmentSearch, setDepartmentSearch] =
    useState("");

  const [categorySearch, setCategorySearch] =
    useState("");

  const [categoryDepartmentFilter, setCategoryDepartmentFilter] =
    useState<number | "ALL">("ALL");

  const [loading, setLoading] = useState(true);

  const [savingDepartment, setSavingDepartment] =
    useState(false);

  const [savingCategory, setSavingCategory] =
    useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [departmentsResponse, categoriesResponse] =
          await Promise.all([
            api.get<Department[]>("/admin/departments"),
            api.get<Category[]>("/admin/categories"),
          ]);

        if (active) {
          setDepartments(departmentsResponse.data);
          setCategories(categoriesResponse.data);
        }
      } catch {
        if (active) {
          setError(
            "Unable to load departments and categories."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const refreshDepartments = async () => {
    const response =
      await api.get<Department[]>("/admin/departments");

    setDepartments(response.data);
  };

  const refreshCategories = async () => {
    const response =
      await api.get<Category[]>("/admin/categories");

    setCategories(response.data);
  };

  const handleDepartmentSubmit = async () => {
    const name = departmentForm.name.trim();

    if (!name) {
      setError("Department name is required.");
      return;
    }

    try {
      setSavingDepartment(true);
      clearMessages();

      const payload = {
        name,
        description:
          departmentForm.description.trim() || null,
        active: departmentForm.active,
      };

      if (editingDepartmentId) {
        await api.put(
          `/admin/departments/${editingDepartmentId}`,
          payload
        );

        setSuccessMessage(
          "Department updated successfully."
        );
      } else {
        await api.post(
          "/admin/departments",
          payload
        );

        setSuccessMessage(
          "Department created successfully."
        );
      }

      await refreshDepartments();

      setDepartmentForm(EMPTY_DEPARTMENT_FORM);
      setEditingDepartmentId(null);
    } catch {
      setError("Unable to save department.");
    } finally {
      setSavingDepartment(false);
    }
  };

  const handleEditDepartment = (
    department: Department
  ) => {
    clearMessages();

    setEditingDepartmentId(department.id);

    setDepartmentForm({
      name: department.name,
      description: department.description ?? "",
      active: department.active,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancelDepartmentEdit = () => {
    setEditingDepartmentId(null);
    setDepartmentForm(EMPTY_DEPARTMENT_FORM);
    clearMessages();
  };

  const handleCategorySubmit = async () => {
    const name = categoryForm.name.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    if (categoryForm.departmentId === "") {
      setError(
        "Please select a department for the category."
      );
      return;
    }

    try {
      setSavingCategory(true);
      clearMessages();

      const payload = {
        name,
        description:
          categoryForm.description.trim() || null,
        departmentId: categoryForm.departmentId,
        active: categoryForm.active,
      };

      if (editingCategoryId) {
        await api.put(
          `/admin/categories/${editingCategoryId}`,
          payload
        );

        setSuccessMessage(
          "Category updated successfully."
        );
      } else {
        await api.post(
          "/admin/categories",
          payload
        );

        setSuccessMessage(
          "Category created successfully."
        );
      }

      await refreshCategories();

      setCategoryForm(EMPTY_CATEGORY_FORM);
      setEditingCategoryId(null);
    } catch {
      setError("Unable to save category.");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleEditCategory = (
    category: Category
  ) => {
    clearMessages();

    setEditingCategoryId(category.id);

    setCategoryForm({
      name: category.name,
      description: category.description ?? "",
      departmentId: category.departmentId,
      active: category.active,
    });
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    clearMessages();
  };

  const activeDepartments =
    departments.filter(
      (department) => department.active
    ).length;

  const inactiveDepartments =
    departments.length - activeDepartments;

  const activeCategories =
    categories.filter(
      (category) => category.active
    ).length;

  const inactiveCategories =
    categories.length - activeCategories;

  const filteredDepartments = useMemo(() => {
    const query = departmentSearch
      .trim()
      .toLowerCase();

    if (!query) {
      return departments;
    }

    return departments.filter((department) => {
      return (
        department.name.toLowerCase().includes(query) ||
        (department.description ?? "")
          .toLowerCase()
          .includes(query) ||
        String(department.id).includes(query)
      );
    });
  }, [departmentSearch, departments]);

  const filteredCategories = useMemo(() => {
    const query = categorySearch
      .trim()
      .toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !query ||
        category.name.toLowerCase().includes(query) ||
        category.departmentName
          .toLowerCase()
          .includes(query) ||
        (category.description ?? "")
          .toLowerCase()
          .includes(query) ||
        String(category.id).includes(query);

      const matchesDepartment =
        categoryDepartmentFilter === "ALL" ||
        category.departmentId === categoryDepartmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [
    categorySearch,
    categoryDepartmentFilter,
    categories,
  ]);

  if (loading) {
    return (
      <div className="ticket-page-loading">
        <div className="dashboard-loading-spinner" />

        <span>
          Loading departments and categories...
        </span>
      </div>
    );
  }

  return (
    <div className="page-container admin-structure-page">
      <div className="admin-structure-header">
        <div>
          <span className="dashboard-kicker">
            ADMINISTRATION
          </span>

          <h1>
            Departments & Categories
          </h1>

          <p>
            Configure the support structure used to route
            requests to the right teams and categories.
          </p>
        </div>

        <div className="admin-structure-header-badge">
          <span>
            Support Structure
          </span>

          <strong>
            {departments.length + categories.length}
          </strong>

          <small>
            configured items
          </small>
        </div>
      </div>

      <div className="admin-structure-summary-grid">
        <div className="admin-structure-summary-card">
          <span>
            Departments
          </span>

          <strong>
            {departments.length}
          </strong>

          <small>
            Support teams
          </small>
        </div>

        <div className="admin-structure-summary-card structure-active">
          <span>
            Active Departments
          </span>

          <strong>
            {activeDepartments}
          </strong>

          <small>
            Available for routing
          </small>
        </div>

        <div className="admin-structure-summary-card">
          <span>
            Categories
          </span>

          <strong>
            {categories.length}
          </strong>

          <small>
            Ticket classifications
          </small>
        </div>

        <div className="admin-structure-summary-card structure-purple">
          <span>
            Active Categories
          </span>

          <strong>
            {activeCategories}
          </strong>

          <small>
            Available to employees
          </small>
        </div>

        <div className="admin-structure-summary-card structure-inactive">
          <span>
            Inactive
          </span>

          <strong>
            {inactiveDepartments + inactiveCategories}
          </strong>

          <small>
            Hidden routing options
          </small>
        </div>
      </div>

      {error && (
        <div className="admin-structure-message error">
          <strong>
            Something went wrong
          </strong>

          <span>
            {error}
          </span>
        </div>
      )}

      {successMessage && (
        <div className="admin-structure-message success">
          <strong>
            Changes saved
          </strong>

          <span>
            {successMessage}
          </span>
        </div>
      )}

      <section className="admin-structure-section">
        <div className="admin-structure-section-heading">
          <div>
            <span className="dashboard-kicker">
              DEPARTMENTS
            </span>

            <h2>
              Support departments
            </h2>

            <p>
              Create and maintain the teams responsible for
              handling support requests.
            </p>
          </div>

          <span className="tickets-count-badge">
            {departments.length} departments
          </span>
        </div>

        <div className="admin-structure-layout">
          <div className="admin-structure-form-card">
            <div className="admin-structure-form-header">
              <div className="admin-structure-form-icon">
                {editingDepartmentId ? "✎" : "+"}
              </div>

              <div>
                <span>
                  {editingDepartmentId
                    ? "EDIT DEPARTMENT"
                    : "NEW DEPARTMENT"}
                </span>

                <h3>
                  {editingDepartmentId
                    ? "Update department"
                    : "Create department"}
                </h3>
              </div>
            </div>

            <div className="admin-structure-form">
              <div className="admin-structure-field">
                <label htmlFor="department-name">
                  Department Name
                </label>

                <input
                  id="department-name"
                  type="text"
                  value={departmentForm.name}
                  onChange={(event) =>
                    setDepartmentForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Example: Finance"
                />
              </div>

              <div className="admin-structure-field">
                <div className="admin-structure-field-label">
                  <label htmlFor="department-description">
                    Description
                  </label>

                  <span>
                    Optional
                  </span>
                </div>

                <textarea
                  id="department-description"
                  value={departmentForm.description}
                  onChange={(event) =>
                    setDepartmentForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Describe what this department handles..."
                />
              </div>

              <label className="admin-structure-toggle">
                <input
                  type="checkbox"
                  checked={departmentForm.active}
                  onChange={(event) =>
                    setDepartmentForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                />

                <span className="admin-structure-toggle-track">
                  <span />
                </span>

                <span className="admin-structure-toggle-copy">
                  <strong>
                    Active department
                  </strong>

                  <small>
                    Available when routing new tickets.
                  </small>
                </span>
              </label>

              <div className="admin-structure-form-actions">
                <button
                  type="button"
                  className="admin-structure-primary-button"
                  onClick={() =>
                    void handleDepartmentSubmit()
                  }
                  disabled={savingDepartment}
                >
                  {savingDepartment
                    ? "Saving..."
                    : editingDepartmentId
                      ? "Update Department"
                      : "Create Department"}
                </button>

                {editingDepartmentId && (
                  <button
                    type="button"
                    className="admin-structure-secondary-button"
                    onClick={handleCancelDepartmentEdit}
                    disabled={savingDepartment}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="admin-structure-directory">
            <div className="admin-structure-toolbar">
              <div className="admin-structure-search">
                <span>
                  ⌕
                </span>

                <input
                  type="text"
                  value={departmentSearch}
                  onChange={(event) =>
                    setDepartmentSearch(event.target.value)
                  }
                  placeholder="Search departments..."
                  aria-label="Search departments"
                />

                {departmentSearch && (
                  <button
                    type="button"
                    onClick={() =>
                      setDepartmentSearch("")
                    }
                    aria-label="Clear department search"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="admin-structure-result-count">
                <strong>
                  {filteredDepartments.length}
                </strong>

                <span>
                  shown
                </span>
              </div>
            </div>

            <div className="admin-structure-table-scroll">
              <table className="admin-structure-table">
                <thead>
                  <tr>
                    <th>
                      Department
                    </th>

                    <th>
                      Description
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDepartments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="admin-structure-empty-cell"
                      >
                        <strong>
                          No departments found
                        </strong>

                        <span>
                          Try a different search.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map(
                      (department) => (
                        <tr key={department.id}>
                          <td>
                            <div className="admin-structure-name-cell">
                              <div className="admin-structure-item-icon">
                                {department.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {department.name}
                                </strong>

                                <span>
                                  Department #{department.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="admin-structure-description">
                              {department.description ||
                                "No description"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`admin-structure-status ${
                                department.active
                                  ? "active"
                                  : "inactive"
                              }`}
                            >
                              <span />

                              {department.active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="admin-structure-edit-button"
                              onClick={() =>
                                handleEditDepartment(
                                  department
                                )
                              }
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-structure-section">
        <div className="admin-structure-section-heading">
          <div>
            <span className="dashboard-kicker">
              CATEGORIES
            </span>

            <h2>
              Ticket categories
            </h2>

            <p>
              Organize requests into specific issue types
              within each department.
            </p>
          </div>

          <span className="tickets-count-badge">
            {categories.length} categories
          </span>
        </div>

        <div className="admin-structure-layout">
          <div className="admin-structure-form-card">
            <div className="admin-structure-form-header">
              <div className="admin-structure-form-icon category">
                {editingCategoryId ? "✎" : "+"}
              </div>

              <div>
                <span>
                  {editingCategoryId
                    ? "EDIT CATEGORY"
                    : "NEW CATEGORY"}
                </span>

                <h3>
                  {editingCategoryId
                    ? "Update category"
                    : "Create category"}
                </h3>
              </div>
            </div>

            <div className="admin-structure-form">
              <div className="admin-structure-field">
                <label htmlFor="category-name">
                  Category Name
                </label>

                <input
                  id="category-name"
                  type="text"
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Example: Payroll Issue"
                />
              </div>

              <div className="admin-structure-field">
                <div className="admin-structure-field-label">
                  <label htmlFor="category-description">
                    Description
                  </label>

                  <span>
                    Optional
                  </span>
                </div>

                <textarea
                  id="category-description"
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Describe the issue type..."
                />
              </div>

              <div className="admin-structure-field">
                <label htmlFor="category-department">
                  Department
                </label>

                <select
                  id="category-department"
                  value={categoryForm.departmentId}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      departmentId: event.target.value
                        ? Number(event.target.value)
                        : "",
                    }))
                  }
                >
                  <option value="">
                    Select department
                  </option>

                  {departments.map((department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="admin-structure-toggle">
                <input
                  type="checkbox"
                  checked={categoryForm.active}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                />

                <span className="admin-structure-toggle-track">
                  <span />
                </span>

                <span className="admin-structure-toggle-copy">
                  <strong>
                    Active category
                  </strong>

                  <small>
                    Employees can select this category.
                  </small>
                </span>
              </label>

              <div className="admin-structure-form-actions">
                <button
                  type="button"
                  className="admin-structure-primary-button"
                  onClick={() =>
                    void handleCategorySubmit()
                  }
                  disabled={savingCategory}
                >
                  {savingCategory
                    ? "Saving..."
                    : editingCategoryId
                      ? "Update Category"
                      : "Create Category"}
                </button>

                {editingCategoryId && (
                  <button
                    type="button"
                    className="admin-structure-secondary-button"
                    onClick={handleCancelCategoryEdit}
                    disabled={savingCategory}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="admin-structure-directory">
            <div className="admin-structure-toolbar admin-category-toolbar">
              <div className="admin-structure-search">
                <span>
                  ⌕
                </span>

                <input
                  type="text"
                  value={categorySearch}
                  onChange={(event) =>
                    setCategorySearch(event.target.value)
                  }
                  placeholder="Search categories..."
                  aria-label="Search categories"
                />

                {categorySearch && (
                  <button
                    type="button"
                    onClick={() =>
                      setCategorySearch("")
                    }
                    aria-label="Clear category search"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                className="admin-category-filter"
                value={categoryDepartmentFilter}
                onChange={(event) =>
                  setCategoryDepartmentFilter(
                    event.target.value === "ALL"
                      ? "ALL"
                      : Number(event.target.value)
                  )
                }
                aria-label="Filter categories by department"
              >
                <option value="ALL">
                  All departments
                </option>

                {departments.map((department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.name}
                  </option>
                ))}
              </select>

              <div className="admin-structure-result-count">
                <strong>
                  {filteredCategories.length}
                </strong>

                <span>
                  shown
                </span>
              </div>
            </div>

            <div className="admin-structure-table-scroll">
              <table className="admin-structure-table category-table">
                <thead>
                  <tr>
                    <th>
                      Category
                    </th>

                    <th>
                      Department
                    </th>

                    <th>
                      Description
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="admin-structure-empty-cell"
                      >
                        <strong>
                          No categories found
                        </strong>

                        <span>
                          Try changing your search or
                          department filter.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map(
                      (category) => (
                        <tr key={category.id}>
                          <td>
                            <div className="admin-structure-name-cell">
                              <div className="admin-structure-item-icon category">
                                {category.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {category.name}
                                </strong>

                                <span>
                                  Category #{category.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="admin-department-pill">
                              {category.departmentName}
                            </span>
                          </td>

                          <td>
                            <span className="admin-structure-description">
                              {category.description ||
                                "No description"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`admin-structure-status ${
                                category.active
                                  ? "active"
                                  : "inactive"
                              }`}
                            >
                              <span />

                              {category.active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="admin-structure-edit-button"
                              onClick={() =>
                                handleEditCategory(category)
                              }
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminDepartmentsPage;