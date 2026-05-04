package com.jrpg.battle.state;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActiveStatus {
    private String type;      // e.g. "bleed", "stun", "regen"
    private int duration;     // turns remaining
    private int magnitude;    // damage/heal per tick (0 if not applicable)
}
