import "../../../../../../test/resetNextMocks";
import { render } from "@testing-library/react";
import { HeartIcon, PersonIcon, StarIcon } from "@radix-ui/react-icons";
import { Icon, IconName } from "../Icon";

describe("Icon", () => {
  const icons: Record<IconName, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    star: StarIcon,
    heart: HeartIcon,
    user: PersonIcon,
  };

  it.each(Object.entries(icons))("renders %s icon", (name, RadixIcon) => {
    const { container } = render(<Icon name={name as IconName} />);
    const { container: expected } = render(<RadixIcon />);
    expect(container.firstChild?.isEqualNode(expected.firstChild)).toBe(true);
  });
});
