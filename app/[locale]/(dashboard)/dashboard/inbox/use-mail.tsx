
import { atom, useAtom } from "jotai"
import { mails } from "@/app/[locale]/(dashboard)/dashboard/inbox/data"

// Phase 3: dropped the dead `Mail` import (inbox/data exports no `Mail`).





const configAtom = atom<{ selected: string }>({
  selected: mails[0].id,
})

export function useMail() {
  return useAtom(configAtom)
}