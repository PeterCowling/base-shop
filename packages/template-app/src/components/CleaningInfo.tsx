import cleaning from "../../../../data/rental/cleaning.json";

// i18n-exempt -- TMP-001: template-only labels; JSON data is user-provided

export function CleaningInfo() {
  return (
    <section className="space-y-4">
      {/* i18n-exempt -- TMP-001: non-critical template label */}
      <h2 className="text-lg font-semibold">Cleaning Information</h2>
      <div className="space-y-1">
        {/* i18n-exempt -- TMP-001: non-critical template label */}
        <h3 className="font-medium">Garments</h3>
        <p>{cleaning.garment}</p>
      </div>
      <div className="space-y-1">
        {/* i18n-exempt -- TMP-001: non-critical template label */}
        <h3 className="font-medium">Reusable Bags</h3>
        <p>{cleaning.reusableBag}</p>
      </div>
    </section>
  );
}

export default CleaningInfo;
