package com.supportai.backend.department;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DepartmentResponse {

    private Long id;
    private String name;
    private String description;
    private boolean active;
}