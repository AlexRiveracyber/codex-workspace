package com.platform.task.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;

@Slf4j
@Service
public class ExcelParseService {

    public List<String> extractHuifuIds(MultipartFile file) throws Exception {
        Set<String> huifuIds = new LinkedHashSet<>();
        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                return Collections.emptyList();
            }

            int huifuIdColIndex = -1;
            boolean firstRow = true;

            for (Row row : sheet) {
                if (row == null) continue;

                if (firstRow) {
                    firstRow = false;
                    // Scan header to find column named "huifu_id", "商户号", "汇付商户号", "商户ID", "ID"
                    for (Cell cell : row) {
                        String header = getCellValueAsString(cell).trim().toLowerCase();
                        if (header.contains("huifu_id") || header.contains("huifuid") || header.contains("商户号") || header.contains("汇付号") || header.contains("商户id")) {
                            huifuIdColIndex = cell.getColumnIndex();
                            break;
                        }
                    }
                    if (huifuIdColIndex != -1) {
                        continue; // found header in row 0, skip to next row
                    } else {
                        // Fallback: if row 0 first cell looks like a number/ID, treat as data row 0 and check all columns
                        huifuIdColIndex = 0;
                    }
                }

                // Extract cell value
                Cell cell = row.getCell(huifuIdColIndex);
                String val = getCellValueAsString(cell).trim();
                if (StringUtils.isNotBlank(val) && !val.equalsIgnoreCase("huifu_id") && !val.contains("商户号")) {
                    // Handle comma or newline separated values in single cell
                    for (String item : val.split("[,;\r\n\t ]+")) {
                        String clean = item.trim();
                        if (StringUtils.isNotBlank(clean)) {
                            huifuIds.add(clean);
                        }
                    }
                }
            }
        }
        return new ArrayList<>(huifuIds);
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getDateCellValue().toString();
                }
                // Check if numeric has trailing .0 (e.g. 6666000109814432)
                double num = cell.getNumericCellValue();
                if (num == Math.floor(num)) {
                    yield String.format(Locale.ROOT, "%.0f", num);
                }
                yield String.valueOf(num);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield cell.getStringCellValue();
                } catch (Exception e) {
                    yield String.valueOf(cell.getNumericCellValue());
                }
            }
            default -> "";
        };
    }
}
