# Sicherheitsaspekte von WebAssembly

Projektarbeit im Masterstudiengang Informatik an der Hochschule Aalen.

**Autor:** David Weber (3015004)  
**Betreuer:** Prof. Dr. Christoph Karg  
**Abgabe:** 15.07.2026

## Inhalt

### `Ausarbeitung/`
LaTeX-Quellen der schriftlichen Ausarbeitung. Das Dokument kann mit XeLaTeX gebaut werden:

```bash
cd Ausarbeitung
./xebuild.sh pa-weber-3015004-sicherheitsaspekte-von-webassembly.tex
```

### `Projekt/`
Fünf Proof-of-Concept-Implementierungen, die konkrete Schwachstellenklassen im WebAssembly-Kontext demonstrieren. Jeder PoC ist als eigenständiger Docker-Container ausführbar.

| Verzeichnis | Schwachstelle |
|---|---|
| `buffer_overflow/` | Stack-Buffer-Overflow → Authentifizierungsumgehung |
| `use_after_free/` | Use-After-Free → Heap-Speicherkontrolle |
| `integer_overflow/` | Integer-Overflow → Umgehung einer Längenprüfung |
| `rust_boundary/` | JS-Wasm-Grenzvertrauen (Rust) |
| `use_after_free_asan/` | Use-After-Free mit AddressSanitizer als Gegenmaßnahme |

**Starten eines PoC:**
```bash
cd Projekt/<beispiel>
docker build -t <beispiel> .
docker run --rm -p 8080:8080 <beispiel>
# Anwendung unter http://127.0.0.1:8080 erreichbar
```
