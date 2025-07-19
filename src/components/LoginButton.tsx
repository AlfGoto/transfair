"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useTranslations } from 'next-intl';

export default function LoginButton() {
  const { data: session } = useSession();
  const t = useTranslations('auth');
  
  if (session) {
    return (
      <>
        {t('signedInAs')} {session?.user?.email} <br />
        <button onClick={() => signOut()}>{t('signOut')}</button>
      </>
    );
  }
  return (
    <>
      {t('notSignedIn')} <br />
      <button onClick={() => signIn()}>{t('signIn')}</button>
    </>
  );
}
