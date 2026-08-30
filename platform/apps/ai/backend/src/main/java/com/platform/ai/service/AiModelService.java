package com.platform.ai.service;

import com.platform.ai.entity.AiModel;
import com.platform.ai.repository.AiModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiModelService {

    private final AiModelRepository modelRepository;

    public List<AiModel> getModels(String brand, String capability, String modelType, Boolean enabledOnly) {
        List<AiModel> list = Boolean.TRUE.equals(enabledOnly)
                ? modelRepository.findByEnabledTrueOrderBySortOrderAscIdAsc()
                : modelRepository.findAllByOrderBySortOrderAscIdAsc();

        return list.stream().filter(m -> {
            if (brand != null && !brand.isBlank() && !"ALL".equalsIgnoreCase(brand)) {
                if (!brand.equalsIgnoreCase(m.getBrand())) return false;
            }
            if (modelType != null && !modelType.isBlank() && !"ALL".equalsIgnoreCase(modelType)) {
                if (!modelType.equalsIgnoreCase(m.getModelType())) return false;
            }
            if (capability != null && !capability.isBlank() && !"ALL".equalsIgnoreCase(capability)) {
                if (m.getCapabilities() == null || !m.getCapabilities().contains(capability)) return false;
            }
            return true;
        }).collect(Collectors.toList());
    }

    public Optional<AiModel> getModelByKey(String modelKey) {
        return modelRepository.findByModelKey(modelKey);
    }

    public AiModel saveModel(AiModel model) {
        return modelRepository.save(model);
    }

    public void deleteModel(Long id) {
        modelRepository.deleteById(id);
    }

    public AiModel toggleEnabled(Long id) {
        AiModel m = modelRepository.findById(id).orElseThrow(() -> new RuntimeException("Model not found"));
        m.setEnabled(!Boolean.TRUE.equals(m.getEnabled()));
        return modelRepository.save(m);
    }
}
