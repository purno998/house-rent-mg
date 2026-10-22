import {rentTotal} from "./rents.js";

const bnNumber = new Intl.NumberFormat('bn-BD');
const bnPlain = new Intl.NumberFormat('bn-BD', {useGrouping: false});
const bnMonthName = new Intl.DateTimeFormat('bn-BD', {month: 'long'});
const BN_LETTERS = {A: 'এ', B: 'বি', C: 'সি', D: 'ডি'};

export const taka = (n) => n ? `${bnNumber.format(n)}/-` : '';

// "2C" -> "২সি"
export const bnUnitId = (id) =>
  [...id].map(c => /\d/.test(c) ? bnPlain.format(Number(c)) : BN_LETTERS[c] ?? c).join('');

// "অক্টোবর, ২০২৬"
export const bnMonth = (date) => `${bnMonthName.format(date)}, ${bnPlain.format(date.getFullYear())}`;

// [column, label, shown even when empty]
export const CHARGES = [
  ['rent', 'বাসা ভাড়া', true],
  ['electricity', 'বিদ্যুৎ বিল', false],
  ['gas', 'গ্যাস বিল', false],
  ['water', 'পানির বিল', true],
  ['garbage', 'ময়লার বিল', true],
  ['service_charge', 'সার্ভিস চার্জ', true],
];

export const chargeableSpendings = (unit) => unit.spendings.filter(s => s.chargeable);

export const extraCharges = (unit) => chargeableSpendings(unit).reduce((sum, s) => sum + s.amount, 0);

export const billTotal = (unit) => rentTotal(unit.monthlyRent) + extraCharges(unit);

export const byUnitId = (a, b) => a.id.localeCompare(b.id);
