export function setupDropdowns() {
        document.querySelectorAll<HTMLDivElement>(".dropdown").forEach(dropdown => {
                const input = dropdown.querySelector<HTMLInputElement>("input")!;
                const select = dropdown.querySelector<HTMLButtonElement>("button")!;
                const list = dropdown.querySelector<HTMLUListElement>("ul")!;

                select.addEventListener("click", () => {
                        list.style.display = list.style.display === "block" ? "none" : "block";
                });

                list.querySelectorAll<HTMLLIElement>("li").forEach(option => {
                        option.addEventListener("click", () => {
                                select.textContent = option.textContent;
                                list.style.display = "none";

                                const value = option.dataset.value;
                                if (value !== undefined) {
                                        input.value = value;
                                }
                        });
                });

                document.addEventListener("click", event => {
                        if (!(event.target instanceof Node)) {
                                return;
                        }

                        if (!dropdown.contains(event.target)) {
                                list.style.display = "none";
                        }
                });
        });
}