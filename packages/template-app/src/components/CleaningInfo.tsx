import cleaning from "../../../../data/rental/cleaning.json";

export default function CleaningInfo() {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">Bag Policy</h2>
      <p>{cleaning.reusableBagPolicy}</p>
    </section>
  );
}
