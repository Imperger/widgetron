export interface Point {
  x: number;
  y: number;
}

export function pointOnCircle(radius: number, degrees: number): Point {
  const angle = degrees * (Math.PI / 180);

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}
