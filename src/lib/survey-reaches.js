// Consecutive report records grouped by location for the field-planning example.
export const planningReaches = [
  { id: "A", name: "Южная излучина", first: 1, last: 7, markerId: 4 },
  { id: "B", name: "Центральный участок", first: 8, last: 14, markerId: 12 },
  { id: "C", name: "Северо-западный участок", first: 15, last: 22, markerId: 19 },
].map((reach) => ({
  ...reach,
  recordIds: Array.from({ length: reach.last - reach.first + 1 }, (_, i) => reach.first + i),
}));

export function reachForRecord(id) {
  return planningReaches.find(({ first, last }) => first <= id && id <= last);
}
