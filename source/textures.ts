export class TextureSVG {
        static parser = new DOMParser();
        static serializer = new XMLSerializer();

        public svg: Document | undefined;
        public image: HTMLImageElement | undefined;

        private refreshQueued: boolean;
        private refreshing: boolean;

        constructor(private path: string) {
                this.svg = undefined;
                this.image = undefined;
                this.refreshQueued = false;
                this.refreshing = false;
        }

        async load() {
                const response = await fetch(this.path);
                const text = await response.text();
                this.svg = TextureSVG.parser.parseFromString(text, "image/svg+xml");
                await this.rasterize();
        }

        async rasterize() {
                if (this.svg === undefined) {
                        throw new Error("SVG for texture is not loaded");
                }

                if (this.refreshing) {
                        this.refreshQueued = true;
                        return;
                }

                this.refreshing = true;

                const string = TextureSVG.serializer.serializeToString(this.svg);

                const blob = new Blob([string], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const image = new Image();

                this.image = await new Promise<HTMLImageElement>((resolve, reject) => {
                        image.onload = () => {
                                resolve(image);
                        };

                        image.onerror = error => {
                                reject(error);
                        };

                        image.src = url;
                });

                this.refreshing = false;
                if (this.refreshQueued) {
                        this.refreshQueued = false;
                        await this.rasterize();
                }
        }
}