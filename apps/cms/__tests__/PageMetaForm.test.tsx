import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PageMetaForm from "../src/app/cms/configurator/steps/StepAdditionalPages/PageMetaForm";

function Wrapper({ onSubmit }: { onSubmit: (v: any) => void }) {
  const [slug, setSlug] = React.useState("");
  const [title, setTitle] = React.useState<Record<string, string>>({ en: "" });
  const [desc, setDesc] = React.useState<Record<string, string>>({ en: "" });
  const [image, setImage] = React.useState<Record<string, string>>({ en: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!slug) newErrors.slug = "Slug is required";
    if (!title.en) newErrors.title = "Title is required";
    if (!desc.en) newErrors.desc = "Description is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onSubmit({ slug, title, desc, image });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PageMetaForm
        languages={["en"]}
        slug={slug}
        setSlug={setSlug}
        title={title}
        setTitle={setTitle}
        desc={desc}
        setDesc={setDesc}
        image={image}
        setImage={setImage}
      />
      {errors.slug && <p role="alert">{errors.slug}</p>}
      {errors.title && <p role="alert">{errors.title}</p>}
      {errors.desc && <p role="alert">{errors.desc}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}

describe("PageMetaForm", () => {
  it("shows validation errors on empty submission", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<Wrapper onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(screen.getByText("Slug is required")).toBeInTheDocument();
    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Description is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid data", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<Wrapper onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/slug/i), "my-slug");
    await user.type(screen.getByLabelText(/title \(en\)/i), "My Title");
    await user.type(screen.getByLabelText(/description \(en\)/i), "My description");

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      slug: "my-slug",
      title: { en: "My Title" },
      desc: { en: "My description" },
      image: { en: "" },
    });
  });

  it("updates meta fields on input change", async () => {
    const user = userEvent.setup();
    render(<Wrapper onSubmit={jest.fn()} />);

    const titleInput = screen.getByLabelText(/title \(en\)/i) as HTMLInputElement;
    await user.type(titleInput, "Hello");
    expect(titleInput).toHaveValue("Hello");

    const descInput = screen.getByLabelText(/description \(en\)/i) as HTMLInputElement;
    await user.type(descInput, "World");
    expect(descInput).toHaveValue("World");
  });
});

