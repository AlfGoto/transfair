"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { HelpCircle } from "lucide-react";
import { Link } from "@/i18n/routing";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 w-full border-b border-gray-200 dark:border-gray-800 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-8">
        <div className="relative flex items-center gap-2">
          <div
            className="relative h-8 w-32 flex items-center cursor-pointer"
            onClick={() => router.push("/")}
          >
            <span className="text-xl font-bold">{t("appName")}</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/help" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t("help")}</span>
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={session.user?.image || ""}
                      alt={session.user?.name || ""}
                    />
                    <AvatarFallback>
                      {session.user?.name?.charAt(0) ||
                        session.user?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={() => signOut()}>
                  SignOut
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => signIn()}>Sign in</Button>
          )}
        </div>
      </div>
    </header>
  );
}
