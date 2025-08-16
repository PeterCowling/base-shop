export function parseMultilingualInput(name, locales) {
    const match = name.match(new RegExp(`^(title|desc)_(${locales.join("|")})$`));
    if (!match)
        return null;
    const [, field, locale] = match;
    return { field, locale };
}
