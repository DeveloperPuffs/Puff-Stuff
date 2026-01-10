import { LabeledElement } from "./labeled";
import { getTexture, Texture } from "../textures";
import tippy from "tippy.js";

export class SpriteSelectorElement extends LabeledElement {
        static define() {
                customElements.define("sprite-selector-element", SpriteSelectorElement);
        }

        private sprites: Map<string, Texture>;
        private _sprite!: Texture;

        constructor() {
                super();
                this.sprites = new Map();
        }

        get sprite() {
                return this._sprite;
        }

        set sprite(sprite: Texture) {
                if (sprite === this._sprite) {
                        return;
                }

                this._sprite = sprite;
                this.dispatchEvent(new Event("change"));
        }

        connectedCallback() {
                const content = super.connectedCallback();

                const paths = content
                        .trim()
                        .split(",")
                        .map(path => path.trim())
                        .filter(path => path.length > 0);

                for (const path of paths) {
                        const texture = getTexture(path);
                        const image = texture.getImage(true);
                        this.control.appendChild(image);
                        this.sprites.set(path, texture);

                        image.addEventListener("click", () => {
                                const oldImage = this.sprite.getImage(true);
                                oldImage.classList.remove("selected");

                                this.sprite = texture;
                                const newImage = this.sprite.getImage(true);
                                newImage.classList.add("selected");
                        });

                        image.setAttribute("data-tippy-content", texture.name);
                }

                tippy("[data-tippy-content]", {
                        animation: "scale"
                });

                this.sprite = getTexture(this.getAttribute("value")!);
                const image = this.sprite.getImage(true);
                image.classList.add("selected");

                return "";
        }
}