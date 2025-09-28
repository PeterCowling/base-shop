import { Button, Card, CardContent, Tag } from "@/components/atoms/shadcn";
import { Tooltip } from "@/components/atoms";
import { Inline, Stack } from "@ui/components/atoms/primitives";

import type { UserWithRoles } from "@cms/actions/rbac.server";
import type { Role } from "@cms/auth/roles";
import { useTranslations } from "@acme/i18n";
import { InfoCircledIcon } from "@radix-ui/react-icons";

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
  const t = useTranslations();
  const RBAC_USER_CARD_TESTID = "rbac-user-card"; /* i18n-exempt */
  return (
    <Card data-testid={RBAC_USER_CARD_TESTID}>
      <CardContent className="space-y-4">
        <Stack gap={3} className="sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-base font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Tag className="shrink-0" variant={statusTag.variant}>{statusTag.label}</Tag>
        </Stack>

        <section className="space-y-3" aria-labelledby={`role-picker-${user.id}`}>
          <p
            id={`role-picker-${user.id}`}
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {t("cms.rbac.managePermissions")}
          </p>
          <Inline gap={2} wrap role="group" aria-label={t("cms.rbac.selectRolesFor", { name: user.name }) as string}>
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
                  trailingIcon={
                    detail ? (
                      <Tooltip text={detail.description}>
                        <InfoCircledIcon aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                      </Tooltip>
                    ) : undefined
                  }
                >
                  <span className="font-medium">{detail?.title ?? role}</span>
                </Button>
              );
            })}
          </Inline>
          <p className="text-xs text-muted-foreground">{helperText}</p>
        </section>

        <Stack gap={2} className="sm:flex-row">
          <Button type="button" onClick={onSave} disabled={disabled} className="flex-1">
            {disabled ? t("actions.saving") : t("actions.saveChanges")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="flex-1"
            disabled={disabled}
          >
            {t("cms.rbac.resetSelection")}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
