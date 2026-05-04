package com.jrpg.battle;

import lombok.Getter;

@Getter
public class TimeoutException extends RuntimeException {
    private final int fightsSurvived;

    public TimeoutException(int fightsSurvived) {
        super("Session timeout");
        this.fightsSurvived = fightsSurvived;
    }
}
