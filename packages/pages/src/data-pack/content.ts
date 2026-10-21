// Mobile data pack page content: the verified line from data/data-packs.json. Figma C8 has no FAQ.
import type { DataPack } from '@hisab/core/data-pack'
import type { DataPacksFile } from '@hisab/data/types'
import type { Lang } from '@hisab/i18n/locale'
import { toolPageContent } from '../tool/content.ts'
import type { ToolPageContent } from '../tool/types.ts'
import { dataStatus } from '../tool/verification.ts'

export const DATA_PACK_ID = 'data-pack'

export const DATA_PACK_MESSAGE_KEYS = [] as const

/** Every operator's packs in one list. */
export function allPacks(file: DataPacksFile): DataPack[] {
  return file.packs.flatMap((fact) => fact.value)
}

export function dataPackContent(lang: Lang, file: DataPacksFile): ToolPageContent {
  return toolPageContent(DATA_PACK_ID, lang, { data: dataStatus(file.packs) })
}
