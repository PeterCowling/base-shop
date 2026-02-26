"""Phonetic feature extraction for naming candidates."""

VOWELS = set('aeiouàèìòùáéíóú')
ITALIAN_SUFFIXES = ['ova', 'ella', 'ina', 'ora', 'eva', 'elo', 'ari', 'eno']


def syllable_count(name: str) -> int:
    """Estimate syllable count by counting vowel groups."""
    name_lower = name.lower()
    count = 0
    in_vowel_group = False
    for ch in name_lower:
        if ch in VOWELS:
            if not in_vowel_group:
                count += 1
                in_vowel_group = True
        else:
            in_vowel_group = False
    return max(1, count)


def vowel_ratio(name: str) -> float:
    """Fraction of characters that are vowels."""
    if not name:
        return 0.0
    name_lower = name.lower()
    vowel_count = sum(1 for ch in name_lower if ch in VOWELS)
    return vowel_count / len(name)


def onset_complexity(name: str) -> int:
    """Number of consonants before the first vowel."""
    name_lower = name.lower()
    count = 0
    for ch in name_lower:
        if ch in VOWELS:
            break
        # Only count alphabetic characters
        if ch.isalpha():
            count += 1
    return count


def has_italian_suffix(name: str) -> bool:
    """True if name ends with a common Italian brand suffix."""
    name_lower = name.lower()
    return any(name_lower.endswith(sfx) for sfx in ITALIAN_SUFFIXES)


def phonetic_features(name: str) -> dict:
    """Extract all phonetic features. Returns dict with:
    syllable_count, vowel_ratio, onset_complexity, has_italian_suffix
    """
    return {
        'syllable_count': syllable_count(name),
        'vowel_ratio': vowel_ratio(name),
        'onset_complexity': onset_complexity(name),
        'has_italian_suffix': has_italian_suffix(name),
    }
