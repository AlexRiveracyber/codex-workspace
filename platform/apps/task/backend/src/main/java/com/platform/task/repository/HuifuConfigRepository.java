package com.platform.task.repository;

import com.platform.task.entity.HuifuConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HuifuConfigRepository extends JpaRepository<HuifuConfig, Long> {
    List<HuifuConfig> findAllByOrderByIdDesc();
    Optional<HuifuConfig> findFirstByIsDefaultTrue();
    Optional<HuifuConfig> findFirstByOrderByIdDesc();
    Optional<HuifuConfig> findFirstBySysId(String sysId);
}
