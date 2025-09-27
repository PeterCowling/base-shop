/* i18n-exempt file -- test copy for Q&A */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QAModule } from "../QAModule";

describe("QAModule", () => {
  it("renders questions and toggles answers", async () => {
    render(
      <QAModule items={[{ question: "What is X?", answer: "X is Y" }]} />
    );

    const question = screen.getByText("What is X?");
    const answer = screen.getByText("X is Y");

    expect(question).toBeInTheDocument();
    expect(answer).not.toBeVisible();

    await userEvent.click(question);
    expect(answer).toBeVisible();
  });
});
