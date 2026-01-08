export class SliderElement extends HTMLElement {
        private track!: HTMLDivElement;
        private thumb!: HTMLDivElement;
        private mark!: HTMLSpanElement;

        private _value = 0;
        private minimum = 0;
        private maximum = 100;
        private step = 1;

        constructor() {
                super();

                const shadow = this.attachShadow({
                        mode: "open"
                });

                shadow.innerHTML = `
                        <style>
                                :host {
                                        display: grid;
                                        grid-template-columns: auto 1fr auto;
                                        align-items: center;
                                        gap: 8px;
                                        user-select: none;
                                }

                                .track {
                                        position: relative;
                                        height: 6px;
                                        background: #444;
                                        border-radius: 3px;
                                        cursor: pointer;
                                }

                                .thumb {
                                        position: absolute;
                                        top: 50%;
                                        width: 14px;
                                        height: 14px;
                                        background: white;
                                        border-radius: 50%;
                                        transform: translate(-50%, -50%);
                                }

                                .mark {
                                        min-width: 3ch;
                                        text-align: right;
                                        font-family: monospace;
                                }
                        </style>
                        <label class="label"></label>
                        <div class="track">
                                <div class="thumb"></div>
                        </div>
                        <span class="mark"></span>
                `;

                this.track = shadow.querySelector(".track")!;
                this.thumb = shadow.querySelector(".thumb")!;
                this.mark = shadow.querySelector(".mark")!;

                this.track.addEventListener("pointerdown", this.handleClick);
                this.attributeChangedCallback();
        }

        attributeChangedCallback() {
                this.minimum = Number(this.getAttribute("minimum") ?? "0");
                this.maximum = Number(this.getAttribute("maximum") ?? "100");
                this.value = Number(this.getAttribute("value") ?? this.minimum);
                this.step = Number(this.getAttribute("step") ?? "1");
                this.refresh();
        }

        get value() {
                return this._value;
        }

        set value(value: number) {
                const clamped = Math.min(this.maximum, Math.max(this.minimum, value));
                if (clamped === this._value) {
                        return;
                }

                this._value = clamped;
                this.setAttribute("value", String(clamped));
                this.refresh();

                this.dispatchEvent(new Event("input", { bubbles: true }));
        }

        private refresh() {
                const interpolation = (this._value - this.minimum) / (this.maximum - this.minimum);
                this.thumb.style.left = `${interpolation * 100}%`;

                const decimals = this.step <= 0 ? 0 : Math.max(0, -Math.floor(Math.log10(this.step)));
                this.mark.textContent = this._value.toFixed(decimals);

                const label = this.shadowRoot!.querySelector(".label")!;
                label.textContent = this.getAttribute("label") ?? "";
        }

        private handleClick = (event: PointerEvent) => {
                this.track.setPointerCapture(event.pointerId);
                this.updateHandle(event);

                const moveHandler = (event: PointerEvent) => {
                        this.updateHandle(event);
                };

                const releaseHandler = () => {
                        window.removeEventListener("pointermove", moveHandler);
                        window.removeEventListener("pointerup", releaseHandler);
                };

                window.addEventListener("pointermove", moveHandler);
                window.addEventListener("pointerup", releaseHandler);
                this.dispatchEvent(new Event("change"));
        };

        private updateHandle(event: PointerEvent) {
                const trackRectangle = this.track.getBoundingClientRect();
                const interpolation = (event.clientX - trackRectangle.left) / trackRectangle.width;
                this.value = this.minimum + interpolation * (this.maximum - this.minimum);
        }
}

export function defineSliders() {
        customElements.define("slider-element", SliderElement);
}