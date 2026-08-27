package com.supportai.backend.ticket;

import org.springframework.data.jpa.domain.Specification;

public class TicketSpecification {

    private TicketSpecification() {
    }

    public static Specification<Ticket> hasStatus(
            TicketStatus status
    ) {
        return (root, query, criteriaBuilder) -> {

            if (status == null) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.equal(
                    root.get("status"),
                    status
            );
        };
    }

    public static Specification<Ticket> hasPriority(
            TicketPriority priority
    ) {
        return (root, query, criteriaBuilder) -> {

            if (priority == null) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.equal(
                    root.get("priority"),
                    priority
            );
        };
    }

    public static Specification<Ticket> hasDepartment(
            Long departmentId
    ) {
        return (root, query, criteriaBuilder) -> {

            if (departmentId == null) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.equal(
                    root.get("department").get("id"),
                    departmentId
            );
        };
    }

    public static Specification<Ticket> assignedTo(
            String agentEmail
    ) {
        return (root, query, criteriaBuilder) -> {

            if (agentEmail == null || agentEmail.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.equal(
                    root.get("assignedAgent").get("email"),
                    agentEmail
            );
        };
    }

    public static Specification<Ticket> createdBy(
            String employeeEmail
    ) {
        return (root, query, criteriaBuilder) -> {

            if (employeeEmail == null || employeeEmail.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.equal(
                    root.get("createdBy").get("email"),
                    employeeEmail
            );
        };
    }

    public static Specification<Ticket> containsSearchText(
            String search
    ) {
        return (root, query, criteriaBuilder) -> {

            if (search == null || search.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            String value =
                    "%" + search.toLowerCase() + "%";

            return criteriaBuilder.or(
                    criteriaBuilder.like(
                            criteriaBuilder.lower(
                                    root.get("title")
                            ),
                            value
                    ),
                    criteriaBuilder.like(
                            criteriaBuilder.lower(
                                    root.get("description")
                            ),
                            value
                    )
            );
        };
    }
}