package com.supportai.backend.department;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CategoryResponse {

    private Long id;
    private String name;
    private String description;
    private boolean active;

    private Long departmentId;
    private String departmentName;
}