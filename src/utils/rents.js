export const RENT_COLS = ['rent', 'electricity', 'water', 'gas', 'garbage', 'service_charge', 'due'];

export function rentTotal(rent) {
  let total = 0;
  for (const field of RENT_COLS) {
    total += (rent[field] ? rent[field] : 0);
  }
  return total;
}

export function paymentTotal(payments) {
  let total = 0;
  for (const payment of payments) {
    total += (payment.amount ? payment.amount : 0);
  }
  return total;
}

export const fmt = (n) => '৳' + Number(n ?? 0).toLocaleString('en-BD');

export const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
