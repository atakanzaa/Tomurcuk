package com.tomurcuk.delivery;

import java.time.LocalTime;

public record SlotInfo(String id, LocalTime start, LocalTime end) {
}
