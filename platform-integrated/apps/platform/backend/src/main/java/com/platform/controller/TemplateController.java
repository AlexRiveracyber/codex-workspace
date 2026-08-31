package com.platform.controller;

import com.platform.dto.ApiResponse;
import com.platform.dto.AppDTO;
import com.platform.dto.DeployTemplateRequest;
import com.platform.entity.AppTemplate;
import com.platform.repository.AppTemplateRepository;
import com.platform.service.AppService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final AppTemplateRepository templateRepository;
    private final AppService appService;

    @GetMapping
    public ApiResponse<List<AppTemplate>> getAllTemplates() {
        return ApiResponse.ok(templateRepository.findAll());
    }

    @PostMapping("/deploy")
    public ApiResponse<AppDTO> deployTemplate(@Valid @RequestBody DeployTemplateRequest request) {
        return ApiResponse.ok("Application deployed from template successfully", appService.deployTemplate(request));
    }
}
