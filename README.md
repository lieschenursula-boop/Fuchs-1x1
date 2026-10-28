# Fuchs-Einmaleins

Eine kleine Rechen-App für Kinder: das kleine Einmaleins üben mit einem freundlichen Fuchs.
Sie läuft im Browser und lässt sich auf Android wie eine normale App installieren (eine
**PWA** – das ist eine Webseite, die sich wie eine App auf dem Startbildschirm installieren
und auch ohne Internet öffnen lässt).

## Was die App kann

| Bereich | Regeln |
| --- | --- |
| **Stufe 1 – Fuchsjunges** | 1er-, 2er-, 5er- und 10er-Reihe, 10 zufällige Aufgaben |
| **Stufe 2 – Schlauer Fuchs** | alle Reihen bis zur 6er-Reihe und die 10er-Reihe, 10 zufällige Aufgaben |
| **Stufe 3 – Meisterfuchs** | alle Reihen von 1er bis 10er, 10 zufällige Aufgaben |
| **Sterne** | pro Stufe bis zu 5 Sterne, der beste Versuch bleibt gespeichert: 10 richtig = 5 Sterne, 9 = 4, 8 = 3, 7 = 2, 5 bis 6 = 1, weniger = 0 |
| **Fuchs beim Üben** | Antippen gibt einen Tipp (bis zu zwei Tipps pro Aufgabe, unbegrenzt oft). Bei einer falschen Antwort erklärt der Fuchs die Lösung mit Punkten |
| **Fuchs-Test** | 20 schwere Aufgaben (Faktoren 3 bis 9, ohne 5), 3 Leben, jeder Fehler kostet ein Leben, kein Fuchs. Bestes Ergebnis wird gespeichert |

Der Spielstand liegt auf dem jeweiligen Gerät (im Browser-Speicher). Jedes Handy hat also seinen eigenen Stand.

## Auf GitHub veröffentlichen (ohne Programmieren)

1. Auf [github.com](https://github.com) anmelden, oben rechts auf **+** → **New repository**.
2. Name zum Beispiel `fuchs-einmaleins`, **Public** auswählen, **Create repository**.
3. Auf der neuen Seite auf **uploading an existing file** klicken.
4. Dieses ZIP entpacken und **alle Dateien und Ordner** (`index.html`, `manifest.webmanifest`, `sw.js`, `css`, `js`, `icons`, `fonts`) per Drag & Drop in das Browserfenster ziehen. Unten auf **Commit changes** klicken.
5. Im Repository auf **Settings** → **Pages**. Bei „Build and deployment" als Source **Deploy from a branch** wählen, Branch **main**, Ordner **/ (root)**, **Save**.
6. Nach ein bis zwei Minuten steht dort die Adresse: `https://DEIN-NAME.github.io/fuchs-einmaleins/`

## Auf dem Android-Handy installieren

1. Die Adresse in **Chrome** öffnen.
2. Menü (drei Punkte oben rechts) → **App installieren** (manchmal heißt es **Zum Startbildschirm hinzufügen**).
3. Fertig: Auf dem Startbildschirm liegt jetzt das Fuchs-Symbol. Die App öffnet sich im Vollbild und funktioniert auch ohne Internet.

## Änderungen später einspielen

Dateien im Repository ersetzen (**Add file** → **Upload files**). Die App holt sich Änderungen
im Hintergrund: Nach dem nächsten Öffnen ist sie noch alt, beim übernächsten Öffnen neu.
Wer es sofort braucht, erhöht in `sw.js` die Zahl in `const CACHE = 'fuchs1x1-v1'` (zum Beispiel auf `v2`).

## Aufbau der Dateien

```
index.html              Grundgerüst der Seite
css/style.css           Aussehen (Tag-Design beim Üben, Dämmerungs-Design im Test)
js/app.js               alle Bildschirme und Regeln (Aufgaben, Sterne, Tipps, Test)
sw.js                   Service Worker: macht die App offline-fähig
manifest.webmanifest    Name, Farben und Icons für die Installation
icons/                  Fuchs-Symbol in mehreren Größen
fonts/                  Schrift „Fredoka" (offline eingebunden)
```

Einstellungen wie Anzahl der Aufgaben, Leben oder die Sterne-Regel stehen ganz oben in `js/app.js`
(Abschnitt „1 Einstellungen"). Zum Weiterbauen eignet sich **Claude Code** gut: einfach den Ordner öffnen
und beschreiben, was sich ändern soll.

## Lizenzen

Die Schrift Fredoka steht unter der SIL Open Font License (siehe `fonts/Fredoka-OFL-Lizenz.txt`).
