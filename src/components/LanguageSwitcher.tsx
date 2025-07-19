"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (locale: string) => {
    // Get current locale to avoid unnecessary navigation
    const currentLocale = pathname.startsWith("/fr") ? "fr" : "en";

    // Don't navigate if already on the target locale
    if (currentLocale === locale) return;

    // With localePrefix: 'as-needed', English (default) has no prefix, French has /fr
    if (locale === "en") {
      // For English, remove /fr prefix if present
      const newPath = pathname.replace(/^\/fr/, "") || "/";
      router.push(newPath);
    } else if (locale === "fr") {
      // For French, add /fr prefix if not present
      const newPath = `/fr${pathname}`;
      router.push(newPath);
    }
  };

  const currentLocale = pathname.startsWith("/fr") ? "fr" : "en";
  const currentLanguage =
    languages.find((lang) => lang.code === currentLocale) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>{currentLanguage.flag}</span>
          <span className="hidden sm:inline">{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            className={currentLocale === language.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
