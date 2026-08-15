Manually read (not yet auto-OCR'd) during sampling, to characterize what the screenshot
pipeline needs to handle. 5 of 18 files.

| file | header/category | text content | verdict |
|---|---|---|---|
| Снимок экрана 2026-06-11 в 19.02.44.png | Заметки | "работаю без остановки а денег столько же" | real, matches lichnoe.json 06-11 msg almost verbatim — likely the phone-note the chat message was typed from |
| Снимок экрана 2026-04-22 в 16.41.55.png | Фигма | (white panel, no visible text) | empty — legitimate empty capture |
| Снимок экрана 2026-07-03 в 09.14.02.png | Задачи | "[ ] макеты Лизе", "[x] отдать документы Гураму" | real, matches todo.txt |
| IMG_2799.png | (none — abstract art) | no text | empty/decorative, no info |
| IMG_2847.png | Переписка | "Артём Гурский: сделаю всё, дай два дня" / "Марина: давай к 18-му тогда" | real, matches podryadchiki.json but as a screenshot artifact |
| photo_2026-05-20.png | Переписка | "Лиза: И ещё экран онбординга, если несложно" / "Марина: Сделаю, тоже не буду выставлять" | real, "не буду выставлять" (won't bill for it) not found verbatim elsewhere — unique fact |

Takeaway: filename family (Снимок vs IMG_/photo_) does not predict whether there's real
text. ~2/5 sampled were empty/non-informational. Pipeline must attempt extraction on all
18 and tolerate empty results rather than pre-filtering by name.
