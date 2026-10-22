// Shared bits for the date tool specs: Figma's "today" and picking a date in the P5 sheet.
import { expect, type Page } from '@playwright/test'

/** Figma's today (19 Oct 2026), midday in Dhaka, for page.clock. */
export const FIGMA_TODAY = '2026-10-19T06:00:00Z'

/** Opens the date field's P5 sheet, jumps to the year and month with its selects and confirms `label` ("১৫ মার্চ ১৯৯৫"). */
export async function pickDate(page: Page, fieldId: string, sheetTitle: string, year: number, month: number, label: string) {
  await page.locator(`#${fieldId}`).click()
  const sheet = page.getByRole('dialog', { name: sheetTitle })
  await expect(sheet).toBeVisible()
  await sheet.getByLabel('বছর', { exact: true }).selectOption(String(year))
  await sheet.getByLabel('মাস', { exact: true }).selectOption(String(month - 1))
  await sheet.getByRole('gridcell', { name: label }).click()
  await sheet.getByRole('button', { name: `${label} বেছে নাও` }).click()
  await expect(sheet).toBeHidden()
}
