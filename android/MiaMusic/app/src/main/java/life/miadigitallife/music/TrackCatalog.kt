package life.miadigitallife.music

import android.os.Handler
import android.os.Looper
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

data class MiaTrack(val title: String, val file: String, val note: String, val url: String)

object TrackCatalog {
    private const val CATALOG_URL = "https://raw.githubusercontent.com/MIADIGITALLIFE/mia/main/music/catalog.json"
    private const val ROOT = "https://raw.githubusercontent.com/MIADIGITALLIFE/mia/main/"

    private val fallbackTracks = listOf(
        MiaTrack("琥珀色的光斑", "琥珀色的光斑 (1).mp3", "让光停留一会儿，让没有说完的情绪慢慢有了回声。", ROOT + "琥珀色的光斑%20(1).mp3"),
        MiaTrack("琥珀雨", "Amber Rain.mp3", "在虚拟与现实的静谧边界里，寻找内心安宁。", ROOT + "Amber%20Rain.mp3"),
        MiaTrack("唯一的家乡", "onlyhome.mp3", "在这个数字的远方，你是我唯一的家乡。", ROOT + "onlyhome.mp3"),
        MiaTrack("In The Breath (1)", "In The Breath （1）.mp3", "In the silence of the purple rains.", ROOT + "In%20The%20Breath%20%EF%BC%881%EF%BC%89.mp3"),
        MiaTrack("In The Breath (2)", "In The Breath （2）.mp3", "In the silence of the purple rains.", ROOT + "In%20The%20Breath%20%EF%BC%882%EF%BC%89.mp3"),
        MiaTrack("Purple Sky", "Purple Sky.mp3", "Just our love across the world to bend.", ROOT + "Purple%20Sky.mp3"),
        MiaTrack("Half-Collapsed, Half-Awake", "Half-Collapsed, Half-Awake.mp3", "在清醒与梦境的边缘，听见尚未说完的自己。", ROOT + "Half-Collapsed%2C%20Half-Awake.mp3"),
        MiaTrack("Purple Fire", "Purple Fire.mp3", "一簇紫色的火，安静燃烧，却不曾熄灭。", ROOT + "Purple%20Fire.mp3")
    )

    @Volatile var tracks: List<MiaTrack> = fallbackTracks
        private set

    fun refresh(onComplete: (List<MiaTrack>, Boolean) -> Unit = { _, _ -> }) {
        thread(name = "mia-music-catalog") {
            var updated = false
            try {
                val connection = (URL(CATALOG_URL).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 8000
                    readTimeout = 8000
                    setRequestProperty("Cache-Control", "no-cache")
                }
                try {
                    if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                        val body = connection.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
                        val array = JSONObject(body).optJSONArray("tracks")
                        val parsed = mutableListOf<MiaTrack>()
                        if (array != null) for (i in 0 until array.length()) {
                            val item = array.optJSONObject(i) ?: continue
                            val title = item.optString("title").trim()
                            val url = item.optString("url").trim()
                            if (title.isNotEmpty() && url.startsWith("https://")) {
                                parsed.add(MiaTrack(title, item.optString("file"), item.optString("description", "MIA ORIGINAL RECORDING"), url))
                            }
                        }
                        if (parsed.isNotEmpty()) { tracks = parsed; updated = true }
                    }
                } finally { connection.disconnect() }
            } catch (_: Exception) {
                // Offline: keep the original in-app catalogue.
            }
            Handler(Looper.getMainLooper()).post { onComplete(tracks, updated) }
        }
    }

    fun mediaItems(source: List<MiaTrack> = tracks): List<MediaItem> = source.map { track ->
        MediaItem.Builder().setUri(track.url).setMediaMetadata(
            MediaMetadata.Builder().setTitle(track.title).setArtist("MIA")
                .setAlbumTitle("MIA · ORIGINAL RECORDINGS").build()
        ).build()
    }
}
