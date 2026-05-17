package com.eva.crm.dto;

import lombok.Data;

@Data
public class UserCreateDTO {
    private String fullName;
    private String username;
    private String password;
}
