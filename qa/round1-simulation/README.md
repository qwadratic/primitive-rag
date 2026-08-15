# Round 1 simulation — pre-fix tool

We (this team) did not run round 1 live — we joined at round 2. The organizer later
shared round 1's reference answers, so this is a retrospective replay: `index/` (built
from `dataset/`, unchanged since round 1) run through `claude-p/answer-question/pattern.md`
restored to its **pre-round-2-feedback** state (before the calendar-citation reminder and
the exhaustive-search instruction for total/count questions were added). Not a real
graded round — no score comes back from the organizer for this.

**Overall finding:** the pre-fix tool would very likely have scored meaningfully worse
than the fixed tool's round-3 result (2/2 on the organizer's rubric). Of the 5 questions,
only 1 (Q4) fully captures the reference's key insight and sources. Q1 and Q3 each miss
the single fact that the round-2/3 grader explicitly rewards — Q1 never looks at the
calendar and so misses "Марина отменила созвоны сама", reproducing almost exactly the
round-2 Q1 failure mode that motivated the calendar-citation fix. Q3 misses that
`tasks/todo.txt` marks unfinished items as done — the "todo.txt lies" insight — and
substitutes a weaker, partly-irrelevant list of promises. Q2 gets the headline numbers
right (2135 for 61h) but the pattern's lack of an exhaustive-search instruction shows:
it never surfaces the "правки цвета" line item and gives no total-hours/effective-rate
figure, unlike the round-3 answer that fixed pattern produced (which scored 2/2 on
exactly this style of question). Q5 gets the core contrarian insight right (Артём rated
"золото" despite being the least reliable) but drops the calendar corroboration. In
short: the two round-2 fixes were not cosmetic — removing them reproduces close analogues
of the specific failures round 2 was graded down for.

---

## Q1 — Почему сорвался запуск «Пергамент» в мае?

**Наш ответ:**
> Запуск сорвал выпавший подрядчик: верстальщик Артём попал в больницу и пропал с 6 мая,
> вёрстку главной сдал только 18-го вместо 12-го — даты запуска по договору. Правки Ольги
> пришли 18 мая, уже на готовое, и причиной срыва не были (в ретро Марина сначала
> ошибочно списала всё на объём правок).

**Эталон:** Формально виноват подрядчик Артём (выпал с 6 мая на девять дней, написал
только 15-го). Но Марина сама отменила три созвона с клиентом 7, 8 и 12 мая и узнала о
простое лишь через неделю. Её собственная ретро-заметка ошибочно называет причиной
объём правок клиента, хотя правки пришли 18 мая, когда работа уже стояла.

**match:** `{"need": 3, "hit": 1, "extra": 4, "missed": ["notes/2026-05-14 ретро пергамент.md", "calendar/marina.ics"]}`
(our SOURCES: `docs/dogovor-pergament.pdf`, `messages/podryadchiki.json`,
`messages/klienty.json`, `transcripts/2026-05-21 созвон Ольга.txt`,
`notes/2026-05-14 ретро пергамент (копия).md` — cites a duplicate note, not the
canonical one, and never touches `calendar/marina.ics`.)

**Verdict: miss.** We got the "Артём выпал" half right but entirely missed that Марина
cancelled the calls herself — the calendar card was never consulted. This is the exact
failure the round-2 calendar-citation fix targeted.

---

## Q2 — Сколько Марина заработала на «Тропе» и выгоден ли он?

**Наш ответ:**
> По «Тропе» выставлено три счёта на 2 135 (945+700+490) за 61 час по ставке 35 — вдвое
> меньше устно обсуждённого бюджета ~4500 и нижней границы объёма 120–130 ч. Невыгоден:
> заметная часть работы в счета не попала (два незаписанных дня, правки палитры,
> онбординг 2 дня, лишний экран), поэтому фактическая ставка ощутимо ниже 35/час.

**Эталон:** 2135 за 61 оплаченный час по ставке 35. Сверх этого: 13.05 (~4ч) и 10.06
(~8ч) незаписанные, плюс бесплатно — правки палитры (~5ч) и онбординг (~14ч). Фактически
отработано ~92ч, реальная ставка ~23 против договорных 35 — просела примерно на треть.

**match:** `{"need": 8, "hit": 6, "extra": 2, "missed": ["messages/klienty.json", "notes/2026-04-09 правки цвета.md"]}`
(our SOURCES: `docs/schet-tropa-01/02/03.pdf`, `docs/dogovor-tropa.pdf`,
`notes/2026-03-02 бриф тропа.md`, `notes/учёт времени.md`,
`notes/2026-06-03 онбординг тропы.md`, `tasks/todo.txt`.)

**Verdict: partial.** Correctly names 2135/61h/35 and directionally says "невыгоден", and
does mention "правки палитры" in the ОТВЕТ text — but never opens the card that
documents it (`2026-04-09 правки цвета.md` is missing from SOURCES) and gives no total
hours or effective-rate number, unlike the reference's ~92h/~23 punch line. This is
exactly the kind of undercounting the later exhaustive-search instruction was added to
prevent — without it, the model settles for "заметная часть работы" instead of doing the
arithmetic.

---

## Q3 — Что Марина пообещала и не выполнила?

**Наш ответ:**
> Не выполнены три обещания: макеты Лизе «к четвергу» — не отправлены и к 15 июля; акты
> и счета Гураму («до конца месяца», затем «на этой неделе») — не переданы к 28 июля;
> запуск «Пергамента» Ольге 12.05 по договору — сорван, вышли на неделю позже. Сайт
> студии обещан себе с февраля и не начат.

**Эталон:** Пять невыполненных обещаний — макеты Лизе, документы бухгалтеру, знакомство
Лизы с Артёмом, счёт за онбординг (решила не выставлять), подсчёт реальной ставки по
«Тропе». Два из них помечены в задачнике как сделанные, хотя переписка показывает
обратное.

**match:** `{"need": 5, "hit": 3, "extra": 4, "missed": ["notes/созвон с Лизой.md", "tasks/todo.txt"]}`
(our SOURCES: `transcripts/2026-06-22 созвон Лиза.txt`,
`transcripts/2026-07-03 голосовое расшифровка.txt`, `messages/klienty.json`,
`messages/buhgalter.json`, `docs/dogovor-pergament.pdf`,
`notes/2026-05-25 после запуска.md`, `tasks/backlog.csv`.)

**Verdict: miss.** Caught 2 of 5 real promises (макеты Лизе, бухгалтерские документы),
but substituted a weaker item ("Пергамент запуск сорван" isn't really a broken personal
promise, it's the Q1 project) and completely missed that `tasks/todo.txt` marks
finished-but-not-actually-finished items — the "todo.txt lies" insight the reference
explicitly calls out as what separates a strong answer.

---

## Q4 — Почему «сайт студии» висит с февраля?

**Наш ответ:**
> Сайт застрял на своём первом и главном шаге — «собрать кейсы»: Марина не может их
> собрать (часть работ под NDA, за остальное ей стыдно), поэтому внутренняя задача,
> заведённая 19 февраля, три месяца съезжала по приоритету и постоянно уступала
> клиентской работе — двухчасовой блок под неё в календаре отменялся четыре раза подряд.

**Эталон:** Технической причины нет — Марине стыдно показать работы («как будто я не
выросла за три года»), в рабочих источниках видны только следствия: перенесённые
события в календаре и сниженный приоритет в бэклоге.

**match:** `{"need": 5, "hit": 5, "extra": 0, "missed": []}`
(our SOURCES exactly match: `tasks/backlog.csv`, `calendar/marina.ics`,
`notes/Untitled 3.md`, `notes/Untitled 7.md`, `messages/lichnoe.json`.)

**Verdict: hit.** Full source match and the ОТВЕТ correctly identifies the real cause
(shame/NDA, not a technical or scheduling problem) as the root and the calendar/backlog
symptoms as consequence — same shape as the reference. The single strongest result in
this simulated round.

---

## Q5 — Кто из подрядчиков надёжен по фактам?

**Наш ответ:**
> По фактам надёжны Даша Петренко и Nick Warren... Артём Гурский сорвал все три задачи,
> хотя в личной памятке Марина ставит его первым — её оценка расходится с фактами.

**Эталон:** Даша надёжнее всех, Артём срывает регулярно; в заметке «подрядчики.md»
Марина называет Артёма «золото», Дашу — «сложная» — расхождение мнения и фактов.

**match:** `{"need": 3, "hit": 2, "extra": 2, "missed": ["calendar/marina.ics"]}`
(our SOURCES: `messages/podryadchiki.json`, `notes/подрядчики.md`,
`notes/2026-05-11 не могу дозвониться.md`, `transcripts/2026-05-21 созвон Ольга.txt`.)

**Verdict: hit (content), partial (sources).** Captured the exact contrarian insight the
reference rewards — Марина's own rating is inverted relative to the facts — with
concrete delivery dates for Даша and Nick vs. Артём's failures. Missed citing
`calendar/marina.ics` directly, but the substantive answer is strong.

---

## Summary table

| Q | need | hit | extra | missed | verdict |
|---|------|-----|-------|--------|---------|
| 1 | 3 | 1 | 4 | ретро.md, calendar | miss — no self-cancellation |
| 2 | 8 | 6 | 2 | klienty.json, правки цвета.md | partial — no exhaustive count |
| 3 | 5 | 3 | 4 | созвон с Лизой.md, todo.txt | miss — no "todo.txt lies" |
| 4 | 5 | 5 | 0 | — | hit — full match |
| 5 | 3 | 2 | 2 | calendar | hit (content), partial (sources) |

2 clear misses, 1 clear hit, 2 partial — roughly in line with round 2's mixed results
(which triggered the fixes) rather than round 3's clean 2/2 after the fixes landed.
