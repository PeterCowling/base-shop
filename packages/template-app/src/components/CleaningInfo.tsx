import cleaning from "../../../../data/rental/cleaning.json";

export function CleaningInfo() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Cleaning Information</h2>
      <div className="space-y-1">
        <h3 className="font-medium">Garments</h3>
        <p>{cleaning.garment}</p>
      </div>
      <div className="space-y-1">
        <h3 className="font-medium">Reusable Bags</h3>
        <p>{cleaning.reusableBag}</p>
      </div>
    </section>
  );
}

export default CleaningInfo;
