export class Vector2D {
        public static zero() {
                return new Vector2D(0, 0);
        }

        constructor(public x: number, public y: number) {
        }

        copy() {
                return new Vector2D(this.x, this.y);
        }
}

export class Rectangle2D extends Vector2D {
        public static at(position: Vector2D, w: number, h: number) {
                return new Rectangle2D(position.x, position.y, w, h);
        }

        constructor(public x: number, public y: number, public w: number, public h: number) {
                super(x, y);
        }
}