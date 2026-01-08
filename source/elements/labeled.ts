export abstract class LabeledElement extends HTMLElement {
        protected label!: HTMLLabelElement;
        protected control!: HTMLDivElement;

        connectedCallback() {
                const content = this.innerHTML;

                this.classList.add("labeled");
                this.replaceChildren();

                const template = document.querySelector<HTMLTemplateElement>("#labeled-template")!;
                this.append(template.content.cloneNode(true));

                this.label = this.querySelector<HTMLLabelElement>("label")!;
                this.control = this.querySelector<HTMLDivElement>(".control")!;

                this.label.textContent = this.getAttribute("label") ?? "";

                requestAnimationFrame(() => {
                        this.classList.add("connected");
                });

                return content;
        }

        attributeChangedCallback(name: string, oldValue: string, newValue: string) {
                if (oldValue === newValue) {
                        return;
                }

                switch (name) {
                        case "label":
                                this.label.textContent = newValue;
                                break;
                        default:
                                return;
                }
        }
}