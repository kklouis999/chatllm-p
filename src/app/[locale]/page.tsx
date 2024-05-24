import PageComponent from "./PageComponent";
import {unstable_setRequestLocale} from 'next-intl/server';

import {
  getIndexPageText,
} from "~/configs/languageText";

import {getLatestChatResultList} from "~/servers/chatRecord";

export const revalidate = 30;
export default async function IndexPage({params: {locale = ''}, searchParams: searchParams}) {
  // Enable static rendering
  unstable_setRequestLocale(locale);

  const indexText = await getIndexPageText();

  const resultInfoListInit = await getLatestChatResultList(locale);

  return (
    <PageComponent
      locale={locale}
      indexText={indexText}
      searchParams={searchParams}
      resultInfoListInit={resultInfoListInit}
    />
  )
}
