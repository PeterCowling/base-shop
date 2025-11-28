import type { Decorator, Meta, StoryObj } from "@storybook/nextjs";
import { tokens as baseTokens } from "@themes-local/base/src/tokens";
import { tokens as brandxTokens } from "@themes-local/brandx/src/tailwind-tokens";

const themeTokens: Record<string, Record<string, any>> = {
  base: baseTokens as unknown as Record<string, any>,
  brandx: brandxTokens as Record<string, string>,
};

function normalize(map: Record<string, any>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, val] of Object.entries(map)) {
    if (typeof val === "string") out[name] = val;
    else out[name] = val.light;
  }
  return out;
}
const withTokens: Decorator = (Story, context) => {
  const { tokens } = context.globals as { tokens: string };
  const cls = document.documentElement.classList;
  cls.remove("theme-base", "theme-brandx");
  cls.add(`theme-${tokens}`);
  return <Story />;
};

const meta: Meta = {
  title: "Tokens/All",
  parameters: { layout: "centered" },
  tags: ["ci"],
  decorators: [withTokens],
};
export default meta;

type Story = StoryObj;

export const Overview: Story = {
  render: (_args, { globals }) => {
    const theme = (globals.tokens as string) || "base";
    const raw = themeTokens[theme] ?? baseTokens;
    const tokens = normalize(raw);

    const entries = Object.entries(tokens);
    const groups = {
      colors: entries.filter(([n]) => n.startsWith("--color")),
      fonts: entries.filter(([n]) => n.startsWith("--font")),
      spacing: entries.filter(([n]) => n.startsWith("--space")),
      radius: entries.filter(([n]) => n.startsWith("--radius")),
      shadows: entries.filter(([n]) => n.startsWith("--shadow")),
    } as const;

    return (
      <div className="space-y-8 p-4">
        {Object.entries(groups).map(([title, group]) => (
          <div key={title} className="space-y-2">
            <h2 className="text-lg font-semibold capitalize">{title}</h2>
            <table className="min-w-full border-collapse text-sm">
              <tbody>
                {group.map(([name, value]) => (
                  <tr key={name} className="border-b">
                    <td className="py-1 pr-4 font-mono text-xs">{name}</td>
                    <td className="px-2 py-1">
                      {name.startsWith("--color") ? (
                        <span
                          className="inline-block h-4 w-4 rounded"
                          style={{ backgroundColor: `hsl(${value})` }}
                        />
                      ) : name.startsWith("--radius") ? (
                        <span
                          className="bg-muted inline-block h-4 w-8"
                          style={{ borderRadius: value }}
                        />
                      ) : name.startsWith("--shadow") ? (
                        <span
                          className="inline-block h-4 w-8 bg-white"
                          style={{ boxShadow: value }}
                        />
                      ) : name.startsWith("--space") ? (
                        <span
                          className="bg-muted inline-block"
                          style={{ width: value, height: "1rem" }}
                        />
                      ) : (
                        <span style={{ fontFamily: value }}>Aa</span>
                      )}
                    </td>
                    <td className="py-1 pl-4 text-right font-mono text-xs">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  },
  // Help the test-runner detect the story has rendered
  play: async ({ canvasElement }) => {
    await Promise.resolve();
    const marker = document.createElement('span');
    marker.setAttribute('data-test', 'tokens-ready');
    canvasElement.appendChild(marker);
  },
};
