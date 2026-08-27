package com.supportai.backend.department;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryRequest {

    @NotBlank
    private String name;

    private String description;

    @NotNull
    private Long departmentId;

    private Boolean active;
}
