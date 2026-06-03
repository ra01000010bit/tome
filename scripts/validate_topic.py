import argparse
import json
import re
import sys
import unicodedata


def normalize(s):
    s = s.lower()
    s = s.replace("-\n", "")        # soremeléses elválasztás feloldása
    # Ékezet-tolerancia: NFKD + kombináló jelek eltávolítása (á→a, ő→o, º→o ...).
    # A szavaknak így is egyezniük kell — csak a diakritikák/PDF-artefaktok engedékenyek;
    # a hallucináció-kiszűrés megmarad.
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.replace("–", "-").replace("—", "-")  # en/em-dash → kötőjel
    for ch in ("°", "º", "˚"):            # fok-jel variánsok eltávolítása
        s = s.replace(ch, "")
    for ch in ("„", "”", "“", "’", "‘", "‚", '"', "'"):  # idézőjel-variánsok eltávolítása
        s = s.replace(ch, "")
    s = re.sub(r"\s+", " ", s)      # whitespace (NBSP is) összevonása
    return s.strip()


VALID_DIFFICULTY = {"easy", "medium", "hard"}
VALID_TYPES = {"flashcard", "multiple_choice", "true_false", "cloze"}


def validate(data, topic_id, source_text, min_q, max_q, strict=True):
    errors = []
    if data.get("id") != topic_id:
        errors.append(f"id mismatch: '{data.get('id')}' != '{topic_id}'")
    if strict:
        for key in ("subjectId", "name", "source"):
            if not data.get(key):
                errors.append(f"hiányzó top-level kulcs: {key}")
    qs = data.get("questions", [])
    if not (min_q <= len(qs) <= max_q):
        errors.append(f"kérdésszám {len(qs)} a [{min_q},{max_q}] tartományon kívül")
    norm_source = normalize(source_text) if source_text is not None else None
    ids = set()
    id_pattern = re.compile(rf"^{re.escape(topic_id)}_\d{{3}}$")
    for i, q in enumerate(qs):
        qid = q.get("id")
        if qid in ids:
            errors.append(f"q[{i}] duplikált id: {qid}")
        ids.add(qid)
        if strict and qid and not id_pattern.match(qid):
            errors.append(f"q[{i}] id formátum hiba: '{qid}' (várt: {topic_id}_NNN)")
        qt = q.get("type")
        if qt not in VALID_TYPES:
            errors.append(f"q[{i}] ismeretlen típus: {qt}")
        if strict:
            d = q.get("difficulty")
            if d not in VALID_DIFFICULTY:
                errors.append(f"q[{i}] difficulty érvénytelen: '{d}' (várt: easy/medium/hard)")
            if not (q.get("sourceSection") or "").strip():
                errors.append(f"q[{i}] hiányzó sourceSection")
        if qt == "flashcard":
            if not (q.get("front") or "").strip() or not (q.get("back") or "").strip():
                errors.append(f"q[{i}] flashcard: hiányzó front/back")
        if qt == "multiple_choice":
            opts = q.get("options", [])
            if len(opts) != 4:
                errors.append(f"q[{i}] mc: {len(opts)} opció (kell 4)")
            for j, opt in enumerate(opts):
                if not isinstance(opt, str) or not opt.strip():
                    errors.append(f"q[{i}] mc: üres opció [{j}]")
            seen = set()
            for opt in opts:
                if isinstance(opt, str):
                    n = opt.strip().lower()
                    if n in seen:
                        errors.append(f"q[{i}] mc: duplikált opció: '{opt}'")
                    seen.add(n)
            c = q.get("correct")
            if not isinstance(c, int) or not (0 <= c < len(opts)):
                errors.append(f"q[{i}] mc: érvénytelen correct index")
            if strict and not (q.get("explanation") or "").strip():
                errors.append(f"q[{i}] mc: hiányzó explanation")
            if strict and not (q.get("text") or "").strip():
                errors.append(f"q[{i}] mc: hiányzó text")
        if qt == "true_false":
            if not isinstance(q.get("correct"), bool):
                errors.append(f"q[{i}] tf: correct nem bool")
            if strict and not (q.get("statement") or "").strip():
                errors.append(f"q[{i}] tf: hiányzó statement")
            if strict and not (q.get("explanation") or "").strip():
                errors.append(f"q[{i}] tf: hiányzó explanation")
        if qt == "cloze":
            text = q.get("text", "")
            ph = re.findall(r"\{\{c\d+\}\}", text)
            ans = q.get("answers", [])
            if len(ph) != len(ans):
                errors.append(f"q[{i}] cloze: {len(ph)} placeholder / {len(ans)} válasz")
            if strict:
                # Cloze placeholder-név uniqueness: c1, c2... csak egyszer.
                names = [m.group(0) for m in re.finditer(r"\{\{c\d+\}\}", text)]
                seen = set()
                for nm in names:
                    if nm in seen:
                        errors.append(f"q[{i}] cloze: ismétlődő placeholder-név: {nm}")
                    seen.add(nm)
            if strict:
                for j, a in enumerate(ans):
                    if not isinstance(a, str) or not a.strip():
                        errors.append(f"q[{i}] cloze: üres answer [{j}]")
                if not (q.get("explanation") or "").strip():
                    errors.append(f"q[{i}] cloze: hiányzó explanation")
        if norm_source is not None:
            quote = (q.get("sourceQuote") or "").strip()
            if len(quote) < 8:
                errors.append(f"q[{i}] hiányzó/túl rövid sourceQuote")
            elif normalize(quote) not in norm_source:
                errors.append(f"q[{i}] sourceQuote NINCS a forrásban: \"{quote[:60]}\"")
    return errors


def main():
    ap = argparse.ArgumentParser(description="Topic JSON validátor + sourceQuote-horgony")
    ap.add_argument("json_path")
    ap.add_argument("topic_id")
    ap.add_argument("--source", default=None, help="A tétel forrás-szövegfájlja")
    ap.add_argument("--min", type=int, default=12)
    ap.add_argument("--max", type=int, default=28)
    ap.add_argument("--lax", action="store_true",
                    help="Régi (laza) ellenőrzés: csak alapsémát checkel.")
    args = ap.parse_args()

    with open(args.json_path, encoding="utf-8") as f:
        data = json.load(f)
    source_text = None
    if args.source:
        with open(args.source, encoding="utf-8") as f:
            source_text = f.read()

    errors = validate(data, args.topic_id, source_text, args.min, args.max,
                      strict=not args.lax)
    qs = data.get("questions", [])
    types = {}
    for q in qs:
        types[q.get("type")] = types.get(q.get("type"), 0) + 1
    print(f"Kérdések: {len(qs)} | Eloszlás: {types}")
    if errors:
        print("HIBÁK:")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    print("OK — nincs hiba.")


if __name__ == "__main__":
    main()
