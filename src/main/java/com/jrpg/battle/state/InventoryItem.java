package com.jrpg.battle.state;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem {
    private String itemId;
    private int quantity;
}
