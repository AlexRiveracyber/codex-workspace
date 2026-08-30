package com.platform.repository;

import com.platform.entity.AppTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppTemplateRepository extends JpaRepository<AppTemplate, Long> {
    Optional<AppTemplate> findByTemplateKey(String templateKey);
    List<AppTemplate> findByCategory(String category);
}
