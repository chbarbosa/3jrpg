package com.jrpg.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "runs")
@Getter
@Setter
public class Run {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    private UUID uuid;

    private UUID playerUuid;
    private UUID seasonUuid;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private int fightsSurvived;

    @Column(columnDefinition = "TEXT")
    private String teamSnapshot;

    private LocalDateTime lastActionAt;

    @Enumerated(EnumType.STRING)
    private EndReason endReason;

    @PrePersist
    protected void onCreate() {
        uuid = UUID.randomUUID();
    }
}
