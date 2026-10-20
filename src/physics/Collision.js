/** Axis-aligned bounding-box collision helpers. Rectangles use center-based entity coordinates. */
export const Collision = {
  aabb(a, b) {
    return Math.abs(a.x - b.x) * 2 < (a.width + b.width) &&
           Math.abs(a.y - b.y) * 2 < (a.height + b.height);
  },
  pointInRect(point, rect) {
    return point.x >= rect.x - rect.width / 2 && point.x <= rect.x + rect.width / 2 &&
           point.y >= rect.y - rect.height / 2 && point.y <= rect.y + rect.height / 2;
  },
  circleCircle(a, b) {
    const r = (a.radius ?? 0) + (b.radius ?? 0);
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= r ** 2;
  },
  circleAabb(circle, rect) {
    const x = Math.max(rect.x - rect.width / 2, Math.min(circle.x, rect.x + rect.width / 2));
    const y = Math.max(rect.y - rect.height / 2, Math.min(circle.y, rect.y + rect.height / 2));
    return (circle.x - x) ** 2 + (circle.y - y) ** 2 <= (circle.radius ?? 0) ** 2;
  }
};
