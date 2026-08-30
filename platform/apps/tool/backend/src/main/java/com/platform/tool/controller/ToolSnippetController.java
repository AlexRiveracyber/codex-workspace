package com.platform.tool.controller;

import com.platform.tool.dto.ApiResponse;
import com.platform.tool.entity.DevToolSnippet;
import com.platform.tool.service.ToolSnippetService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/snippets")
public class ToolSnippetController {

    private final ToolSnippetService snippetService;

    public ToolSnippetController(ToolSnippetService snippetService) {
        this.snippetService = snippetService;
    }

    @GetMapping
    public ApiResponse<List<DevToolSnippet>> listSnippets(
            @RequestParam(required = false, defaultValue = "ALL") String category,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(snippetService.listSnippets(category, keyword));
    }

    @GetMapping("/{id}")
    public ApiResponse<DevToolSnippet> getSnippet(@PathVariable Long id) {
        return snippetService.getSnippetById(id)
                .map(ApiResponse::success)
                .orElseGet(() -> ApiResponse.error(404, "片段不存在"));
    }

    @PostMapping
    public ApiResponse<DevToolSnippet> createSnippet(@RequestBody DevToolSnippet snippet) {
        return ApiResponse.success("创建成功", snippetService.saveSnippet(snippet));
    }

    @PutMapping("/{id}")
    public ApiResponse<DevToolSnippet> updateSnippet(@PathVariable Long id, @RequestBody DevToolSnippet snippet) {
        snippet.setId(id);
        return ApiResponse.success("更新成功", snippetService.saveSnippet(snippet));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteSnippet(@PathVariable Long id) {
        snippetService.deleteSnippet(id);
        return ApiResponse.success("删除成功", null);
    }

    @PostMapping("/{id}/toggle-pin")
    public ApiResponse<DevToolSnippet> togglePin(@PathVariable Long id) {
        return ApiResponse.success("操作成功", snippetService.togglePin(id));
    }
}
