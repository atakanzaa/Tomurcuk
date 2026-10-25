package com.tomurcuk.review;

/** Takip sayfasındaki form. `hideName` işaretliyse ad yerine "Bir alıcı" yazar. */
public record ReviewInput(Integer rating, String text, boolean hideName) {
}
