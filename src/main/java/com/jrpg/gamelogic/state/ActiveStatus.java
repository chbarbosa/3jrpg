package com.jrpg.gamelogic.state;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActiveStatus {
    private String type;     // e.g. "bleed", "stun", "regen"
    private int duration;    // turns remaining
    private int magnitude;   // damage/heal value per tick (0 if not applicable)
}
