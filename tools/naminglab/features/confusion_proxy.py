"""Phonetic confusion proxy — estimates similarity risk within a batch of names.

Uses double-Metaphone encoding (via a simple implementation, no external library)
to identify names that sound similar. Two names are 'confused' if they share
the same Metaphone code.
"""


def simple_metaphone(name: str) -> str:
    """Simplified Metaphone encoding for brand-name tokens.

    Rules (applied in order, on uppercased input with vowels tracked):
    1. Strip trailing S if name ends in S and len > 4
    2. Replace: PH->F, CK->K, SCH->SK, QU->KW
    3. Remove silent initial letters: KN->N, GN->N, AE->E, WR->R
    4. Replace vowel clusters at start with single 'A'
    5. Drop all remaining vowels (not at start)
    6. Compress consecutive identical consonants to one
    7. Replace: C->K, G->K (before e/i/y), J->Y, V->F, Z->S
    8. Return first 6 chars of result (or full if shorter)
    """
    if not name:
        return ''

    s = name.upper()

    # Step 1: Strip trailing S if name ends in S and len > 4
    if len(s) > 4 and s.endswith('S'):
        s = s[:-1]

    # Step 2: Replace digraphs/trigraphs
    s = s.replace('SCH', 'SK')
    s = s.replace('PH', 'F')
    s = s.replace('CK', 'K')
    s = s.replace('QU', 'KW')

    # Step 3: Remove silent initial letters
    if s.startswith('KN'):
        s = s[1:]
    elif s.startswith('GN'):
        s = s[1:]
    elif s.startswith('AE'):
        s = s[1:]
    elif s.startswith('WR'):
        s = s[1:]

    if not s:
        return ''

    # Step 4: Replace vowel clusters at start with single 'A'
    VOWELS_UPPER = set('AEIOU')
    # Find the extent of the initial vowel cluster
    i = 0
    while i < len(s) and s[i] in VOWELS_UPPER:
        i += 1
    if i > 0:
        s = 'A' + s[i:]

    if not s:
        return 'A'

    # Step 5: Drop all remaining vowels (not at start — first char is kept as-is)
    # First char is preserved; drop internal vowels
    result = s[0]
    for ch in s[1:]:
        if ch not in VOWELS_UPPER:
            result += ch

    # Step 6: Compress consecutive identical consonants to one
    compressed = result[0] if result else ''
    for ch in result[1:]:
        if ch != compressed[-1]:
            compressed += ch
    result = compressed

    # Step 7: Apply phonetic mappings
    # C->K, G->K (simple — not context-sensitive for brand names), J->Y, V->F, Z->S
    mapped = ''
    for ch in result:
        if ch == 'C':
            mapped += 'K'
        elif ch == 'G':
            mapped += 'K'
        elif ch == 'J':
            mapped += 'Y'
        elif ch == 'V':
            mapped += 'F'
        elif ch == 'Z':
            mapped += 'S'
        else:
            mapped += ch
    result = mapped

    # Compress again after mapping (e.g. GG -> KK -> K)
    compressed = result[0] if result else ''
    for ch in result[1:]:
        if ch != compressed[-1]:
            compressed += ch
    result = compressed

    # Step 8: Return first 6 chars
    return result[:6]


def batch_confusion_scores(names: list[str]) -> dict[str, float]:
    """For each name in the batch, compute its confusion proxy score:

    confusion_score = (number of other names in batch with same Metaphone code) / len(names)

    A high score means many names in the batch sound similar to this one.
    Returns dict mapping name -> confusion_score (0.0 to 1.0).
    """
    if not names:
        return {}

    n = len(names)
    codes = {name: simple_metaphone(name) for name in names}

    # Count occurrences of each code
    from collections import Counter
    code_counts: Counter = Counter(codes.values())

    scores: dict[str, float] = {}
    for name in names:
        code = codes[name]
        # Number of OTHER names with same code
        same_code_count = code_counts[code] - 1
        scores[name] = same_code_count / n

    return scores


def confusion_proxy_features(name: str, batch: list[str]) -> dict:
    """Features for a single name given its batch context:
    {metaphone_code, confusion_score, is_unique_in_batch}
    """
    code = simple_metaphone(name)
    # Ensure name is in batch for score computation
    full_batch = batch if name in batch else [name] + batch
    scores = batch_confusion_scores(full_batch)
    confusion_score = scores.get(name, 0.0)
    return {
        'metaphone_code': code,
        'confusion_score': confusion_score,
        'is_unique_in_batch': confusion_score == 0.0,
    }
