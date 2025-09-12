import "../../../../../../test/resetNextMocks";
import { render } from "@testing-library/react";
import { Icon, type IconName } from "../Icon";
import { StarIcon, HeartIcon, PersonIcon } from "@radix-ui/react-icons";
import type { ComponentType } from "react";

describe("Icon", () => {
  const icons: Record<IconName, ComponentType> = {
    star: StarIcon,
    heart: HeartIcon,
    user: PersonIcon,
  };

  it.each(Object.entries(icons))("renders %s icon", (name, Expected) => {
    const { container } = render(<Icon name={name as IconName} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();

    const { container: expectedContainer } = render(<Expected />);
    const expectedPath = expectedContainer
      .querySelector("path")
      ?.getAttribute("d") as string;
    const path = svg?.querySelector("path");
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute("d", expectedPath);
  });
});
