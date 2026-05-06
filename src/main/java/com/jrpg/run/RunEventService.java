package com.jrpg.run;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jrpg.entity.RunEvent;
import com.jrpg.repository.RunEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class RunEventService {

    public static final String RUN_STARTED       = "RUN_STARTED";
    public static final String FIGHT_STARTED     = "FIGHT_STARTED";
    public static final String COMBAT_ACTION     = "COMBAT_ACTION";
    public static final String STATUS_APPLIED    = "STATUS_APPLIED";
    public static final String STATUS_EXPIRED    = "STATUS_EXPIRED";
    public static final String ITEM_USED         = "ITEM_USED";
    public static final String LOOT_ASSIGNED     = "LOOT_ASSIGNED";
    public static final String PREP_PHASE_STARTED = "PREP_PHASE_STARTED";
    public static final String PREP_ACTION       = "PREP_ACTION";
    public static final String AUTO_REVIVE       = "AUTO_REVIVE";
    public static final String RUN_ENDED         = "RUN_ENDED";

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final RunEventRepository runEventRepository;
    private final ObjectMapper objectMapper;

    /**
     * Serializes payload to JSON, enriches with playerUuid and timestamp, persists as RunEvent.
     */
    public void logEvent(UUID runUuid, UUID playerUuid, String eventType, Object payload) {
        RunEvent event = new RunEvent();
        event.setRunUuid(runUuid);
        event.setEventType(eventType);
        LocalDateTime now = LocalDateTime.now();
        event.setOccurredAt(now);

        try {
            Map<String, Object> enriched = objectMapper.convertValue(payload, MAP_TYPE);
            enriched.put("playerUuid", playerUuid.toString());
            enriched.put("timestamp", now.toString());
            event.setPayload(objectMapper.writeValueAsString(enriched));
        } catch (Exception e) {
            log.warn("Failed to serialize event payload for run {} [{}]: {}", runUuid, eventType, e.getMessage());
            event.setPayload("{}");
        }

        runEventRepository.save(event);
        log.info("RunEvent [{}] saved for run {}", eventType, runUuid);
    }

    public List<RunEvent> getEventsForRun(UUID runUuid) {
        return runEventRepository.findByRunUuidOrderByOccurredAtAsc(runUuid);
    }
}
