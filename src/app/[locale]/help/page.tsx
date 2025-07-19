import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  Upload,
  Download,
  Globe,
  Shield,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({
    locale: (await params).locale,
    namespace: "help",
  });

  return {
    title: t("title"),
    description: t("introduction"),
  };
}

export default async function HelpPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = (await params).locale;
  const t = await getTranslations({ locale, namespace: "help" });

  const sections = [
    {
      id: "upload",
      title: t("uploadTitle"),
      icon: Upload,
      steps: [
        t("uploadStep1"),
        t("uploadStep2"),
        t("uploadStep3"),
        t("uploadStep4"),
        t("uploadStep5"),
      ],
    },
    {
      id: "download",
      title: t("downloadTitle"),
      icon: Download,
      steps: [
        t("downloadStep1"),
        t("downloadStep2"),
        t("downloadStep3"),
        t("downloadStep4"),
        t("downloadStep5"),
      ],
    },
    {
      id: "language",
      title: t("languageTitle"),
      icon: Globe,
      steps: [
        t("languageStep1"),
        t("languageStep2"),
        t("languageStep3"),
        t("languageStep4"),
      ],
    },
    {
      id: "security",
      title: t("securityTitle"),
      icon: Shield,
      steps: [
        t("securityStep1"),
        t("securityStep2"),
        t("securityStep3"),
        t("securityStep4"),
        t("securityStep5"),
      ],
    },
    {
      id: "tips",
      title: t("tipsTitle"),
      icon: Lightbulb,
      steps: [t("tip1"), t("tip2"), t("tip3"), t("tip4")],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {t("backToHome")}
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-bold">{t("title")}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {t("howItWorks")}
            </CardTitle>
            <CardDescription>{t("introduction")}</CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Navigation
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {sections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant="outline"
                    asChild
                    className="h-auto flex-col p-4 space-y-2"
                  >
                    <a href={`#${section.id}`}>
                      <IconComponent className="h-6 w-6" />
                      <span className="text-xs text-center">
                        {section.title}
                      </span>
                    </a>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card> */}

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Card key={section.id} id={section.id} className="scroll-mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {section.steps.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Support Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {t("supportTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("supportText")}
            </p>
          </CardContent>
        </Card>

        {/* Back to Top / Home */}
        <div className="flex justify-center mt-8">
          <Button asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("backToHome")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
