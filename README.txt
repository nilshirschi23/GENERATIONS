README – Projekt „GENERATIONS“
===============================

GENERATIONS ist ein browserbasiertes Lebenssimulationsspiel, das einen vollständigen Lebensweg in einem europäischen Kontext simuliert – mit realistischen Entscheidungen, gesellschaftlichen Systemen und sozialen Konsequenzen.

Ordnerstruktur und Dateierläuterung
-----------------------------------

📄 index.html  
→ Einstiegspunkt des Spiels im Browser. Lädt alle Skripte, Styles und initialisiert die Oberfläche.

📄 README.txt  
→ Diese Datei. Beschreibt die Projektstruktur.

📁 assets/  
→ Enthält alle statischen Ressourcen wie Bilder und Audiodateien.
│
├── img/  
│   → Icons, Avatare, Hintergrundgrafiken  
├── audio/  
│   → Soundeffekte oder Musik (optional)

📁 data/  
→ Alle spieldatenrelevanten JSON-Dateien (Inhalte, Logik, Entscheidungen)
│
├── countries.json  
│   → Definition landesspezifischer Rahmenbedingungen (z. B. Bildungssysteme, Steuersätze)  
├── occupations.json  
│   → Auflistung möglicher Berufe mit Aufstiegsmöglichkeiten, Einkommen, Bildungsvoraussetzungen  
├── traits.json  
│   → Persönlichkeitsmerkmale (z. B. introvertiert, ehrgeizig, empathisch) mit spielmechanischer Wirkung  
│
└── events/  
    → Lebensereignisse nach Altersphasen sortiert (z. B. Schulwahl, erste Liebe, Krankheit, Rente)  
    - childhood.json  
    - youth.json  
    - adulthood.json  
    - oldage.json  

📁 js/  
→ Enthält sämtliche JavaScript-Dateien für Spiellogik und Anzeige
│
├── main.js  
│   → Einstiegspunkt des Spiels; initialisiert Daten, Spielstand und UI  
├── ui.js  
│   → Steuert die Benutzeroberfläche: Anzeige von Text, Buttons, Auswahloptionen  
├── gameState.js  
│   → Verwaltung des aktuellen Spielstatus (z. B. Alter, Eigenschaften, Fortschritt)  
├── eventHandler.js  
│   → Laden und Verarbeiten von Ereignissen aus den JSON-Dateien  
├── utils.js  
│   → Hilfsfunktionen (z. B. Zufallszahlen, Datumsberechnung, Statusauswertung)

📁 save/  
→ (Geplant) Speicherung von Spielständen, z. B. über localStorage oder als Export-Dateien

📁 style/  
→ CSS-Dateien für Gestaltung und Layout
- main.css  
→ Hauptstylesheet für Farben, Schriftarten, Layoutstrukturen

Hinweise
--------

– Das Spiel läuft vollständig im Browser und benötigt keine Installation.  
– Die Daten sind modular aufgebaut – neue Länder, Ereignisse oder Berufe können über JSON-Dateien ergänzt werden.  
– Zukünftige Erweiterungen (Mehrsprachigkeit, Modding, Import/Export von Spielständen) sind vorgesehen.

Letzte Bearbeitung: 06.05.2025
