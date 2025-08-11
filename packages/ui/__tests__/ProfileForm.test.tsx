import { fireEvent, render, screen } from "@testing-library/react";
import ProfileForm from "../src/components/account/ProfileForm";

describe("ProfileForm", () => {
  it("marks fields as required", () => {
    render(<ProfileForm />);
    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
  });

  it("shows client-side validation errors", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({} as any);
    render(<ProfileForm />);
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    fetchSpy.mockRestore();
  });
});
