"""Orthographic feature extraction for naming candidates."""

_DEFAULT_COMMON_BIGRAMS: set[str] = {
    'an', 'en', 'in', 'on', 'un', 'al', 'el', 'il', 'ol', 'ul',
    'ar', 'er', 'ir', 'or', 'ur', 'at', 'et', 'it', 'ot', 'ut',
    'la', 'le', 'li', 'lo', 'lu', 'ra', 're', 'ri', 'ro', 'ru',
    'va', 've', 'vi', 'vo', 'na', 'ne', 'ni', 'no', 'nu',
}

_COMPOUND_WORDS = {'held', 'worn', 'stay', 'stow', 'show'}


def name_length(name: str) -> int:
    """Character count."""
    return len(name)


def bigram_frequency(name: str, common_bigrams: set[str] | None = None) -> float:
    """Fraction of bigrams that appear in common_bigrams set.

    If common_bigrams is None, use a hardcoded set of common English/Italian bigrams:
    {'an', 'en', 'in', 'on', 'un', 'al', 'el', 'il', 'ol', 'ul',
     'ar', 'er', 'ir', 'or', 'ur', 'at', 'et', 'it', 'ot', 'ut',
     'la', 'le', 'li', 'lo', 'lu', 'ra', 're', 'ri', 'ro', 'ru',
     'va', 've', 'vi', 'vo', 'na', 'ne', 'ni', 'no', 'nu'}
    """
    if common_bigrams is None:
        common_bigrams = _DEFAULT_COMMON_BIGRAMS
    name_lower = name.lower()
    if len(name_lower) < 2:
        return 0.0
    bigrams = [name_lower[i:i+2] for i in range(len(name_lower) - 1)]
    if not bigrams:
        return 0.0
    matched = sum(1 for bg in bigrams if bg in common_bigrams)
    return matched / len(bigrams)


def suffix_class(name: str) -> str:
    """Classify name suffix into one of: 'ova_type', 'ella_type', 'ina_type',
    'ora_type', 'elo_type', 'ari_type', 'compound', 'other'.

    'ova_type': ends in -ova, -ova suffix family
    'ella_type': ends in -ella, -ello
    'ina_type': ends in -ina, -ino
    'ora_type': ends in -ora, -ore
    'elo_type': ends in -elo, -ela
    'ari_type': ends in -ari, -aro
    'compound': contains a common English word (held, worn, stay, stow, show)
    'other': none of the above
    """
    name_lower = name.lower()

    if name_lower.endswith('ova'):
        return 'ova_type'
    if name_lower.endswith('ella') or name_lower.endswith('ello'):
        return 'ella_type'
    if name_lower.endswith('ina') or name_lower.endswith('ino'):
        return 'ina_type'
    if name_lower.endswith('ora') or name_lower.endswith('ore'):
        return 'ora_type'
    if name_lower.endswith('elo') or name_lower.endswith('ela'):
        return 'elo_type'
    if name_lower.endswith('ari') or name_lower.endswith('aro'):
        return 'ari_type'
    for word in _COMPOUND_WORDS:
        if word in name_lower:
            return 'compound'
    return 'other'


def orthographic_features(name: str) -> dict:
    """Extract all orthographic features. Returns dict with:
    name_length, bigram_frequency, suffix_class
    """
    return {
        'name_length': name_length(name),
        'bigram_frequency': bigram_frequency(name),
        'suffix_class': suffix_class(name),
    }
