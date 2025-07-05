import type { Meta, StoryObj } from "@storybook/react";
import DataTable from "./DataTable";
interface Row {
    name: string;
    age: number;
}
declare const meta: Meta<typeof DataTable<Row>>;
export default meta;
export declare const Default: StoryObj<typeof DataTable<Row>>;
//# sourceMappingURL=DataTable.stories.d.ts.map