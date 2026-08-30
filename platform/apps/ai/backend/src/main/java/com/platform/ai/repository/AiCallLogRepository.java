package com.platform.ai.repository;

import com.platform.ai.entity.AiCallLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiCallLogRepository extends JpaRepository<AiCallLog, Long> {
    List<AiCallLog> findTop100ByOrderByCreatedAtDesc();
    List<AiCallLog> findByCallTypeOrderByCreatedAtDesc(String callType);

    @Query("SELECT COUNT(l) FROM AiCallLog l")
    long countTotalCalls();

    @Query("SELECT COUNT(l) FROM AiCallLog l WHERE l.status = 'SUCCESS'")
    long countSuccessCalls();

    @Query("SELECT COALESCE(SUM(l.tokensPrompt + l.tokensCompletion), 0) FROM AiCallLog l")
    long sumTotalTokens();

    @Query("SELECT COALESCE(AVG(l.latencyMs), 0) FROM AiCallLog l WHERE l.status = 'SUCCESS'")
    double avgLatencyMs();
}
