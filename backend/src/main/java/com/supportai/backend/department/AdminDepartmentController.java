package com.supportai.backend.department;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDepartmentController {

    private final DepartmentService departmentService;

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentResponse>>
    getDepartments() {

        return ResponseEntity.ok(
                departmentService.getAllDepartments()
        );
    }

    @PostMapping("/departments")
    public ResponseEntity<DepartmentResponse>
    createDepartment(
            @Valid @RequestBody DepartmentRequest request
    ) {

        return ResponseEntity.ok(
                departmentService.createDepartment(
                        request
                )
        );
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<DepartmentResponse>
    updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentRequest request
    ) {

        return ResponseEntity.ok(
                departmentService.updateDepartment(
                        id,
                        request
                )
        );
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>>
    getCategories() {

        return ResponseEntity.ok(
                departmentService.getAllCategories()
        );
    }

    @GetMapping("/departments/{departmentId}/categories")
    public ResponseEntity<List<CategoryResponse>>
    getCategoriesByDepartment(
            @PathVariable Long departmentId
    ) {

        return ResponseEntity.ok(
                departmentService
                        .getCategoriesByDepartment(
                                departmentId
                        )
        );
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryResponse>
    createCategory(
            @Valid @RequestBody CategoryRequest request
    ) {

        return ResponseEntity.ok(
                departmentService.createCategory(
                        request
                )
        );
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<CategoryResponse>
    updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request
    ) {

        return ResponseEntity.ok(
                departmentService.updateCategory(
                        id,
                        request
                )
        );
    }
}