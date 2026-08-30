package com.platform.tool.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.platform.tool.dto.CodeDTOs.*;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ToolCodeService {

    public CodeResponse convertJsonToJava(JsonToJavaRequest req) {
        String jsonStr = req.getJson();
        if (StringUtils.isBlank(jsonStr)) {
            throw new IllegalArgumentException("JSON 字符串不能为空");
        }

        Object parsed = JSON.parse(jsonStr);
        StringBuilder sb = new StringBuilder();

        if (StringUtils.isNotBlank(req.getPackageName())) {
            sb.append("package ").append(req.getPackageName()).append(";\n\n");
        }

        // Imports
        Set<String> imports = new TreeSet<>();
        if (req.isUseLombok()) {
            imports.add("import lombok.Data;");
            imports.add("import lombok.Builder;");
            imports.add("import lombok.NoArgsConstructor;");
            imports.add("import lombok.AllArgsConstructor;");
        }
        if (req.isUseJackson()) {
            imports.add("import com.fasterxml.jackson.annotation.JsonProperty;");
        }
        imports.add("import java.util.List;");
        imports.add("import java.util.Map;");

        for (String imp : imports) {
            sb.append(imp).append("\n");
        }
        sb.append("\n");

        if (parsed instanceof JSONObject jsonObject) {
            generateClass(sb, req.getClassName(), jsonObject, req);
        } else if (parsed instanceof JSONArray jsonArray) {
            if (!jsonArray.isEmpty() && jsonArray.get(0) instanceof JSONObject itemObj) {
                generateClass(sb, req.getClassName(), itemObj, req);
            } else {
                sb.append("// JSON 根节点为基础类型数组: List<Object>\n");
            }
        }

        return CodeResponse.builder()
                .code(sb.toString())
                .language("java")
                .className(req.getClassName())
                .build();
    }

    private void generateClass(StringBuilder sb, String className, JSONObject obj, JsonToJavaRequest req) {
        if (req.isUseLombok()) {
            sb.append("@Data\n");
            sb.append("@Builder\n");
            sb.append("@NoArgsConstructor\n");
            sb.append("@AllArgsConstructor\n");
        }
        sb.append("public class ").append(capitalize(className)).append(" {\n");

        Map<String, JSONObject> nestedObjects = new LinkedHashMap<>();

        for (Map.Entry<String, Object> entry : obj.entrySet()) {
            String key = entry.getKey();
            Object val = entry.getValue();
            String fieldName = toCamelCase(key);
            String javaType = inferJavaType(key, val, nestedObjects);

            if (req.isUseJackson() && !key.equals(fieldName)) {
                sb.append("    @JsonProperty(\"").append(key).append("\")\n");
            }
            sb.append("    private ").append(javaType).append(" ").append(fieldName).append(";\n");
        }

        sb.append("}\n\n");

        // Generate nested inner classes
        for (Map.Entry<String, JSONObject> nested : nestedObjects.entrySet()) {
            generateClass(sb, nested.getKey(), nested.getValue(), req);
        }
    }

    private String inferJavaType(String key, Object val, Map<String, JSONObject> nestedObjects) {
        if (val == null) return "Object";
        if (val instanceof Boolean) return "Boolean";
        if (val instanceof Integer) return "Integer";
        if (val instanceof Long) return "Long";
        if (val instanceof Double || val instanceof Float) return "Double";
        if (val instanceof String) return "String";
        if (val instanceof JSONObject jsonObj) {
            String nestedClassName = capitalize(toCamelCase(key)) + "DTO";
            nestedObjects.put(nestedClassName, jsonObj);
            return nestedClassName;
        }
        if (val instanceof JSONArray arr) {
            if (arr.isEmpty()) return "List<Object>";
            Object first = arr.get(0);
            if (first instanceof JSONObject firstObj) {
                String nestedClassName = capitalize(toCamelCase(key)) + "ItemDTO";
                nestedObjects.put(nestedClassName, firstObj);
                return "List<" + nestedClassName + ">";
            }
            return "List<" + inferJavaType(key, first, nestedObjects) + ">";
        }
        return "Object";
    }

    public CodeResponse convertSqlToEntity(SqlToEntityRequest req) {
        String ddl = req.getDdl();
        if (StringUtils.isBlank(ddl)) {
            throw new IllegalArgumentException("SQL DDL 不能为空");
        }

        // Extract table name
        String tableName = "my_table";
        Pattern tablePattern = Pattern.compile("CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?`?([a-zA-Z0-9_]+)`?", Pattern.CASE_INSENSITIVE);
        Matcher tableMatcher = tablePattern.matcher(ddl);
        if (tableMatcher.find()) {
            tableName = tableMatcher.group(1);
        }
        String className = capitalize(toCamelCase(tableName));

        StringBuilder sb = new StringBuilder();
        if (StringUtils.isNotBlank(req.getPackageName())) {
            sb.append("package ").append(req.getPackageName()).append(";\n\n");
        }

        if (req.isUseLombok()) {
            sb.append("import lombok.Data;\nimport lombok.Builder;\nimport lombok.NoArgsConstructor;\nimport lombok.AllArgsConstructor;\n");
        }
        if (req.isUseJpa()) {
            sb.append("import jakarta.persistence.*;\n");
        }
        if (req.isUseMyBatisPlus()) {
            sb.append("import com.baomidou.mybatisplus.annotation.*;\n");
        }
        sb.append("import java.time.LocalDateTime;\nimport java.math.BigDecimal;\n\n");

        if (req.isUseLombok()) {
            sb.append("@Data\n@Builder\n@NoArgsConstructor\n@AllArgsConstructor\n");
        }
        if (req.isUseJpa()) {
            sb.append("@Entity\n@Table(name = \"").append(tableName).append("\")\n");
        }
        if (req.isUseMyBatisPlus()) {
            sb.append("@TableName(\"").append(tableName).append("\")\n");
        }
        sb.append("public class ").append(className).append(" {\n");

        // Parse columns
        Pattern colPattern = Pattern.compile("^\\s*`?([a-zA-Z0-9_]+)`?\\s+([a-zA-Z0-9_()]+)(.*)$", Pattern.MULTILINE);
        Matcher colMatcher = colPattern.matcher(ddl);

        while (colMatcher.find()) {
            String colName = colMatcher.group(1);
            String colType = colMatcher.group(2).toUpperCase();
            String rest = colMatcher.group(3);

            if (colName.equalsIgnoreCase("PRIMARY") || colName.equalsIgnoreCase("KEY") ||
                    colName.equalsIgnoreCase("UNIQUE") || colName.equalsIgnoreCase("CONSTRAINT") ||
                    colName.equalsIgnoreCase("INDEX")) {
                continue;
            }

            String fieldName = toCamelCase(colName);
            String javaType = sqlToJavaType(colType);

            // Extract comment
            String comment = "";
            Pattern commentPattern = Pattern.compile("COMMENT\\s+'([^']+)'", Pattern.CASE_INSENSITIVE);
            Matcher commentMatcher = commentPattern.matcher(rest);
            if (commentMatcher.find()) {
                comment = commentMatcher.group(1);
            }

            if (StringUtils.isNotBlank(comment)) {
                sb.append("    /**\n     * ").append(comment).append("\n     */\n");
            }

            if (colName.equalsIgnoreCase("id") || rest.toUpperCase().contains("PRIMARY KEY") || rest.toUpperCase().contains("AUTO_INCREMENT")) {
                if (req.isUseJpa()) {
                    sb.append("    @Id\n");
                    if (rest.toUpperCase().contains("AUTO_INCREMENT")) {
                        sb.append("    @GeneratedValue(strategy = GenerationType.IDENTITY)\n");
                    }
                }
                if (req.isUseMyBatisPlus()) {
                    sb.append("    @TableId(type = IdType.AUTO)\n");
                }
            } else {
                if (req.isUseJpa()) {
                    sb.append("    @Column(name = \"").append(colName).append("\")\n");
                }
                if (req.isUseMyBatisPlus()) {
                    sb.append("    @TableField(\"").append(colName).append("\")\n");
                }
            }

            sb.append("    private ").append(javaType).append(" ").append(fieldName).append(";\n\n");
        }

        sb.append("}\n");

        return CodeResponse.builder()
                .code(sb.toString())
                .language("java")
                .className(className)
                .build();
    }

    public String formatSql(SqlFormatRequest req) {
        String sql = req.getSql();
        if (StringUtils.isBlank(sql)) return "";

        String[] keywords = {"SELECT", "FROM", "WHERE", "AND", "OR", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "JOIN",
                "ON", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM"};

        String formatted = sql.replaceAll("\\s+", " ").trim();
        for (String kw : keywords) {
            formatted = formatted.replaceAll("(?i)\\b" + kw + "\\b", "\n" + (req.isUppercase() ? kw : kw.toLowerCase()));
        }

        return formatted.trim();
    }

    private String sqlToJavaType(String sqlType) {
        if (sqlType.startsWith("BIGINT")) return "Long";
        if (sqlType.startsWith("INT") || sqlType.startsWith("TINYINT") || sqlType.startsWith("SMALLINT")) return "Integer";
        if (sqlType.startsWith("VARCHAR") || sqlType.startsWith("CHAR") || sqlType.startsWith("TEXT") || sqlType.startsWith("LONGTEXT")) return "String";
        if (sqlType.startsWith("DATETIME") || sqlType.startsWith("TIMESTAMP")) return "LocalDateTime";
        if (sqlType.startsWith("DATE")) return "LocalDate";
        if (sqlType.startsWith("DECIMAL") || sqlType.startsWith("NUMERIC")) return "BigDecimal";
        if (sqlType.startsWith("DOUBLE") || sqlType.startsWith("FLOAT")) return "Double";
        if (sqlType.startsWith("BOOLEAN") || sqlType.startsWith("BIT")) return "Boolean";
        return "String";
    }

    private String toCamelCase(String s) {
        if (StringUtils.isBlank(s)) return s;
        StringBuilder result = new StringBuilder();
        boolean capitalizeNext = false;
        for (char c : s.toCharArray()) {
            if (c == '_' || c == '-' || c == ' ') {
                capitalizeNext = true;
            } else if (capitalizeNext) {
                result.append(Character.toUpperCase(c));
                capitalizeNext = false;
            } else {
                result.append(c);
            }
        }
        if (result.length() > 0) {
            result.setCharAt(0, Character.toLowerCase(result.charAt(0)));
        }
        return result.toString();
    }

    private String capitalize(String s) {
        if (StringUtils.isBlank(s)) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
