import { Vector2D } from "./math";

export class Mouse extends Vector2D {
        private position: Vector2D = Vector2D.zero();
        private keys: Record<string, boolean> = {};
        private clickCallbacks: (() => void)[] = [];

        constructor(private element: HTMLElement) {
                super(0, 0);

                window.addEventListener("keydown", event => {
                        const element = document.activeElement;
                        if (element instanceof HTMLElement) {
                                if (element.tagName === "INPUT" && (element as HTMLInputElement).type === "text") {
                                        return;
                                }

                                if (element.tagName === "TEXTAREA") {
                                        return;
                                }

                                if (element.isContentEditable) {
                                        return;
                                }
                        }

                        this.keys[event.code] = true;
                });

                window.addEventListener("keyup", event => {
                        this.keys[event.code] = false;
                });

                window.addEventListener("click", event => {
                        if (!(event.target instanceof Node)) {
                                return;
                        }

                        if (!this.element.contains(event.target)) {
                                return;
                        }

                        for (const clickCallback of this.clickCallbacks) {
                                clickCallback();
                        }
                });

                window.addEventListener("mousemove", event => {
                        this.position.x = event.clientX;
                        this.position.y = event.clientY;
                });
        }

        onClick(callback: () => void) {
                this.clickCallbacks.push(callback);
        }

        mapPosition(positionMapper: (position: Vector2D) => void) {
                const position = this.position.copy();
                positionMapper(position);

                this.x = position.x;
                this.y = position.y;
        }
}