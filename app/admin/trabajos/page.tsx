import { AdminPortfolioManager } from "@/components/admin/AdminPortfolioManager";
import { requireAdmin } from "@/lib/auth";
import { portfolioRepository } from "@/lib/portfolio-repository";

export const dynamic = "force-dynamic";

export default async function AdminWorksPage() {
  await requireAdmin();
  const items = await portfolioRepository.list({ includeHidden: true });
  return <div className="admin-workspace"><AdminPortfolioManager initialItems={items} embedded /></div>;
}
