import yargs, { type Argv } from "yargs";
import { hideBin } from "yargs/helpers";

import { registerGuideCommands } from "./commands/guide";
import { registerHowtoCommand } from "./commands/howto";
import { registerExperienceCommands } from "./commands/experience";
import { registerAssistanceCommand } from "./commands/assistance";

export function createCli(argv: string[] = process.argv): Argv<unknown> {
  let cli = yargs(hideBin(argv))
    .scriptName("scaffold")
    .strict()
    .help()
    .showHelpOnFail(true);

  cli = registerGuideCommands(cli);
  cli = registerHowtoCommand(cli);
  cli = registerExperienceCommands(cli);
  cli = registerAssistanceCommand(cli);

  return cli.demandCommand(1, "Pass a subcommand (guide, howto, experience, etc).");
}