import { allocate } from './lib/commerce-allocate.ts'
import { round, sumMoney } from './lib/money.ts'

export interface MessMember {
  name: string
  /** Meals eaten this month; halves allowed (নাস্তা = ০.৫ মিল). */
  meals: number
  /** Cash given for bazar plus bazar bought with own money (বাজার বা জমা দিয়েছে). */
  deposit: number
  /** Paid toward the shared costs (rent, bua, utility), if any. */
  sharedPaid?: number
}

export interface MessSharedCost {
  /** e.g. "খালা / বুয়া বিল", "ভাড়া", "বিদ্যুৎ". */
  label: string
  amount: number
  /** "equal" (সবাই সমান, the default) or "meals" (by meals eaten, e.g. gas). */
  split?: 'equal' | 'meals'
}

export interface MessInput {
  /** Month's total bazar (মোট বাজার খরচ). */
  bazarTotal: number
  sharedCosts: MessSharedCost[]
  members: MessMember[]
}

export interface MessMemberResult {
  name: string
  meals: number
  deposit: number
  /** meals × meal rate (খরচ). */
  mealCost: number
  /** deposit − mealCost: + পাবে, − দেবে. The "কে কত দেবে / পাবে (বাজার)" table. */
  mealBalance: number
  /** This member's part of the shared costs. */
  sharedCost: number
  /** sharedPaid − sharedCost. */
  sharedBalance: number
  totalCost: number
  /** Everything settled: + gets back (পাবে), − still owes (দেবে). */
  balance: number
}

export interface MessResult {
  totalMeals: number
  /** bazarTotal ÷ totalMeals, to the paisa (মিল রেট). */
  mealRate: number
  sharedTotal: number
  /** Each member's part of the equally split costs (খালা বিল প্রতিজন). */
  sharedPerHead: number
  totalDeposit: number
  /** Deposits not yet spent on bazar; negative when the manager is out of pocket. */
  cashInHand: number
  members: MessMemberResult[]
}

export type MessError = 'members' | 'bazar' | 'shared' | 'meals' | 'deposit'

const isMoney = (v: number) => v >= 0 && Number.isFinite(v)

/** Returns the field that is wrong, or null when the input can be calculated. */
export function validateMess(input: MessInput): MessError | null {
  if (input.members.length === 0) return 'members'
  if (!isMoney(input.bazarTotal)) return 'bazar'
  if (!input.sharedCosts.every((c) => isMoney(c.amount))) return 'shared'
  if (!input.members.every((m) => isMoney(m.meals))) return 'meals'
  if (!input.members.every((m) => isMoney(m.deposit) && isMoney(m.sharedPaid ?? 0))) return 'deposit'
  // Bazar or a by-meal cost with nobody eating cannot be shared out.
  const meals = input.members.reduce((sum, m) => sum + m.meals, 0)
  const byMeals = input.sharedCosts.some((c) => c.split === 'meals' && c.amount > 0)
  if (meals === 0 && (input.bazarTotal > 0 || byMeals)) return 'meals'
  return null
}

/**
 * Meal rate = total bazar ÷ total meals; each member pays meals × rate and
 * gets back what they put in. Shared costs are split equally (or by meals).
 * Parts are split to the paisa so they add up exactly to the bills.
 */
export function calculateMess(input: MessInput): MessResult {
  const meals = input.members.map((m) => m.meals)
  const ones = input.members.map(() => 1)
  const totalMeals = meals.reduce((sum, m) => sum + m, 0)
  const mealCosts = allocate(input.bazarTotal, meals)

  // Split each kind of cost as one sum, so the leftover paisa of every bill do not all land on the first member.
  const equalTotal = sumMoney(input.sharedCosts.filter((c) => c.split !== 'meals').map((c) => c.amount))
  const mealsTotal = sumMoney(input.sharedCosts.filter((c) => c.split === 'meals').map((c) => c.amount))
  const equalParts = allocate(equalTotal, ones)
  const mealParts = allocate(mealsTotal, meals)
  const shared = input.members.map((_, i) => round(equalParts[i]! + mealParts[i]!))

  const members = input.members.map((m, i): MessMemberResult => {
    const mealCost = mealCosts[i]!
    const sharedCost = shared[i]!
    const sharedPaid = m.sharedPaid ?? 0
    return {
      name: m.name,
      meals: m.meals,
      deposit: m.deposit,
      mealCost,
      mealBalance: round(m.deposit - mealCost),
      sharedCost,
      sharedBalance: round(sharedPaid - sharedCost),
      totalCost: round(mealCost + sharedCost),
      balance: round(m.deposit + sharedPaid - mealCost - sharedCost),
    }
  })

  const totalDeposit = sumMoney(input.members.map((m) => m.deposit))
  return {
    totalMeals,
    mealRate: totalMeals === 0 ? 0 : round(input.bazarTotal / totalMeals),
    sharedTotal: sumMoney(input.sharedCosts.map((c) => c.amount)),
    sharedPerHead: round(equalTotal / input.members.length),
    totalDeposit,
    cashInHand: round(totalDeposit - input.bazarTotal),
    members,
  }
}
