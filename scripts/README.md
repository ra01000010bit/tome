# Kérdés-pipeline

Segéd-szkriptek, amelyek egy forrás-szövegből a Tome topic-sémájába illő
kérdéscsomagot generálnak és validálnak.

| Szkript | Mit csinál |
|---|---|
| `generate_questions.py` | Egy `.txt` forrásból Claude-dal kérdés-JSON-t generál (`sourceQuote`-horgonnyal). |
| `validate_topic.py` | Egy topic-JSON sémáját + a `sourceQuote`-okat ellenőrzi a forrásszöveg ellen. |
| `validate-questions.mjs` | Build-időben fut: minden topic-JSON parseolható, a kérdés-id-k globálisan egyediek. |

## Előfeltételek

```bash
pip install anthropic
setx ANTHROPIC_API_KEY "sk-ant-..."   # új PowerShell-ablak kell utána
```

> A `generate_questions.py` az egyetlen rész, ami Claude API-kulcsot igényel.
> A frontend, a szerver és a `validate-*` szkriptek kulcs nélkül futnak.

## Munkamenet

1. Tedd a forrás-szöveget egy `.txt`-be. Az **első sor** lesz a tétel neve
   (pl. `D2. A naprendszer felépítése`).

2. Generálj:
   ```bash
   python scripts/generate_questions.py \
     --input forras/demo2.txt \
     --output src/themes/_example/topics/demo_02.json \
     --topic-id demo_02 --subject-id demo --code D2
   ```
   (`--dry-run`-nal csak a promptot írja ki, API-hívás nélkül.)

3. Validálj a forrás ellen (a `sourceQuote`-ok tényleg a forrásban vannak-e):
   ```bash
   python scripts/validate_topic.py src/themes/_example/topics/demo_02.json demo_02 \
     --source forras/demo2.txt
   ```

4. Vedd fel a topic id-t a téma `subjects.js`-ének megfelelő `topicIds` tömbjébe.
   Az `index.js` az új JSON-t automatikusan betölti (`import.meta.glob`).

## Kézi tartalom

Pipeline nélkül is működik: írj kézzel egy topic-JSON-t a `topics/` mappába
(lásd `src/themes/_example/topics/demo_01.json` a sémáért), és vedd fel a
`subjects.js`-be. A 4 kérdéstípus: `flashcard`, `multiple_choice`,
`true_false`, `cloze`.
