import { render, screen } from "@testing-library/react";

import ProfileForm from "../src/components/account/ProfileForm";

describe("ProfileForm accessibility", () => {
  it("associates inputs with labels", () => {
    render(<ProfileForm />);
    expect(screen.getByLabelText(/name/i)).toBeRequired();
    expect(screen.getByLabelText(/email/i)).toBeRequired();
  });

  it("does not render unlabeled fields", () => {
    render(<ProfileForm />);
    expect(screen.queryByLabelText(/password/i)).toBeNull();
  });
});
