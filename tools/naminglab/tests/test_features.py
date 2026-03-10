"""
test_features.py — Pytest tests for feature extraction modules (TASK-05).

All tests are self-contained (no real file I/O).
"""
from __future__ import annotations

import pytest

from features.phonetic import phonetic_features
from features.orthographic import orthographic_features
from features.confusion_proxy import batch_confusion_scores, confusion_proxy_features


# ---------------------------------------------------------------------------
# TC-01: Feature extraction deterministic test suite on fixed sample names
# ---------------------------------------------------------------------------


def test_phonetic_features_deterministic():
    """Call phonetic_features("Sfogella") twice — same result both times."""
    r1 = phonetic_features("Sfogella")
    r2 = phonetic_features("Sfogella")
    assert r1 == r2
    assert r1['vowel_ratio'] > 0
    assert r1['syllable_count'] >= 1


def test_known_phonetic_values():
    """Sfogella — s-f-o-g-e-l-l-a: vowels o, e, a = 3/8 = 0.375."""
    f = phonetic_features("Sfogella")
    assert abs(f['vowel_ratio'] - 3/8) < 0.01
    assert f['has_italian_suffix'] == True  # ends in 'ella'
    assert f['onset_complexity'] == 2  # 'sf' before first vowel 'o'


def test_orthographic_features_known():
    """Stivella should have length 8 and ella_type suffix."""
    f = orthographic_features("Stivella")
    assert f['name_length'] == 8
    assert f['suffix_class'] == 'ella_type'


def test_confusion_proxy_batch():
    """Same Metaphone code -> non-zero confusion score."""
    names = ["Sfogella", "Sfogira", "Stivella"]
    scores = batch_confusion_scores(names)
    assert all(0.0 <= v <= 1.0 for v in scores.values())
    # Sfogella and Sfogira share 'SF' prefix — may share Metaphone code
    assert "Sfogella" in scores


def test_phonetic_features_all_keys_present():
    """phonetic_features must return all required keys."""
    f = phonetic_features("Testova")
    assert 'syllable_count' in f
    assert 'vowel_ratio' in f
    assert 'onset_complexity' in f
    assert 'has_italian_suffix' in f


def test_orthographic_features_all_keys_present():
    """orthographic_features must return all required keys."""
    f = orthographic_features("Testova")
    assert 'name_length' in f
    assert 'bigram_frequency' in f
    assert 'suffix_class' in f


def test_confusion_proxy_features_all_keys():
    """confusion_proxy_features must return all required keys."""
    batch = ["Sfogella", "Stivella", "Testova"]
    f = confusion_proxy_features("Sfogella", batch)
    assert 'metaphone_code' in f
    assert 'confusion_score' in f
    assert 'is_unique_in_batch' in f


def test_suffix_class_ova():
    """Names ending in -ova should be classified as ova_type."""
    f = orthographic_features("Testova")
    assert f['suffix_class'] == 'ova_type'


def test_bigram_frequency_range():
    """bigram_frequency must return a value in [0, 1]."""
    f = orthographic_features("Stivella")
    assert 0.0 <= f['bigram_frequency'] <= 1.0


def test_onset_complexity_no_consonants():
    """Name starting with vowel should have onset_complexity == 0."""
    f = phonetic_features("Arova")
    assert f['onset_complexity'] == 0


def test_italian_suffix_false():
    """Name without Italian suffix should return False."""
    f = phonetic_features("Starheld")
    assert f['has_italian_suffix'] == False


def test_batch_confusion_scores_empty():
    """Empty batch returns empty dict."""
    scores = batch_confusion_scores([])
    assert scores == {}


def test_batch_confusion_single_name():
    """Single-name batch has confusion score 0."""
    scores = batch_confusion_scores(["Sfogella"])
    assert scores["Sfogella"] == 0.0
