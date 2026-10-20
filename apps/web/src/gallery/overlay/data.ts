// Sample lists for the overlay gallery. The first six countries and the divisional
// cities are Figma's (P1 59:16200, P2 59:16364); the rest only make the lists long
// enough to scroll and filter. Not data: the real lists come from @hisab/data.
import type { PickerGroup, PickerOption } from '@hisab/ui/overlay'

export const COUNTRIES: PickerOption[] = [
  { value: 'SA', label: 'সৌদি আরব', description: 'SAR · সৌদি রিয়াল', keywords: ['Saudi Arabia', 'KSA', 'Riyadh'] },
  { value: 'AE', label: 'সংযুক্ত আরব আমিরাত', description: 'AED · দিরহাম', keywords: ['UAE', 'Dubai', 'Emirates'] },
  { value: 'MY', label: 'মালয়েশিয়া', description: 'MYR · রিংগিত', keywords: ['Malaysia'] },
  { value: 'US', label: 'যুক্তরাষ্ট্র', description: 'USD · ডলার', keywords: ['USA', 'America'] },
  { value: 'GB', label: 'যুক্তরাজ্য', description: 'GBP · পাউন্ড', keywords: ['UK', 'England', 'London'] },
  { value: 'IT', label: 'ইতালি', description: 'EUR · ইউরো', keywords: ['Italy'] },
  { value: 'QA', label: 'কাতার', description: 'QAR · কাতারি রিয়াল', keywords: ['Qatar', 'Doha'] },
  { value: 'KW', label: 'কুয়েত', description: 'KWD · কুয়েতি দিনার', keywords: ['Kuwait'] },
  { value: 'OM', label: 'ওমান', description: 'OMR · ওমানি রিয়াল', keywords: ['Oman', 'Muscat'] },
  { value: 'SG', label: 'সিঙ্গাপুর', description: 'SGD · সিঙ্গাপুর ডলার', keywords: ['Singapore'] },
]

export const DISTRICT_GROUPS: PickerGroup[] = [
  { id: 'division', label: 'বিভাগীয় শহর' },
  { id: 'other', label: 'অন্য জেলা' },
]

export const DISTRICTS: PickerOption[] = [
  { value: 'dhaka', label: 'ঢাকা', description: 'ঢাকা বিভাগ', group: 'division' },
  { value: 'chattogram', label: 'চট্টগ্রাম', description: 'চট্টগ্রাম বিভাগ', keywords: ['Chittagong'], group: 'division' },
  { value: 'rajshahi', label: 'রাজশাহী', description: 'রাজশাহী বিভাগ', group: 'division' },
  { value: 'khulna', label: 'খুলনা', description: 'খুলনা বিভাগ', group: 'division' },
  { value: 'sylhet', label: 'সিলেট', description: 'সিলেট বিভাগ', group: 'division' },
  { value: 'barishal', label: 'বরিশাল', description: 'বরিশাল বিভাগ', keywords: ['Barisal'], group: 'division' },
  { value: 'rangpur', label: 'রংপুর', description: 'রংপুর বিভাগ', group: 'division' },
  { value: 'mymensingh', label: 'ময়মনসিংহ', description: 'ময়মনসিংহ বিভাগ', group: 'division' },
  { value: 'gazipur', label: 'গাজীপুর', description: 'ঢাকা বিভাগ', group: 'other' },
  { value: 'narayanganj', label: 'নারায়ণগঞ্জ', description: 'ঢাকা বিভাগ', group: 'other' },
  { value: 'cumilla', label: 'কুমিল্লা', description: 'চট্টগ্রাম বিভাগ', keywords: ['Comilla'], group: 'other' },
  { value: 'coxsbazar', label: 'কক্সবাজার', description: 'চট্টগ্রাম বিভাগ', keywords: ["Cox's Bazar"], group: 'other' },
  { value: 'bogura', label: 'বগুড়া', description: 'রাজশাহী বিভাগ', keywords: ['Bogra'], group: 'other' },
  { value: 'jashore', label: 'যশোর', description: 'খুলনা বিভাগ', keywords: ['Jessore'], group: 'other' },
]

/** Figma S2: the numbers on the cash-out page a person can report (layout sample). */
export const REPORT_ITEMS = [
  { value: 'nagad-ussd', label: 'নগদ · *167# দিয়ে · ৳১৫.০০' },
  { value: 'bkash-agent', label: 'বিকাশ · এজেন্ট · ৳১৮.৫০' },
  { value: 'rocket-atm', label: 'রকেট · DBBL ATM · ৳৯.০০' },
]

/** Figma S1 share card (layout sample). */
export const SHARE_CARD = {
  caption: 'আমি এই মাসে বাঁচালাম',
  amount: '৳৪৭.৫০',
  detail: '৫,০০০ টাকা ক্যাশ আউটে সাধারণ এজেন্টের বদলে রকেট DBBL ATM বেছে নিয়ে',
}

/** Fixed "today" so the gallery screenshots do not change from day to day. */
export const GALLERY_TODAY = new Date(2026, 9, 19)
