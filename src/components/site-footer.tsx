import { APP_NAME } from "@/components/brand";
import { getI18n } from "@/i18n/server";

// Pied de page des pages publiques. Démo : les liens légaux ne mènent nulle part
// (pas de vraies conditions ni de politique de confidentialité à publier).
export async function SiteFooter() {
  const { t } = await getI18n();
  return (
    <footer className="mx-auto mt-auto flex w-full max-w-[1120px] flex-wrap gap-x-6 gap-y-2 border-t border-border px-4 py-6 text-[15px] text-muted-foreground sm:px-8">
      <span>© {APP_NAME}</span>
      <a href="#" className="text-muted-foreground">
        {t.common.footer.terms}
      </a>
      <a href="#" className="text-muted-foreground">
        {t.common.footer.privacy}
      </a>
    </footer>
  );
}
