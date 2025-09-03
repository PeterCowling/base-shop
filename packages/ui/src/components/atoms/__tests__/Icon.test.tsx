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
    const { container: expected } = render(<Expected />);
    expect(container.innerHTML).toBe(expected.innerHTML);
  });
});
