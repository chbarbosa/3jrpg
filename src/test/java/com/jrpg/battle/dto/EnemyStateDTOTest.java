package com.jrpg.battle.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EnemyStateDTOTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void hidesExactHpAndScanDataWhenCyberEyeIsAbsent() throws Exception {
        EnemyStateDTO dto = new EnemyStateDTO(
                "enemy-1",
                "Tech Soldier",
                "MECHANICAL",
                null,
                null,
                null,
                false,
                null,
                null,
                List.of());

        String json = objectMapper.writeValueAsString(dto);

        assertThat(json).doesNotContain("\"hp\":");
        assertThat(json).doesNotContain("\"maxHp\":");
        assertThat(json).doesNotContain("\"hpPercent\":");
        assertThat(json).doesNotContain("\"weaknesses\":");
        assertThat(json).doesNotContain("\"elementalImmunity\":");
    }
}
