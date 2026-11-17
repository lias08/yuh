package app.elixirtracker

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import org.json.JSONArray

/** Alle Karten, die beim Bauen in assets/cards/ gepackt wurden (siehe tools/fetch_cards.py). */
data class BundledCard(val key: String, val name: String, val elixir: Int)

object BundledCards {
    fun load(ctx: Context): List<BundledCard> = runCatching {
        val json = ctx.assets.open("cards/index.json").bufferedReader().use { it.readText() }
        val arr = JSONArray(json)
        List(arr.length()) { i ->
            val o = arr.getJSONObject(i)
            BundledCard(o.getString("key"), o.getString("name"), o.getInt("elixir"))
        }
    }.getOrDefault(emptyList())

    fun bitmap(ctx: Context, key: String): Bitmap? = runCatching {
        ctx.assets.open("cards/$key.png").use { BitmapFactory.decodeStream(it) }
    }.getOrNull()
}
