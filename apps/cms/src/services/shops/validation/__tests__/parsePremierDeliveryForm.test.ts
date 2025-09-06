import { parsePremierDeliveryForm } from "../parsePremierDeliveryForm";

describe("parsePremierDeliveryForm", () => {
  it("extracts arrays and trims values", () => {
    const fd = new FormData();
    fd.append("regions", " US ");
    fd.append("regions", "");
    fd.append("regions", "EU");
    fd.append("windows", " 09-17 ");
    fd.append("windows", " ");
    fd.append("carriers", " ups ");
    fd.append("carriers", "");

    const result = parsePremierDeliveryForm(fd);
    expect(result.data).toEqual({
      regions: ["US", "EU"],
      windows: ["09-17"],
      carriers: ["ups"],
    });
  });

  it("validates window format", () => {
    const fd = new FormData();
    fd.append("windows", "123");

    const result = parsePremierDeliveryForm(fd);
    expect(result.errors?.windows).toBeTruthy();
  });

  it("handles optional surcharge and serviceLabel", () => {
    const fd = new FormData();
    fd.append("regions", "US");
    fd.append("windows", "09-17");
    fd.append("carriers", "ups");
    fd.set("surcharge", "5");
    fd.set("serviceLabel", " label ");

    const { data } = parsePremierDeliveryForm(fd);
    expect(data).toEqual({
      regions: ["US"],
      windows: ["09-17"],
      carriers: ["ups"],
      surcharge: 5,
      serviceLabel: "label",
    });

    const fd2 = new FormData();
    const result2 = parsePremierDeliveryForm(fd2);
    expect(result2.data?.surcharge).toBeUndefined();
    expect(result2.data?.serviceLabel).toBeUndefined();
  });
});
