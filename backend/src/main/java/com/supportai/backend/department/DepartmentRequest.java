package com.supportai.backend.department;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepartmentRequest {

    @NotBlank
    private String name;

    private String description;

    private Boolean active;
}