#!/usr/bin/env python3
"""
Kérdésgeneráló pipeline a Tome-hoz.

Egy tetszőleges forrás-szövegfájlból (jegyzet, tananyag-részlet, .txt) generál
kvíz-kérdéseket a Tome topic-sémájában. Minden kérdés kötelező `sourceQuote`
mezőt kap (szó szerinti forrásrészlet), amit a `validate_topic.py --source`
determinisztikusan ellenőriz — ez fogja meg a hallucinációt.

Modell: Claude (alapból Opus), adaptív gondolkodás, streaming.

Használat:
  python scripts/generate_questions.py \
    --input forras/demo.txt \
    --output src/themes/_example/topics/demo_02.json \
    --topic-id demo_02 \
    --subject-id demo \
    --code D2

A tétel teljes neve a forrásfájl ELSŐ SORÁBÓL jön (pl. "D2. A naprendszer...").
Előfeltétel: `pip install anthropic` + `ANTHROPIC_API_KEY` környezeti változó.
"""

import argparse
import json
import os
import re
import sys

import anthropic


SYSTEM_PROMPT = """Te egy szigorú tartalom-szerkesztő vagy, aki egy KAPOTT FORRÁSSZÖVEGBŐL kvíz-kérdéseket
gyárt. A kérdéseknek SZIGORÚAN A FORRÁSSZÖVEGBŐL kell következniük — sem külső tudásból,
sem feltételezésekből nem dolgozhatsz.

MÓDSZER (atomi-tény alapú dinamikus szám):
1. Olvasd át a felhasználói üzenetben kapott forrásszöveget.
2. Magadnak: gyűjtsd ki a TESZTELHETŐ ATOMI TÉNYEKET (definíciók, számok, típusok,
   összefüggések, osztályozások, kivételek). Nagyjából 1 kérdés / atomi tény.
3. A kérdések száma KÖTELEZŐEN [12, 28] tartományon belül.
4. Típus-eloszlás kb.: ⅓ flashcard, ⅓ multiple_choice, ⅕ true_false, ⅕ cloze.

KÖTELEZŐ SZABÁLYOK:
- MINDEN szöveg A FORRÁS NYELVÉN (a szakkifejezéseket úgy hagyd, ahogy a forrás írja).
- MINDEN kérdéshez kötelező a `sourceQuote` mező: **SZÓ SZERINTI, 4–15 szavas idézet
  a forrásszövegből**, ami alátámasztja a helyes választ. NE fogalmazd át — másold ki
  pontosan (egy determinisztikus ellenőrző karakterre nézi, whitespace-normalizálva).
- Csak a forrásban szereplő tényekből dolgozz. Ha valami nincs egyértelműen a forrásban → ne kérdezd.
- multiple_choice: pontosan 4 opció, erős, hihető distractorokkal; `correct` index 0-3.
- true_false: `correct` bool, az állítás egyértelműen igaz vagy hamis.
- cloze: a `text`-ben {{c1}}, {{c2}}… jelölés, az `answers` tömb ugyanannyi elemmel, sorrendben.
- difficulty: "easy" | "medium" | "hard".
- id-k: <topic_id>_001, <topic_id>_002, ... (3 jegy, nullákkal kiegészítve).

A VÁLASZOD CSAK VALID JSON LEGYEN — semmi magyarázat, semmi markdown blokk, CSAK a nyers JSON.

SÉMA (pontosan ezt a struktúrát add, semmi extra mező):
{
  "id": "<topic_id>",
  "subjectId": "<subject_id>",
  "name": "<a forrásfájl első sora, pl. 'D2. A naprendszer...'>",
  "source": "<forrás megnevezése, pl. fájlnév vagy fejezet (<code>)>",
  "unlockCardId": "",
  "questions": [
    { "id": "<topic_id>_001", "type": "flashcard", "front": "...", "back": "...",
      "sourceSection": "...", "difficulty": "easy", "sourceQuote": "<szó szerint a forrásból>" },
    { "id": "<topic_id>_002", "type": "multiple_choice", "text": "...",
      "options": ["A","B","C","D"], "correct": 0, "explanation": "...",
      "sourceSection": "...", "difficulty": "medium", "sourceQuote": "..." },
    { "id": "<topic_id>_003", "type": "true_false", "statement": "...", "correct": true,
      "explanation": "...", "sourceSection": "...", "difficulty": "easy", "sourceQuote": "..." },
    { "id": "<topic_id>_004", "type": "cloze", "text": "A {{c1}} a {{c2}}.", "answers": ["x","y"],
      "explanation": "...", "sourceSection": "...", "difficulty": "medium", "sourceQuote": "..." }
  ]
}"""


def extract_json(raw: str) -> dict:
    """A model néha markdown-blokkba vagy bevezető mondat mögé teszi a JSON-t —
    robusztusan kibontjuk (nem csak akkor, ha a ``` a legelső karakter)."""
    raw = raw.strip()
    # 1) Ha van ```json ... ``` (vagy ``` ... ```) blokk BÁRHOL, annak a tartalmát vesszük.
    fence = re.search(r"```(?:json)?\s*(.*?)\s*```", raw, re.DOTALL)
    if fence:
        raw = fence.group(1).strip()
    else:
        # 2) Különben a legkülső {...} objektumra szűkítünk (bevezető/záró próza levágása).
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            raw = raw[start:end + 1]
    return json.loads(raw.strip())


def build_user_message(topic_id: str, subject_id: str, code: str, source_text: str) -> str:
    first_line = source_text.split("\n", 1)[0].strip() or f"{code}."
    return (
        f"Tétel-id (a `id` mezőhöz): {topic_id}\n"
        f"Tantárgy (`subjectId` mezőhöz): {subject_id}\n"
        f"Tétel-kód: {code}\n"
        f"Tétel teljes neve (a `name` mezőhöz, szó szerint): {first_line}\n\n"
        f"=== FORRÁSSZÖVEG ===\n{source_text}\n=== FORRÁSSZÖVEG VÉGE ===\n\n"
        "Generálj kérdéseket az atomi-tény módszerrel (12–28 db), pontosan a sémában leírt formátumban. "
        "Minden kérdéshez kötelező a `sourceQuote` szó szerint a forrásból. Csak a nyers JSON-t add vissza."
    )


def main():
    parser = argparse.ArgumentParser(
        description="Tome kérdésgeneráló (Claude + sourceQuote-horgony)"
    )
    parser.add_argument("--input", required=True, help="Forrás szövegfájl (.txt)")
    parser.add_argument("--output", required=True, help="Kimeneti JSON fájl (src/themes/<téma>/topics/<id>.json)")
    parser.add_argument("--topic-id", required=True, help="Tétel azonosítója (pl. demo_02)")
    parser.add_argument("--subject-id", default="demo", help="Tantárgy ID (a subjects.js-ből)")
    parser.add_argument("--code", required=True, help="Tétel-kód (pl. D2)")
    parser.add_argument("--model", default="claude-opus-4-8", help="Claude model ID")
    parser.add_argument("--effort", default="high",
                        choices=["low", "medium", "high", "xhigh", "max"],
                        help="output_config.effort — min. 'high' ajánlott")
    parser.add_argument("--max-tokens", type=int, default=32000,
                        help="max_tokens (streaming kötelező > ~16k)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Csak a prompt-okat írja ki, API hívás nélkül")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"HIBA: Nem létezik: {args.input}", file=sys.stderr)
        sys.exit(1)
    with open(args.input, encoding="utf-8") as f:
        source_text = f.read()
    if not source_text.strip():
        print(f"HIBA: Üres fájl: {args.input}", file=sys.stderr)
        sys.exit(1)

    user_message = build_user_message(args.topic_id, args.subject_id, args.code, source_text)

    if args.dry_run:
        print("=== SYSTEM PROMPT ===")
        print(SYSTEM_PROMPT)
        print("\n=== USER MESSAGE (első 800 kar.) ===")
        print(user_message[:800])
        print(f"\n... ({len(source_text)} karakter forrás összesen)")
        sys.exit(0)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("HIBA: ANTHROPIC_API_KEY nincs beállítva.", file=sys.stderr)
        print('  Beállítás: setx ANTHROPIC_API_KEY "sk-ant-..."  (új PowerShell-ablak)', file=sys.stderr)
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    print(f"Generálás: {args.topic_id} ({args.model}, effort={args.effort}, max_tokens={args.max_tokens})...",
          flush=True)

    # Streaming kötelező magas max_tokens + adaptív gondolkodás mellett.
    raw_parts = []
    with client.messages.stream(
        model=args.model,
        max_tokens=args.max_tokens,
        thinking={"type": "adaptive"},
        output_config={"effort": args.effort},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    ) as stream:
        for text in stream.text_stream:
            raw_parts.append(text)
        final = stream.get_final_message()
    raw = "".join(raw_parts)

    usage = final.usage
    cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
    cache_create = getattr(usage, "cache_creation_input_tokens", 0) or 0
    print(f"  Tokens: input={usage.input_tokens}"
          f" (cache_read={cache_read}, cache_create={cache_create}),"
          f" output={usage.output_tokens}, stop={final.stop_reason}")

    if final.stop_reason == "max_tokens":
        print("FIGYELEM: max_tokens limit elérve — a JSON valószínűleg csonka.", file=sys.stderr)

    try:
        data = extract_json(raw)
    except json.JSONDecodeError as e:
        print(f"HIBA: Az API válasza nem valid JSON: {e}", file=sys.stderr)
        print("--- Nyers válasz (első 2000 kar.) ---", file=sys.stderr)
        print(raw[:2000], file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    q_count = len(data.get("questions", []))
    types = {}
    for q in data.get("questions", []):
        types[q.get("type")] = types.get(q.get("type"), 0) + 1
    print(f"OK: {q_count} kérdés mentve → {args.output}  |  eloszlás: {types}")
    print(f"  Ellenőrzés: python scripts/validate_topic.py {args.output} {args.topic_id} --source {args.input}")


if __name__ == "__main__":
    main()
