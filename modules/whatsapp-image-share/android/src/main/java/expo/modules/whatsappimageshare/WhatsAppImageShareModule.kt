package expo.modules.whatsappimageshare

import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WhatsAppImageShareModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WhatsAppImageShare")

    AsyncFunction("shareImage") { contentUri: String, phoneDigits: String ->
      val activity = appContext.currentActivity ?: throw Exception("The app is not in the foreground.")
      val uri = Uri.parse(contentUri)
      val jid = "$phoneDigits@s.whatsapp.net"
      val targets = listOf(
        "com.whatsapp" to "com.whatsapp.contact.picker.ContactPicker",
        "com.whatsapp" to "com.whatsapp.ContactPicker",
        "com.whatsapp.w4b" to "com.whatsapp.contact.picker.ContactPicker",
        "com.whatsapp.w4b" to "com.whatsapp.ContactPicker",
      )

      var launched = false
      for ((packageName, className) in targets) {
        try {
          try {
            activity.grantUriPermission(packageName, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
          } catch (_: Exception) {
          }

          val intent = Intent(Intent.ACTION_SEND).apply {
            component = ComponentName(packageName, className)
            type = "image/png"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra("jid", jid)
            clipData = ClipData.newRawUri("Payment reminder", uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
          }
          activity.startActivity(intent)
          launched = true
          break
        } catch (_: ActivityNotFoundException) {
        }
      }

      if (!launched) {
        throw Exception("WhatsApp is not installed.")
      }
    }
  }
}
