package app.elixirtracker

import android.content.ContentResolver
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.provider.OpenableColumns
import app.elixirtracker.logic.CardDatabase
import java.io.File

data class CardTemplate(val name: String, val cost: Int, val file: File)

/**
 * Speichert Karten-Vorlagen (Ausschnitte aus Screenshots) als
 * files/cards/<Name>__<Kosten>.png
 */
class TemplateStore(ctx: Context) {
    val dir = File(ctx.filesDir, "cards").apply { mkdirs() }

    fun all(): List<CardTemplate> =
        dir.listFiles { f -> f.name.endsWith(".png") }.orEmpty()
            .mapNotNull(::parse)
            .sortedWith(compareBy({ it.cost }, { it.name }))

    private fun parse(f: File): CardTemplate? {
        val base = f.name.removeSuffix(".png")
        val i = base.lastIndexOf("__")
        if (i <= 0) return null
        val cost = base.substring(i + 2).toIntOrNull() ?: return null
        return CardTemplate(base.substring(0, i), cost, f)
    }

    fun delete(t: CardTemplate) {
        t.file.delete()
    }

    /** Importiert ein Bild. Dateiname = Kartenname, optional mit Kosten: "Hog Rider_4.png". */
    fun import(resolver: ContentResolver, uri: Uri): Result<CardTemplate> = runCatching {
        val display = displayName(resolver, uri) ?: error("Dateiname nicht lesbar")
        val base = display.substringBeforeLast('.').trim()
        val withCost = Regex("""^(.+?)[ _-]+(\d{1,2})$""").find(base)
        val (rawName, explicitCost) =
            if (withCost != null) withCost.groupValues[1] to withCost.groupValues[2].toInt()
            else base to null
        val dbCard = CardDatabase.find(rawName)
        val name = dbCard?.name ?: rawName.trim()
        val cost = explicitCost ?: dbCard?.cost
            ?: error("Unbekannte Karte „$rawName“ – benenne die Datei z.B. „${rawName}_4.png“")

        val bmp: Bitmap = resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) }
            ?: error("Bild konnte nicht geladen werden")
        // alte Vorlage der gleichen Karte ersetzen
        all().filter { it.name == name }.forEach { delete(it) }
        val out = File(dir, "${safe(name)}__$cost.png")
        out.outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
        CardTemplate(name, cost, out)
    }

    private fun safe(s: String) = s.replace(Regex("""[\\/:*?"<>|]"""), "_")

    private fun displayName(resolver: ContentResolver, uri: Uri): String? =
        resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c ->
            if (c.moveToFirst()) c.getString(0) else null
        } ?: uri.lastPathSegment

    /** Kleine Vorschaubilder für das Overlay. */
    fun thumbnails(heightPx: Int): Map<String, Bitmap> = all().mapNotNull { t ->
        val b = BitmapFactory.decodeFile(t.file.path) ?: return@mapNotNull null
        val w = (b.width * heightPx.toFloat() / b.height).toInt().coerceAtLeast(1)
        t.name to Bitmap.createScaledBitmap(b, w, heightPx, true)
    }.toMap()
}
