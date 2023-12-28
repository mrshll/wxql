export function greaterThan(x: number, y: number): boolean {
  return x > y;
}

export function lessThan(x: number, y: number): boolean {
  return x < y;
}

export function eq(x: number, y: number): boolean {
  return x == y;
}

export function nEq(x: number, y: number): boolean {
  return !eq(x, y);
}
