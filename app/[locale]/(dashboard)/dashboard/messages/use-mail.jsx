
import { atom, useAtom } from "jotai"
import { Mail, mails } from "@/app/[locale]/(dashboard)/dashboard/messages/data"





const configAtom = atom({
  selected: mails[0].id,
})

export function useMail() {
  return useAtom(configAtom)
}