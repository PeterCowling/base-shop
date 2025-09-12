import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QAModule, type QAItem } from "./QAModule";

function Wrapper() {
  const [items, setItems] = React.useState<QAItem[]>([]);
  const [question, setQuestion] = React.useState("");

  return (
    <div>
      <input
        aria-label="question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button
        onClick={() =>
          setItems((prev) => [...prev, { question, answer: "Pending" }])
        }
      >
        Post
      </button>
      <QAModule items={items} />
    </div>
  );
}

describe("QAModule dynamic updates", () => {
  it("adds a new question to the list when posted", async () => {
    render(<Wrapper />);
    expect(document.querySelectorAll("details")).toHaveLength(0);

    await userEvent.type(screen.getByLabelText("question"), "What is React?");
    await userEvent.click(screen.getByText("Post"));

    expect(document.querySelectorAll("details")).toHaveLength(1);
    expect(screen.getByText("What is React?")).toBeInTheDocument();
  });
});
