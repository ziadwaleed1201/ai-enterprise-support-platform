package com.supportai.backend.department;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentResponse>> getDepartments() {

        return ResponseEntity.ok(
                departmentService.getAllDepartments()
        );
    }

    @GetMapping("/categories/department/{departmentId}")
    public ResponseEntity<List<CategoryResponse>> getCategoriesByDepartment(
            @PathVariable Long departmentId
    ) {

        return ResponseEntity.ok(
                departmentService.getCategoriesByDepartment(
                        departmentId
                )
        );
    }
}