package com.platform.integrated;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({
            "/", "/dashboard", "/apps", "/containers", "/templates",
            "/subapps/task", "/subapps/ai", "/subapps/tool", "/logs", "/settings"
    })
    public String platform() {
        return "forward:/index.html";
    }

    @GetMapping({"/task", "/task/"})
    public String task() {
        return "forward:/task/index.html";
    }

    @GetMapping({"/ai", "/ai/"})
    public String ai() {
        return "forward:/ai/index.html";
    }

    @GetMapping({"/tool", "/tool/"})
    public String tool() {
        return "forward:/tool/index.html";
    }
}
