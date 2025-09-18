import { Button, Card, CardContent, Tag } from "@/components/atoms/shadcn";
import { Tooltip } from "@/components/atoms";

import type { UserWithRoles } from "@cms/actions/rbac.server";
import type { Role } from "@cms/auth/roles";

import type { RoleDetail } from "../components/roleDetails";

type StatusTag = { variant: "success" | "warning"; label: string };

type RbacUserCardProps = {
  user: UserWithRoles;
  roles: Role[];
  roleDetails: Record<Role, RoleDetail>;
  selectedRoles: Role[];
  statusTag: StatusTag;
  helperText: string;
  onToggleRole: (role: Role) => void;
  onSave: () => void;
  onReset: () => void;
  disabled: boolean;
};

export default function RbacUserCard({
  user,
  roles,
  roleDetails,
  selectedRoles,
  statusTag,
  helperText,
  onToggleRole,
  onSave,
  onReset,
  disabled,
}: RbacUserCardProps) {
  return (
    <Card data-testid="rbac-user-card">
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Tag variant={statusTag.variant}>{statusTag.label}</Tag>
        </div>

        <section className="space-y-3" aria-labelledby={`role-picker-${user.id}`}>
          <p
            id={`role-picker-${user.id}`}
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Manage permissions
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={`Select roles for ${user.name}`}
          >
            {roles.map((role) => {
              const detail = roleDetails[role];
              const isSelected = selectedRoles.includes(role);
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
          <Button type="button" onClick={onSave} disabled={disabled} className="flex-1">
            {disabled ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="flex-1"
            disabled={disabled}
          >
            Reset selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
