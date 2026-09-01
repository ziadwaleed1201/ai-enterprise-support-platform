package com.supportai.backend.department;

import com.supportai.backend.exception.ConflictException;
import com.supportai.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final CategoryRepository categoryRepository;

    public List<DepartmentResponse> getAllDepartments() {

        return departmentRepository.findAll()
                .stream()
                .map(this::mapDepartment)
                .toList();
    }

    @Transactional
    public DepartmentResponse createDepartment(
            DepartmentRequest request
    ) {

        departmentRepository
                .findByName(request.getName())
                .ifPresent(department -> {
                    throw new ConflictException(
                            "Department already exists"
                    );
                });

        Department department =
                Department.builder()
                        .name(request.getName())
                        .description(
                                request.getDescription()
                        )
                        .active(
                                request.getActive() == null
                                        || request.getActive()
                        )
                        .build();

        return mapDepartment(
                departmentRepository.save(
                        department
                )
        );
    }

    @Transactional
    public DepartmentResponse updateDepartment(
            Long id,
            DepartmentRequest request
    ) {

        Department department =
                departmentRepository.findById(id)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Department not found"
                                )
                        );

        department.setName(
                request.getName()
        );

        department.setDescription(
                request.getDescription()
        );

        if (request.getActive() != null) {

            department.setActive(
                    request.getActive()
            );
        }

        return mapDepartment(
                departmentRepository.save(
                        department
                )
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

        if (!departmentRepository.existsById(
                departmentId
        )) {

            throw new ResourceNotFoundException(
                    "Department not found"
            );
        }

        return categoryRepository
                .findByDepartmentId(
                        departmentId
                )
                .stream()
                .map(this::mapCategory)
                .toList();
    }

    @Transactional
    public CategoryResponse createCategory(
            CategoryRequest request
    ) {

        Department department =
                departmentRepository
                        .findById(
                                request.getDepartmentId()
                        )
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Department not found"
                                )
                        );

        Category category =
                Category.builder()
                        .name(
                                request.getName()
                        )
                        .description(
                                request.getDescription()
                        )
                        .department(
                                department
                        )
                        .active(
                                request.getActive() == null
                                        || request.getActive()
                        )
                        .build();

        return mapCategory(
                categoryRepository.save(
                        category
                )
        );
    }

    @Transactional
    public CategoryResponse updateCategory(
            Long id,
            CategoryRequest request
    ) {

        Category category =
                categoryRepository.findById(id)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Category not found"
                                )
                        );

        Department department =
                departmentRepository
                        .findById(
                                request.getDepartmentId()
                        )
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Department not found"
                                )
                        );

        category.setName(
                request.getName()
        );

        category.setDescription(
                request.getDescription()
        );

        category.setDepartment(
                department
        );

        if (request.getActive() != null) {

            category.setActive(
                    request.getActive()
            );
        }

        return mapCategory(
                categoryRepository.save(
                        category
                )
        );
    }

    private DepartmentResponse mapDepartment(
            Department department
    ) {

        return DepartmentResponse.builder()
                .id(
                        department.getId()
                )
                .name(
                        department.getName()
                )
                .description(
                        department.getDescription()
                )
                .active(
                        department.isActive()
                )
                .build();
    }

    private CategoryResponse mapCategory(
            Category category
    ) {

        return CategoryResponse.builder()
                .id(
                        category.getId()
                )
                .name(
                        category.getName()
                )
                .description(
                        category.getDescription()
                )
                .active(
                        category.isActive()
                )
                .departmentId(
                        category.getDepartment()
                                .getId()
                )
                .departmentName(
                        category.getDepartment()
                                .getName()
                )
                .build();
    }
}