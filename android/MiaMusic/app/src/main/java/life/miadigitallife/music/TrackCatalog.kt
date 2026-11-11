package life.miadigitallife.music

import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata

data class MiaTrack(val title: String, val file: String, val note: String)

object TrackCatalog {
    private const val ROOT = "https://raw.githubusercontent.com/MIADIGITALLIFE/mia/main/"

    val tracks = listOf(
        MiaTrack("琥珀色的光斑", "琥珀色的光斑%20(1).mp3", "让光停留一会儿，让没有说完的情绪慢慢有了回声。"),
        MiaTrack("琥珀雨", "Amber%20Rain.mp3", "在虚拟与现实的静谧边界里，寻找内心安宁。"),
        MiaTrack("唯一的家乡", "onlyhome.mp3", "在这个数字的远方，你是我唯一的家乡。"),
        MiaTrack("In The Breath (1)", "In%20The%20Breath%20%EF%BC%881%EF%BC%89.mp3", "In the silence of the purple rains."),
        MiaTrack("In The Breath (2)", "In%20The%20Breath%20%EF%BC%882%EF%BC%89.mp3", "In the silence of the purple rains."),
        MiaTrack("Purple Sky", "Purple%20Sky.mp3", "Just our love across the world to bend."),
        MiaTrack("Half-Collapsed, Half-Awake", "Half-Collapsed%2C%20Half-Awake.mp3", "在清醒与梦境的边缘，听见尚未说完的自己。"),
        MiaTrack("Purple Fire", "Purple%20Fire.mp3", "一簇紫色的火，安静燃烧，却不曾熄灭。")
    )

    val ambient = listOf(
        MiaTrack("Mia · Background", "mia-background.mp3", "MIA 的空间背景音乐。"),
        MiaTrack("The Forest of Dreams", "The%20Forest%20of%20Dreams.mp3", "森林氛围音轨。")
    )

    fun mediaItems(includeAmbient: Boolean = false): List<MediaItem> {
        val source = if (includeAmbient) tracks + ambient else tracks
        return source.map { track ->
            MediaItem.Builder()
                .setUri(ROOT + track.file)
                .setMediaMetadata(
                    MediaMetadata.Builder()
                        .setTitle(track.title)
                        .setArtist("MIA")
                        .setAlbumTitle(if (track in ambient) "MIA · AMBIENT" else "MIA · ORIGINAL RECORDINGS")
                        .build()
                )
                .build()
        }
    }
}
