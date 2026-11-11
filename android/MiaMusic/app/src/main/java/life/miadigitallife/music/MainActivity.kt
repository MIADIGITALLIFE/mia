package life.miadigitallife.music

import android.Manifest
import android.content.ComponentName
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture

class MainActivity : ComponentActivity() {
    private var controller: MediaController? = null
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private lateinit var status: TextView
    private lateinit var root: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(11, 16, 16)
        window.navigationBarColor = Color.rgb(11, 16, 16)
        requestNotificationPermission()
        buildScreen()
        connectController()
    }

    private fun buildScreen() {
        val page = ScrollView(this).apply { setBackgroundColor(Color.rgb(11, 16, 16)) }
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(38), dp(24), dp(36))
        }
        page.addView(root)
        setContentView(page)

        root.addView(label("M I A   M U S I C", 13, "#B99A72"))
        root.addView(label("让声音，替你留下回忆。", 27, "#E9E3D7", top = 18))
        root.addView(label("MIA ORIGINAL RECORDINGS  ·  01—08", 10, "#A9A397", top = 10))
        status = label("正在连接音乐播放器…", 12, "#B9B1A4", top = 24)
        root.addView(status)
        root.addView(label("THE ALBUM", 11, "#B99A72", top = 30))

        TrackCatalog.tracks.forEachIndexed { index, track ->
            val button = Button(this).apply {
                text = "%02d   %s".format(index + 1, track.title)
                isAllCaps = false
                setTextColor(Color.rgb(230, 222, 207))
                setBackgroundColor(Color.rgb(24, 31, 30))
                gravity = Gravity.START or Gravity.CENTER_VERTICAL
                setPadding(dp(14), dp(12), dp(14), dp(12))
                setOnClickListener {
                    controller?.let { player ->
                        player.seekTo(index, 0L)
                        player.play()
                        status.text = "正在播放 · " + track.title
                    } ?: run { status.text = "播放器仍在连接，请稍后再试。" }
                }
            }
            root.addView(button, LinearLayout.LayoutParams(-1, dp(58)).apply { bottomMargin = dp(8) })
            root.addView(label(track.note, 11, "#AAA397").apply {
                setPadding(dp(4), 0, dp(4), dp(12))
            })
        }

        root.addView(label("NOW PLAYING", 10, "#B99A72", top = 24))
        val controls = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        controls.addView(control("上一首") { controller?.seekToPreviousMediaItem() })
        controls.addView(control("播放 / 暂停") {
            controller?.let { if (it.isPlaying) it.pause() else it.play() }
        })
        controls.addView(control("下一首") { controller?.seekToNextMediaItem() })
        root.addView(controls)
        root.addView(label("后台播放 · 锁屏与通知栏控制 · 网络播放", 10, "#8F948D", top = 18))
        root.addView(label("M I A  ·  SMALL MOMENTS, A BIGGER WORLD", 10, "#777D77", top = 34))
    }

    private fun control(text: String, action: () -> Unit) = Button(this).apply {
        this.text = text
        isAllCaps = false
        setTextColor(Color.rgb(230, 222, 207))
        setBackgroundColor(Color.rgb(45, 49, 43))
        setOnClickListener { action() }
    }

    private fun label(text: String, size: Int, color: String, top: Int = 0) =
        TextView(this).apply {
            this.text = text
            textSize = size.toFloat()
            setTextColor(Color.parseColor(color))
            setPadding(0, dp(top), 0, dp(8))
        }

    private fun connectController() {
        val token = SessionToken(this, ComponentName(this, PlaybackService::class.java))
        controllerFuture = MediaController.Builder(this, token).buildAsync()
        controllerFuture?.addListener({
            try {
                controller = controllerFuture?.get()
                status.text = "曲库已载入 · " + TrackCatalog.tracks.size + " 首正式歌曲"
            } catch (_: Exception) {
                status.text = "播放器连接失败，请重新打开应用。"
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 100)
        }
    }

    override fun onDestroy() {
        controllerFuture?.let { MediaController.releaseFuture(it) }
        controller = null
        super.onDestroy()
    }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}
