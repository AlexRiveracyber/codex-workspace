package com.platform.integrated;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/integrated")
public class IntegratedModuleController {

    @GetMapping("/modules")
    public List<ModuleInfo> modules() {
        return List.of(
                new ModuleInfo("platform", "Platform Control OS", "/", "/api"),
                new ModuleInfo("task", "Task Flow", "/task/", "/api/tasks, /api/huifu"),
                new ModuleInfo("ai", "Lumen AI", "/ai/", "/api/ai"),
                new ModuleInfo("tool", "DevTools", "/tool/", "/api/code, /api/crypto, /api/network, /api/snippets, /api/time")
        );
    }

    public record ModuleInfo(String key, String name, String uiPath, String apiPrefix) {}
}
