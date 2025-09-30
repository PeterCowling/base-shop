import { Button, Card, CardContent, Input, Tag } from "@/components/atoms/shadcn";
import { Tooltip } from "@/components/atoms";
import { Cluster } from "@ui/components/atoms/primitives/Cluster";
import { Inline } from "@ui/components/atoms/primitives/Inline";

import type { Role } from "@cms/auth/roles";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  return (
    <Card>
      <CardContent className="space-y-4">
        <Cluster gap={2} alignY="center" justify="between">
          <h3 className="min-w-0 text-base font-semibold text-foreground">{t("cms.rbac.invite.heading")}</h3>
          <Tag className="shrink-0" variant="warning">{t("cms.rbac.invite.tag.manual")}</Tag>
        </Cluster>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("fields.name")}</span>
            <Input
              name="name"
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("fields.email")}</span>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-foreground">{t("cms.rbac.invite.tempPassword")}</span>
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
            {t("cms.rbac.invite.assignStarterRoles")}
          </p>
          <Cluster gap={2} role="group" aria-label={String(t("cms.rbac.invite.assignRolesAria"))}>
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
                  <Inline gap={2} alignY="center">
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
                  </Inline>
                </Button>
              );
            })}
          </Cluster>
          <p className="text-xs text-muted-foreground">{helperText}</p>
        </section>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={onSubmit} disabled={isInviting} className="flex-1">
            {isInviting ? t("cms.rbac.invite.sending") : t("cms.rbac.invite.send")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={isInviting}
            className="flex-1"
          >
            {t("cms.rbac.invite.clearForm")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
