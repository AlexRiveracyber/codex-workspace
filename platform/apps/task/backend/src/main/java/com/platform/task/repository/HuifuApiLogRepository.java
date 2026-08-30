package com.platform.task.repository;

import com.platform.task.entity.HuifuApiLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HuifuApiLogRepository extends JpaRepository<HuifuApiLog, Long> {
    List<HuifuApiLog> findTop100ByOrderByCreatedAtDesc();
    List<HuifuApiLog> findByHuifuIdOrderByCreatedAtDesc(String huifuId);
    List<HuifuApiLog> findByApplyIdOrderByCreatedAtDesc(String applyId);
}
