package com.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DockerContainerDTO {
    private String id;
    private String name;
    private String image;
    private String status;
    private String state; // running, exited, created, etc.
    private String ports;
    private String created;
    private boolean isManaged;
    private Long managedAppId;
}
