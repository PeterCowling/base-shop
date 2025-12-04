"use client";

import Link from "next/link";
import { Button } from "@/components/atoms/shadcn";
import { useConfigurator } from "../ConfiguratorContext";
import useStepCompletion from "../hooks/useStepCompletion";
import { ExternalLinkIcon, CheckIcon } from "@radix-ui/react-icons";
import { track } from "@acme/telemetry";

const Divider = () => <div role="separator" className="h-px w-full bg-border" />;

export default function StepReachSocial(): React.JSX.Element {
  const { state } = useConfigurator();
  const [_completed, markComplete] = useStepCompletion("reach-social");

  const shopId = state.shopId;
  const seoHref = shopId ? `/cms/shop/${shopId}/settings/seo` : "/cms/configurator/shop-basics";
  const navHref = shopId
    ? `/cms/shop/${shopId}/edit-preview?section=home&palette=SocialLinks`
    : "/cms/configurator/navigation-home";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Reach & social power-up</h2>
        <p className="text-sm text-muted-foreground">
          Add social proof and sharing affordances so your shop is easier to discover and share.
          This is optional for launch, but completing it boosts reach.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Add social links</p>
            <p className="text-sm text-muted-foreground">
              Drop a SocialLinks block into your header or footer and fill at least one profile.
            </p>
          </div>
          <Link className="inline-flex items-center gap-1 text-sm text-primary hover:underline" href={navHref}>
            Open navigation <ExternalLinkIcon />
          </Link>
        </div>
        <Divider />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Add a viral block</p>
            <p className="text-sm text-muted-foreground">
              Use SocialFeed, SocialProof, NewsletterSignup, or EmailReferral on the homepage.
            </p>
          </div>
          <Link className="inline-flex items-center gap-1 text-sm text-primary hover:underline" href={navHref}>
            Go to homepage layout <ExternalLinkIcon />
          </Link>
        </div>
        <Divider />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Set a share image</p>
            <p className="text-sm text-muted-foreground">
              Add a social sharing image (and domain if ready) so links render nicely.
            </p>
          </div>
          <Link className="inline-flex items-center gap-1 text-sm text-primary hover:underline" href={seoHref}>
            Open SEO settings <ExternalLinkIcon />
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            markComplete(false);
            if (state.shopId) {
              track("reach_power_up_marked", {
                shopId: state.shopId,
                status: "pending",
              });
            }
          }}
        >
          Mark pending
        </Button>
        <Button
          onClick={() => {
            markComplete(true);
            if (state.shopId) {
              track("reach_power_up_marked", {
                shopId: state.shopId,
                status: "complete",
              });
            }
          }}
        >
          <CheckIcon className="me-2 h-4 w-4 rtl:me-0 rtl:ms-2" />
          Mark power-up complete
        </Button>
      </div>
    </div>
  );
}
