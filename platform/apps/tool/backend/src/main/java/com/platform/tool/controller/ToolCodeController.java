package com.platform.tool.controller;

import com.platform.tool.dto.ApiResponse;
import com.platform.tool.dto.CodeDTOs.*;
import com.platform.tool.service.ToolCodeService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/code")
public class ToolCodeController {

    private final ToolCodeService codeService;

    public ToolCodeController(ToolCodeService codeService) {
        this.codeService = codeService;
    }

    @PostMapping("/json-to-java")
    public ApiResponse<CodeResponse> jsonToJava(@RequestBody JsonToJavaRequest req) {
        return ApiResponse.success(codeService.convertJsonToJava(req));
    }

    @PostMapping("/sql-to-entity")
    public ApiResponse<CodeResponse> sqlToEntity(@RequestBody SqlToEntityRequest req) {
        return ApiResponse.success(codeService.convertSqlToEntity(req));
    }

    @PostMapping("/sql-format")
    public ApiResponse<String> sqlFormat(@RequestBody SqlFormatRequest req) {
        return ApiResponse.success("格式化成功", codeService.formatSql(req));
    }
}
