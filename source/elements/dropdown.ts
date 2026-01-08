import { LabeledElement } from "./labeled";

export class DropdownElement extends LabeledElement {
        static define() {
                customElements.define("dropdown-element", DropdownElement);
        }

        private button!: HTMLButtonElement;
        private list!: HTMLUListElement;

        private options: string[];
        private _value: string;

        constructor() {
                super();

                this._value = "";
                this.options = [];
        }

        get value() {
                return this._value;
        }

        set value(value: string) {
                if (value === this.value) {
                        return;
                }

                if (!this.options.includes(value)) {
                        return;
                }

                this._value = value;
                this.button.textContent = value;
                this.dispatchEvent(new Event("change"));
        }

        connectedCallback() {
                const content = super.connectedCallback();

                const template = document.querySelector<HTMLTemplateElement>("#dropdown-template")!;
                this.control.append(template.content.cloneNode(true));

                this.button = this.control.querySelector<HTMLButtonElement>("button")!;
                this.list = this.control.querySelector<HTMLUListElement>("ul")!;

                this.options = content
                        .trim()
                        .split(",")
                        .map(option => option.trim())
                        .filter(option => option.length > 0);

                for (const option of this.options) {
                        const item = document.createElement("li");
                        item.textContent = option;

                        item.addEventListener("click", () => {
                                this.value = option;
                                this.list.style.display = "none";
                        });

                        this.list.appendChild(item);
                }

                this.button.addEventListener("click", event => {
                        event.stopPropagation();
                        this.list.style.display = this.list.style.display === "block" ? "none" : "block";
                });

                document.addEventListener("click", () => {
                        this.list.style.display = "none";
                });

                this.value = this.getAttribute("value")!;

                const identifier = this.id || crypto.randomUUID();
                this.id = "";

                this.button.id = `${identifier}-button`;
                this.label.htmlFor = this.button.id;

                return "";
        }
}