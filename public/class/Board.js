import CD from '../CD.js';

export class Board {
    constructor(x, y, layer) {
        this.x = x;
        this.y = y;
        this.layer = layer;
        this.squares = [];
        this.originalColors = [];
        this.prevPos = [];


        for (let i = 0; i < 64; i++) {
            const color = CD.COLORS[(parseInt(i / 8) + i % 8) % 2];
            const square = new Konva.Rect({
                x: (i % 8 + this.x) * CD.SIZE,
                y: (parseInt(i / 8) + this.y) * CD.SIZE,
                width: CD.SIZE,
                height: CD.SIZE,
                fill: color
            });

            this.layer.add(square);
            this.squares.push(square);
            this.originalColors.push(color);
        }
    }

    draw() {
        this.layer.draw();
    }

    changeSquareColorWithBlend(pos, newColor) {
        if (pos >= 0 && pos < 64) {
            const square = this.squares[pos];
            const currentColor = square.fill();
            const blendedColor = this.blendColors(currentColor, newColor);
            this.prevPos.push(pos);
            square.fill(blendedColor);
            this.layer.draw();
        }
    }

    blendColors(currentColor, newColor, blendFactor = 0.5) {
        const currentRGB = this.hexToRgb(currentColor);
        const newRGB = this.hexToRgb(newColor);

        const blendedRGB = {
            r: Math.round(currentRGB.r * (1 - blendFactor) + newRGB.r * blendFactor),
            g: Math.round(currentRGB.g * (1 - blendFactor) + newRGB.g * blendFactor),
            b: Math.round(currentRGB.b * (1 - blendFactor) + newRGB.b * blendFactor)
        };

        return this.rgbToHex(blendedRGB);
    }

    hexToRgb(hex) {
        const bigint = parseInt(hex.replace('#', ''), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }

    rgbToHex({ r, g, b }) {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    resetSquareColor() {
        while (this.prevPos.length > 0) {
            const pos = this.prevPos.pop();
            const square = this.squares[pos];
            square.fill(this.originalColors[pos]);
            this.layer.draw();
        }
    }
}

