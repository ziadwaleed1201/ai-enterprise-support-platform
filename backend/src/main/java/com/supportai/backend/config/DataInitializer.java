package com.supportai.backend.config;

import com.supportai.backend.department.Category;
import com.supportai.backend.department.CategoryRepository;
import com.supportai.backend.department.Department;
import com.supportai.backend.department.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {

        if (departmentRepository.count() > 0) {
            return;
        }

        Department it = departmentRepository.save(
                Department.builder()
                        .name("IT")
                        .description("Information Technology support")
                        .active(true)
                        .build()
        );

        Department hr = departmentRepository.save(
                Department.builder()
                        .name("HR")
                        .description("Human Resources support")
                        .active(true)
                        .build()
        );

        Department finance = departmentRepository.save(
                Department.builder()
                        .name("Finance")
                        .description("Finance support")
                        .active(true)
                        .build()
        );

        Department administration = departmentRepository.save(
                Department.builder()
                        .name("Administration")
                        .description("Administrative support")
                        .active(true)
                        .build()
        );

        categoryRepository.saveAll(List.of(

                Category.builder().name("Laptop Issue").department(it).active(true).build(),
                Category.builder().name("Software Access").department(it).active(true).build(),
                Category.builder().name("Email Issue").department(it).active(true).build(),
                Category.builder().name("Network Issue").department(it).active(true).build(),
                Category.builder().name("Other").department(it).active(true).build(),

                Category.builder().name("Leave").department(hr).active(true).build(),
                Category.builder().name("Payroll").department(hr).active(true).build(),
                Category.builder().name("HR Letter").department(hr).active(true).build(),
                Category.builder().name("Benefits").department(hr).active(true).build(),
                Category.builder().name("Other").department(hr).active(true).build(),

                Category.builder().name("Expense").department(finance).active(true).build(),
                Category.builder().name("Reimbursement").department(finance).active(true).build(),
                Category.builder().name("Invoice").department(finance).active(true).build(),
                Category.builder().name("Other").department(finance).active(true).build(),

                Category.builder().name("Access Card").department(administration).active(true).build(),
                Category.builder().name("Office Request").department(administration).active(true).build(),
                Category.builder().name("Other").department(administration).active(true).build()
        ));
    }
}