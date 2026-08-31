package com.platform.ai.repository;

import com.platform.ai.entity.AiModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiModelRepository extends JpaRepository<AiModel, Long> {
    Optional<AiModel> findByModelKey(String modelKey);
    List<AiModel> findByBrand(String brand);
    List<AiModel> findByModelType(String modelType);
    List<AiModel> findAllByOrderBySortOrderAscIdAsc();
    List<AiModel> findByEnabledTrueOrderBySortOrderAscIdAsc();
}
