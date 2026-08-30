package com.platform.tool.service;

import com.platform.tool.dto.TimeDTOs.*;
import org.apache.commons.lang3.StringUtils;
import org.quartz.CronExpression;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class ToolTimeService {

    public CronParseResponse parseCron(CronParseRequest req) {
        String cron = req.getCron();
        if (StringUtils.isBlank(cron)) {
            return CronParseResponse.builder()
                    .valid(false)
                    .errorMessage("Cron 表达式不能为空")
                    .build();
        }

        try {
            CronExpression cronExp = new CronExpression(cron.trim());
            List<String> nextExecutions = new ArrayList<>();
            Date current = new Date();
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

            int count = req.getCount() > 0 ? Math.min(req.getCount(), 20) : 10;
            for (int i = 0; i < count; i++) {
                Date next = cronExp.getNextValidTimeAfter(current);
                if (next == null) break;
                nextExecutions.add(sdf.format(next));
                current = next;
            }

            return CronParseResponse.builder()
                    .valid(true)
                    .description(cronExp.getCronExpression() + " (时区: " + cronExp.getTimeZone().getID() + ")")
                    .nextExecutions(nextExecutions)
                    .build();
        } catch (Exception e) {
            return CronParseResponse.builder()
                    .valid(false)
                    .errorMessage("Cron 语法错误: " + e.getMessage())
                    .build();
        }
    }
}
