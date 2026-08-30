package com.platform.tool.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

public class CodeDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JsonToJavaRequest {
        private String json;
        private String className = "RootEntity";
        private String packageName = "com.example.model";
        private boolean useLombok = true;
        private boolean useJackson = true;
        private boolean useSwagger = false;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SqlToEntityRequest {
        private String ddl;
        private String packageName = "com.example.entity";
        private boolean useLombok = true;
        private boolean useJpa = true;
        private boolean useMyBatisPlus = false;
        private boolean useSwagger = false;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeResponse {
        private String code;
        private String language;
        private String className;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SqlFormatRequest {
        private String sql;
        private String dialect = "mysql"; // mysql, postgresql, oracle
        private boolean uppercase = true;
    }
}
