package com.supportai.backend.department;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final CategoryRepository categoryRepository;

    public List<DepartmentResponse> getAllDepartments() {

        return departmentRepository.findAll()
                .stream()
                .map(this::mapDepartment)
                .toList();
    }

    public DepartmentResponse createDepartment(
            DepartmentRequest request
    ) {

        departmentRepository.findByName(request.getName())
                .ifPresent(department -> {
                    throw new RuntimeException(
                            "Department already exists"
                    );
                });

        Department department = Department.builder()
                .name(request.getName())
                .description(request.getDescription())
                .active(
                        request.getActive() == null
                                || request.getActive()
                )
                .build();

        return mapDepartment(
                departmentRepository.save(department)
        );
    }

    public DepartmentResponse updateDepartment(
            Long id,
            DepartmentRequest request
    ) {

        Department department =
                departmentRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Department not found"
                                )
                        );

        department.setName(request.getName());
        department.setDescription(
                request.getDescription()
        );

        if (request.getActive() != null) {
            department.setActive(
                    request.getActive()
            );
        }

        return mapDepartment(
                departmentRepository.save(department)
        );
    }

    public List<CategoryResponse> getAllCategories() {

        return categoryRepository.findAll()
                .stream()
                .map(this::mapCategory)
                .toList();
    }

    public List<CategoryResponse> getCategoriesByDepartment(
            Long departmentId
    ) {

        return categoryRepository
                .findByDepartmentId(departmentId)
                .stream()
                .map(this::mapCategory)
                .toList();
    }

    public CategoryResponse createCategory(
            CategoryRequest request
    ) {

        Department department =
                departmentRepository
                        .findById(request.getDepartmentId())
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Department not found"
                                )
                        );

        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .department(department)
                .active(
                        request.getActive() == null
                                || request.getActive()
                )
                .build();

        return mapCategory(
                categoryRepository.save(category)
        );
    }

    public CategoryResponse updateCategory(
            Long id,
            CategoryRequest request
    ) {

        Category category =
                categoryRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Category not found"
                                )
                        );

        Department department =
                departmentRepository
                        .findById(request.getDepartmentId())
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Department not found"
                                )
                        );

        category.setName(request.getName());
        category.setDescription(
                request.getDescription()
        );
        category.setDepartment(department);

        if (request.getActive() != null) {
            category.setActive(
                    request.getActive()
            );
        }

        return mapCategory(
                categoryRepository.save(category)
        );
    }

    private DepartmentResponse mapDepartment(
            Department department
    ) {

        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .description(
                        department.getDescription()
                )
                .active(department.isActive())
                .build();
    }

    private CategoryResponse mapCategory(
            Category category
    ) {

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(
                        category.getDescription()
                )
                .active(category.isActive())
                .departmentId(
                        category.getDepartment().getId()
                )
                .departmentName(
                        category.getDepartment().getName()
                )
                .build();
    }
}