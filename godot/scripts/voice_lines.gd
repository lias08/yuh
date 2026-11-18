# Voicelines: Sprechblasen-Sprüche + optionale eigene Audiodateien.
#
# Eigene Sprachaufnahmen hinzufügen (z. B. selbst eingesprochen):
#   godot/voices/<brawler_id>/<ereignis>.ogg   (oder .wav / .mp3)
#   Ereignisse: start, kill, super, death, win, lose
#   Mehrere Varianten: kill_1.ogg, kill_2.ogg, ... (es wird zufällig eine gewählt)
# Liegt keine Datei vor, wird nur der Spruch als Sprechblase gezeigt.
class_name VoiceLines

const EVENTS := ["start", "kill", "super", "death", "win", "lose"]

# Sprüche je Klasse (Rolle) – jeder Brawler zieht daraus seine eigene, feste Auswahl.
const BY_ROLE := {
	"Schütze": {"start": ["Zielen, schießen, gewinnen!", "Meine Kugeln sind schneller als du."], "kill": ["Volltreffer!", "Zu langsam!", "Ein Schuss, ein Treffer."],
		"super": ["Kugelhagel!", "Alles, was ich habe!"], "death": ["Nachladen…!", "Erwischt…"], "win": ["Bester Schütze der Arena!"], "lose": ["Nächstes Mal ziele ich besser."]},
	"Nahkampf-Schütze": {"start": ["Komm ruhig näher.", "Aus der Nähe bin ich am schönsten."], "kill": ["Zu nah gekommen!", "Bumm, weg bist du!"],
		"super": ["Aus dem Weg!", "Jetzt komm ich!"], "death": ["Hmpf…!"], "win": ["Niemand kommt an mir vorbei!"], "lose": ["Das war knapp daneben."]},
	"Scharfschütze": {"start": ["Ich sehe alles.", "Atmen. Zielen. Treffen."], "kill": ["Aus dem Hinterhalt.", "Präzision gewinnt."],
		"super": ["Kein Entkommen!", "Durch alles hindurch!"], "death": ["Entdeckt…"], "win": ["Geduld zahlt sich aus."], "lose": ["Zu viele Ziele…"]},
	"Werfer": {"start": ["Wer will ’ne Bombe?", "Über die Mauer damit!"], "kill": ["Kawumm!", "Hat geknallt!"],
		"super": ["Alles in Deckung!", "Das wird laut!"], "death": ["Selbst gesprengt…"], "win": ["Was für ein Feuerwerk!"], "lose": ["Zu viel Rauch…"]},
	"Magier": {"start": ["Die Sterne stehen günstig.", "Spürt ihr die Magie?"], "kill": ["Verzaubert!", "Magie schlägt Muskeln."],
		"super": ["Entfesselt!", "Spürt meine wahre Kraft!"], "death": ["Mein Zauber… erlischt…"], "win": ["Wie vorhergesehen."], "lose": ["Das stand nicht in den Sternen."]},
	"Nahkämpfer": {"start": ["Klinge bereit!", "Ich weiche keinen Schritt."], "kill": ["Zu schwach!", "Ein sauberer Schnitt."],
		"super": ["Volle Kraft!", "Jetzt wird’s ernst!"], "death": ["Ich… komme wieder…"], "win": ["Die Klinge hat entschieden."], "lose": ["Ich muss härter trainieren."]},
	"Panzer": {"start": ["Ich bin die Mauer.", "Versucht doch, mich zu stoppen!"], "kill": ["Plattgemacht!", "Zu leicht!"],
		"super": ["Nichts hält mich auf!", "Aus dem Weg!"], "death": ["Uff…!"], "win": ["Unaufhaltsam!"], "lose": ["Ich stand… zu lange."]},
	"Assassine": {"start": ["Aus den Schatten…", "Ihr seht mich nicht kommen."], "kill": ["Lautlos.", "Schon vorbei.", "Hinter dir."],
		"super": ["Zu schnell für euch!", "Jetzt!"], "death": ["Gesehen…?"], "win": ["Kein Zeuge übrig."], "lose": ["Zurück in die Schatten."]},
	"Berserker": {"start": ["Ich hab Hunger auf Kampf!", "RAAAH!"], "kill": ["Mehr!", "Wer ist der Nächste?!"],
		"super": ["ENTFESSELT!", "Jetzt raste ich aus!"], "death": ["Noch… nicht…!"], "win": ["Ich bin noch nicht müde!"], "lose": ["GRRR… Revanche!"]},
	"Kontrolle": {"start": ["Alles nach Plan.", "Ich bestimme das Tempo."], "kill": ["Erwischt!", "Genau berechnet."],
		"super": ["Keiner bewegt sich!", "Falle zu!"], "death": ["Fehler im Plan…"], "win": ["Alles unter Kontrolle."], "lose": ["Ich habe mich verrechnet."]},
	"Unterstützer": {"start": ["Ich halte euch am Leben!", "Zusammen sind wir stark."], "kill": ["Tut mir fast leid.", "Heilung für mich, Schaden für dich!"],
		"super": ["Kraft für alle!", "Haltet durch!"], "death": ["Heilt… mich…"], "win": ["Teamwork gewinnt!"], "lose": ["Wir schaffen das beim nächsten Mal."]},
	"Artillerie": {"start": ["Kanone geladen!", "Feuer frei!"], "kill": ["Direkter Treffer!", "Ziel vernichtet."],
		"super": ["Alles, was rumst!", "Feuer aus allen Rohren!"], "death": ["Munition… alle…"], "win": ["Schweres Geschütz siegt!"], "lose": ["Zu wenig Feuerkraft."]},
	"Waffenmeister": {"start": ["Welche Waffe darf’s heute sein?", "Mein Arsenal ist bereit."], "kill": ["Falsche Waffe gewählt, Freund.", "Eine reicht."],
		"super": ["Das ist mein Lieblingsstück!", "Jetzt richtig!"], "death": ["Nicht… mein Tag…"], "win": ["Auftrag erledigt."], "lose": ["Das wird teuer."]},
	"Schadensverursacher": {"start": ["Meine Klinge ist bereit.", "Zeit zu erwachen!"], "kill": ["Zu langsam!", "Das war erst der Anfang."],
		"super": ["Erwache!", "Spürt meine wahre Form!"], "death": ["Ich… werde stärker…"], "win": ["Die Klinge siegt!"], "lose": ["Ich muss noch wachsen."]},
}
const GENERIC := {"start": ["Los geht’s!"], "kill": ["Erwischt!"], "super": ["Jetzt!"], "death": ["Argh!"], "win": ["Sieg!"], "lose": ["Schade…"]}

## Persönlicher Spruch: aus dem Pool der Rolle, aber pro Brawler unterschiedlich gemischt.
static func line(b: Dictionary, event: String) -> String:
	var custom: Dictionary = b.get("voice", {})
	var pool: Array = custom.get(event, BY_ROLE.get(b.get("role", ""), GENERIC).get(event, GENERIC[event]))
	if pool.is_empty():
		return ""
	var base: int = abs(hash(b.id + event))
	return pool[(base + randi() % 2) % pool.size()]

static var _audio_cache := {}

## Optionale eigene Audiodatei für das Ereignis (oder null).
static func audio(id: String, event: String) -> AudioStream:
	var key := id + "/" + event
	if not _audio_cache.has(key):
		var found: Array = []
		for dir in ["res://voices/" + id, "user://voices/" + id]:
			var d := DirAccess.open(dir)
			if d == null:
				continue
			for f in d.get_files():
				var fname := f.trim_suffix(".import")
				if not fname.begins_with(event):
					continue
				var path: String = dir + "/" + fname
				if found.has(path):
					continue
				if fname.ends_with(".ogg") or fname.ends_with(".wav") or fname.ends_with(".mp3"):
					found.append(path)
		_audio_cache[key] = found
	var list: Array = _audio_cache[key]
	if list.is_empty():
		return null
	var path: String = list[randi() % list.size()]
	if path.begins_with("res://"):
		return load(path) as AudioStream
	if path.ends_with(".mp3"):
		var mp3 := AudioStreamMP3.new()
		mp3.data = FileAccess.get_file_as_bytes(path)
		return mp3
	return null
