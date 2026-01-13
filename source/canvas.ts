import { Character, CharacterContext } from "./character";
import { Outliner } from "./outliner";
import { Vector2D } from "./math";

const MAXIMUM_DELTA_TIME = 0.05;
export class Canvas2D implements CharacterContext {
        private element: HTMLCanvasElement;
        private context: CanvasRenderingContext2D;

        private visibilityCallbacks: ((visible: boolean) => void)[] = [];

        private clickCallbacks: (() => void)[] = [];
        private mousePosition: Vector2D = Vector2D.zero();
        public cursorPosition: Vector2D = Vector2D.zero();

        private keys: Set<string> = new Set();
        private keyPressCallbacks: Map<string, ((key: string) => void)[]> = new Map();
        private keyReleaseCallbacks: Map<string, ((key: string) => void)[]> = new Map();

        public outliner: Outliner;
        public player: Character;

        private currentTime: number = 0;

        private cameraPosition: Vector2D = Vector2D.zero();
        private cameraCenter: Vector2D = Vector2D.zero();
        private cameraTarget: Vector2D = Vector2D.zero();
        private cameraDrag: Vector2D = new Vector2D(0.1, 0.25);
        private cameraPanning: number = 5;
        private cameraSpeed: number = 2;
        private cameraShake: number = 0;
        private cameraShakeDirection: number = 0; // Shake direction
        private cameraShakeThreshold: number = 0.1;
        private cameraShakeDecay: number = 0.2;

        shakeCamera(amount: number) {
                this.cameraShake += amount;
        }

        snapCamera(position: Vector2D) {
                this.cameraCenter.x = position.x;
                this.cameraCenter.y = position.y;
                this.cameraTarget.x = position.x;
                this.cameraTarget.y = position.y;
        }

        focusCamera(position: Vector2D) {
                const distanceX = this.cameraDrag.x * this.element.clientWidth / 2;
                const distanceY = this.cameraDrag.y * this.element.clientHeight / 2;
                this.cameraTarget.x = Math.min(Math.max(this.cameraTarget.x, position.x - distanceX), position.x + distanceX);
                this.cameraTarget.y = Math.min(Math.max(this.cameraTarget.y, position.y - distanceY), position.y + distanceY);
        }

        constructor() {
                this.element = document.querySelector<HTMLCanvasElement>("#canvas")!;
                this.context = this.element.getContext("2d")!;

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
                        this.mousePosition.x = event.clientX;
                        this.mousePosition.y = event.clientY;
                });

                window.addEventListener("keydown", event => {
                        if (event.repeat) {
                                return;
                        }

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

                        this.keys.add(event.code);

                        const callbacks = this.keyPressCallbacks.get(event.code);
                        if (callbacks !== undefined) {
                                callbacks.forEach(callback => callback(event.code));
                        }
                });

                window.addEventListener("keyup", event => {
                        if (!this.keys.has(event.code)) {
                                return;
                        }

                        this.keys.delete(event.code);

                        const callbacks = this.keyReleaseCallbacks.get(event.code);
                        if (callbacks !== undefined) {
                                callbacks.forEach(callback => callback(event.code));
                        }
                });

                this.outliner = new Outliner();
                this.player = new Character(this);

                const resizeObserver = new ResizeObserver(entries => {
                        for (const entry of entries) {
                                if (entry.target !== this.element) {
                                        continue;
                                }

                                this.resizeCanvas();
                        }
                });

                resizeObserver.observe(this.element);
                this.resizeCanvas();

                window.addEventListener("blur", this.clearKeys);
                document.addEventListener("visibilitychange", () => {
                        const visible = document.visibilityState === "visible";
                        for (const visibilityCallback of this.visibilityCallbacks) {
                                visibilityCallback(visible);
                        }
                });

                this.onVisibilityChange(visible => {
                        if (!visible) {
                                this.clearKeys();
                        }
                });
        }

        onVisibilityChange(callback: (visible: boolean) => void) {
                this.visibilityCallbacks.push(callback);
        }

        private resizeCanvas() {
                const devicePixelRatio = window.devicePixelRatio || 1;
                this.element.width = this.element.clientWidth * devicePixelRatio;
                this.element.height = this.element.clientHeight * devicePixelRatio;
                this.context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        }

        onClick(callback: () => void) {
                this.clickCallbacks.push(callback);
        }

        private clearKeys = () => {
                for (const key of this.keys) {
                        const callbacks = this.keyReleaseCallbacks.get(key);
                        if (callbacks !== undefined) {
                                callbacks.forEach(callback => callback(key));
                        }
                }

                this.keys.clear();
        }

        checkKeys(keys: string): boolean {
                return this.parseKeys(keys).some(key => this.keys.has(key));
        }

        onKeyPress(keys: string, callback: (key: string) => void) {
                this.parseKeys(keys).forEach(key => {
                        const callbacks = this.keyPressCallbacks.get(key);
                        if (callbacks === undefined) {
                                this.keyPressCallbacks.set(key, [callback]);
                                return;
                        }

                        callbacks.push(callback);
                });
        }

        onKeyRelease(keys: string, callback: (key: string) => void) {
                this.parseKeys(keys).forEach(key => {
                        const callbacks = this.keyReleaseCallbacks.get(key);
                        if (callbacks === undefined) {
                                this.keyReleaseCallbacks.set(key, [callback]);
                                return;
                        }

                        callbacks.push(callback);
                });
        }

        private parseKeys(keys: string) {
                return keys
                        .trim()
                        .split(",")
                        .map(key => key.trim())
                        .filter(key => key.length !== 0);
        }

        startRunning() {
                const animationFrame = (timestamp: number) => {
                        this.animate(timestamp);
                        window.requestAnimationFrame(animationFrame);
                }

                window.requestAnimationFrame(animationFrame);
        }

        private transformPosition(matrix: DOMMatrix, position: Vector2D) {
                return new Vector2D(
                        matrix.a * position.x + matrix.c * position.y + matrix.e,
                        matrix.b * position.x + matrix.d * position.y + matrix.f
                );
        }

        getCanvasPosition(position: Vector2D) {
                const matrix = this.context.getTransform();
                return this.transformPosition(matrix, position);
        }

        getWorldPosition(position: Vector2D) {
                const matrix = this.context.getTransform().inverse();
                return this.transformPosition(matrix, position);
        }

        animate(timestamp: number) {
                const deltaTime = Math.min((timestamp - this.currentTime) / 1000, MAXIMUM_DELTA_TIME);
                this.currentTime = timestamp;
                this.update(deltaTime);
                this.render();
        }

        private update(deltaTime: number) {
                this.updateCamera(deltaTime);
                this.player.update(deltaTime);
        }

        private updateCamera(deltaTime: number) {
                if (this.cameraShake !== 0) {
                        this.cameraShakeDirection = Math.random() * Math.PI * 2;
                        this.cameraShake -= this.cameraShake * this.cameraShakeDecay;
                        if (this.cameraShake < this.cameraShakeThreshold) {
                                this.cameraShake = 0;
                        }
                }

                this.cameraCenter.x += (this.cameraTarget.x - this.cameraCenter.x) * this.cameraSpeed * deltaTime;
                this.cameraCenter.y += (this.cameraTarget.y - this.cameraCenter.y) * this.cameraSpeed * deltaTime;

                const panningX = this.cameraPanning * this.cursorPosition.x / (-this.element.clientWidth / 2);
                const panningY = this.cameraPanning * this.cursorPosition.y / (-this.element.clientHeight / 2);
                const shakeX = Math.cos(this.cameraShakeDirection) * this.cameraShake * this.element.clientWidth / 1000;
                const shakeY = Math.sin(this.cameraShakeDirection) * this.cameraShake * this.element.clientHeight / 1000;
                this.cameraPosition.x = this.cameraCenter.x + panningX + shakeX;
                this.cameraPosition.y = this.cameraCenter.y + panningY + shakeY;
        }

        private render() {
                this.context.fillStyle = "rgba(0, 0, 0, 0.25)";
                this.context.clearRect(0, 0, this.element.clientWidth, this.element.clientHeight);
                this.context.fillRect(0, 0, this.element.clientWidth, this.element.clientHeight);

                this.context.save();
                this.context.translate(
                        this.element.clientWidth / 2 - this.cameraPosition.x,
                        this.element.clientHeight / 2 - this.cameraPosition.y
                );

                const mousePosition = this.mousePosition.copy();
                const matrix = this.context.getTransform().inverse();
                const bounds = this.element.getBoundingClientRect();
                const scaleX = this.element.width / bounds.width;
                const scaleY = this.element.height / bounds.height;
                const canvasPosition = new Vector2D(
                        (mousePosition.x - bounds.left) * scaleX,
                        (mousePosition.y - bounds.top) * scaleY
                );

                const worldPosition = this.transformPosition(matrix, canvasPosition);
                this.cursorPosition.x = worldPosition.x;
                this.cursorPosition.y = worldPosition.y;

                this.renderBackground();
                this.player.render(this.context);

                this.context.restore();

                const width = this.element.clientWidth;
                const height = this.element.clientHeight;
                const vignette = this.context.createRadialGradient(
                        width / 2, height / 2, Math.min(width, height) * 0.2,
                        width / 2, height / 2, Math.max(width, height) * 0.6
                );

                vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
                vignette.addColorStop(1, "rgba(0, 0, 0, 0.5)");

                this.context.fillStyle = vignette;
                this.context.fillRect(0, 0, width, height);
        }

        private renderBackground() {
                const alpha1 = "0.07";
                const alpha2 = "0.02";
                const gridSize = 25;

                this.context.save();
                this.context.translate(this.cameraPosition.x, this.cameraPosition.y);
                this.context.rotate(-(5 * Math.PI) / 180);
                this.context.translate(-this.cameraPosition.x, -this.cameraPosition.y);
                this.context.lineWidth = 2;

                const diagonal = Math.sqrt(
                        this.element.clientWidth ** 2 +
                        this.element.clientHeight ** 2
                );

                const left = this.cameraPosition.x - diagonal / 2;
                const right = this.cameraPosition.x + diagonal / 2;
                const top = this.cameraPosition.y - diagonal / 2;
                const bottom = this.cameraPosition.y + diagonal / 2;

                const startX = Math.floor(left / gridSize) * gridSize;
                const startY = Math.floor(top / gridSize) * gridSize;

                let startIndexX = Math.floor(startX / gridSize);
                for (let x = startX; x <= right; x += gridSize) {
                        this.context.strokeStyle = (startIndexX++) % 5 === 0
                                ? `rgba(255,255,255,${alpha1})`
                                : `rgba(255,255,255,${alpha2})`;
                        this.context.beginPath();
                        this.context.moveTo(x, top);
                        this.context.lineTo(x, bottom);
                        this.context.stroke();
                }

                let startIndexY = Math.floor(startY / gridSize);
                for (let y = startY; y <= bottom; y += gridSize) {
                        this.context.strokeStyle = (startIndexY++) % 5 === 0
                                ? `rgba(255,255,255,${alpha1})`
                                : `rgba(255,255,255,${alpha2})`;
                        this.context.beginPath();
                        this.context.moveTo(left, y);
                        this.context.lineTo(right, y);
                        this.context.stroke();
                }

                this.context.restore();
        }
}