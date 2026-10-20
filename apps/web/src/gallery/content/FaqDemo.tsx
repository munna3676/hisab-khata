// Gallery island: an FAQ block, live. An opened answer fades in and settles 4px
// (opacity + translate only); the chevron turns. `single` keeps one answer open. The list
// also emits FAQPage JSON-LD with the same questions and plain-text answers.
// The charges in the first answer are Figma's layout sample, not data.
import { FaqList } from '@hisab/ui/content'

interface Props {
  single?: boolean
}

const ITEMS = [
  {
    question: 'বিকাশে ১০০০ টাকা ক্যাশ আউটে কত চার্জ?',
    answer: 'প্রিয় এজেন্টে ১৩.৯৫ টাকা, অন্য এজেন্টে ১৮.৫০ টাকা, ATM এ ১৪.৯০ টাকা।',
  },
  {
    question: 'আবেদন রিজেক্ট হলে কী করবো?',
    answer: 'রিজেক্টের কারণ পোর্টালে দেখাবে। কাগজ ঠিক করে আবার আবেদন করো, দরকারে উপজেলা অফিসে যোগাযোগ করো।',
  },
  {
    question: 'বাবা-মা মারা গেলে কী কাগজ লাগবে?',
    answer: 'মৃত্যু সনদের কপি আর তাদের NID বা জন্ম নিবন্ধনের কপি। অফিস আরও কাগজ চাইতে পারে।',
  },
]

export default function FaqDemo({ single = false }: Props) {
  return <FaqList items={ITEMS} single={single} defaultOpen={[1]} headingLevel={4} jsonLd />
}
