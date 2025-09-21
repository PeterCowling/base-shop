import { Button, Card, CardContent, Input, Tag } from "@/components/atoms/shadcn";
import { Tooltip } from "@/components/atoms";

import type { Role } from "@cms/auth/roles";

import type { InviteFormState } from "./useRbacManagementPanel";
import type { RoleDetail } from "../components/roleDetails";

type InviteUserFormProps = {
  roles: Role[];
  roleDetails: Record<Role, RoleDetail>;
  form: InviteFormState;
  helperText: string;
  isInviting: boolean;
  onFieldChange: (field: "name" | "email" | "password", value: string) => void;
  onToggleRole: (role: Role) => void;
  onSubmit: () => void;
  onReset: () => void;
};

export default function InviteUserForm({
  roles,
  roleDetails,
  form,
  helperText,
  isInviting,
  onFieldChange,
  onToggleRole,
  onSubmit,
  onReset,
}: InviteUserFormProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="min-w-0 text-base font-semibold text-foreground">Invite User</h3>
          <Tag className="shrink-0" variant="warning">Manual invite</Tag>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Name</span>
            <Input
              name="name"
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Email</span>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-foreground">Temporary password</span>
            <Input
              name="password"
              type="password"
              value={form.password}
              onChange={(event) => onFieldChange("password", event.target.value)}
            />
          </label>
        </div>

        <section className="space-y-3" aria-labelledby="invite-roles">
          <p
            id="invite-roles"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Assign starter roles
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Assign roles for the invitation"
          >
            {roles.map((role) => {
              const detail = roleDetails[role];
              const isSelected = form.roles.includes(role);
              return (
                <Button
                  key={role}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  aria-pressed={isSelected}
                  onClick={() => onToggleRole(role)}
                  className="h-auto px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{detail?.title ?? role}</span>
                    {detail && (
                      <Tooltip text={detail.description}>
                        <span
                          aria-hidden="true"
                          className="text-xs text-muted-foreground underline decoration-dotted"
                        >
                          ?
                        </span>
                      </Tooltip>
                    )}
                  </span>
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{helperText}</p>
        </section>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={onSubmit} disabled={isInviting} className="flex-1">
            {isInviting ? "Sending invite…" : "Send invite"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={isInviting}
            className="flex-1"
          >
            Clear form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
