package com.feelody;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class YoutubeSearchTest {
    @Test void selectsMusicUploadsAndRejectsPlaylistVideos() {
        assertTrue(YoutubeSearch.isOriginalTrack("Yellow", "Coldplay - Topic", ""));
        assertTrue(YoutubeSearch.isOriginalTrack("Beautiful Day", "U2VEVO", ""));
        assertFalse(YoutubeSearch.isOriginalTrack("발라드 모음", "Singer - Topic", ""));
        assertFalse(YoutubeSearch.isOriginalTrack("Yellow (Acoustic Cover)", "SingerVEVO", ""));
        assertFalse(YoutubeSearch.isOriginalTrack("My playlist (official audio)", "Music Channel", ""));
        assertFalse(YoutubeSearch.isOriginalTrack("Yellow (Official Audio)", "Fan Channel", ""));
    }
}
