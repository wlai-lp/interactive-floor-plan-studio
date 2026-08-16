import { LandingHero } from "../components/marketing/LandingHero";
import { LandingWorkflow } from "../components/marketing/LandingWorkflow";
import { MarketingShell } from "../components/marketing/MarketingShell";

export default function Page() {
  return (
    <MarketingShell>
      <LandingHero />
      <LandingWorkflow />
    </MarketingShell>
  );
}
