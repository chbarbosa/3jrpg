package com.jrpg.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "season_results")
@Getter
@Setter
public class SeasonResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    private UUID uuid;

    private UUID seasonUuid;
    private UUID playerUuid;
    private UUID bestRunUuid;
    private int fightsSurvived;

    @PrePersist
    protected void onCreate() {
        uuid = UUID.randomUUID();
    }
}
