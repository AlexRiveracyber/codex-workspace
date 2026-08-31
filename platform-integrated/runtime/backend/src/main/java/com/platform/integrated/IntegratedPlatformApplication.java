package com.platform.integrated;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.FullyQualifiedAnnotationBeanNameGenerator;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(
        basePackages = "com.platform",
        nameGenerator = FullyQualifiedAnnotationBeanNameGenerator.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.REGEX,
                pattern = "com\\.platform\\.(ai|tool)\\.config\\.CorsConfig"
        )
)
@EntityScan(basePackages = "com.platform")
@EnableJpaRepositories(basePackages = "com.platform")
public class IntegratedPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(IntegratedPlatformApplication.class, args);
    }
}
