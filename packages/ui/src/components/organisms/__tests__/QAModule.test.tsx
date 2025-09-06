import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QAModule } from "../QAModule";

describe("QAModule", () => {
  it("renders questions and toggles answers", async () => {
    render(
      <QAModule items={[{ question: "What is X?", answer: "X is Y" }]} />
    );

    expect(screen.getByText("What is X?")).toBeInTheDocument();
    expect(screen.queryByText("X is Y")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("What is X?"));
    expect(screen.getByText("X is Y")).toBeInTheDocument();
  });
});
