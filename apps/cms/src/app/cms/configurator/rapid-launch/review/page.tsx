import { RapidLaunchProvider } from "../RapidLaunchProvider";

import ReviewPage from "./review-page";

export default function RapidLaunchReviewPage() {
  return (
    <RapidLaunchProvider>
      <ReviewPage />
    </RapidLaunchProvider>
  );
}
