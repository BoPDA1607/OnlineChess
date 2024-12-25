import { Factory } from '../Factory';
import { Node, Filter } from '../Node';
import { getNumberValidator } from '../Validators';

function pixelAt(idata, x, y) {
  let idx = (y * idata.width + x) * 4;
  const d: Array<number> = [];
  d.push(
    idata.data[idx++],
    idata.data[idx++],
    idata.data[idx++],
    idata.data[idx++]
  );
  return d;
}

function rgbDistance(p1, p2) {
  return Math.sqrt(
    Math.pow(p1[0] - p2[0], 2) +
      Math.pow(p1[1] - p2[1], 2) +
      Math.pow(p1[2] - p2[2], 2)
  );
}

function rgbMean(pTab) {
  const m = [0, 0, 0];

  for (let i = 0; i < pTab.length; i++) {
    m[0] += pTab[i][0];
    m[1] += pTab[i][1];
    m[2] += pTab[i][2];
  }

  m[0] /= pTab.length;
  m[1] /= pTab.length;
  m[2] /= pTab.length;

  return m;
}

function backgroundMask(idata, threshold) {
  const rgbv_no = pixelAt(idata, 0, 0);
  const rgbv_ne = pixelAt(idata, idata.width - 1, 0);
  const rgbv_so = pixelAt(idata, 0, idata.height - 1);
  const rgbv_se = pixelAt(idata, idata.width - 1, idata.height - 1);

  const thres = threshold || 10;
  if (
    rgbDistance(rgbv_no, rgbv_ne) < thres &&
    rgbDistance(rgbv_ne, rgbv_se) < thres &&
    rgbDistance(rgbv_se, rgbv_so) < thres &&
    rgbDistance(rgbv_so, rgbv_no) < thres
  ) {
    // Mean color
    const mean = rgbMean([rgbv_ne, rgbv_no, rgbv_se, rgbv_so]);

    // Mask based on color distance
    const mask: Array<number> = [];
    for (let i = 0; i < idata.width * idata.height; i++) {
      const d = rgbDistance(mean, [
        idata.data[i * 4],
        idata.data[i * 4 + 1],
        idata.data[i * 4 + 2],
      ]);
      mask[i] = d < thres ? 0 : 255;
    }

    return mask;
  }
}

function applyMask(idata, mask) {
  for (let i = 0; i < idata.width * idata.height; i++) {
    idata.data[4 * i + 3] = mask[i];
  }
}

function erodeMask(mask, sw, sh) {
  const weights = [1, 1, 1, 1, 0, 1, 1, 1, 1];
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);

  const maskResult: Array<number> = [];
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const so = y * sw + x;
      let a = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = y + cy - halfSide;
          const scx = x + cx - halfSide;

          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            const srcOff = scy * sw + scx;
            const wt = weights[cy * side + cx];

            a += mask[srcOff] * wt;
          }
        }
      }

      maskResult[so] = a === 255 * 8 ? 255 : 0;
    }
  }

  return maskResult;
}

function dilateMask(mask, sw, sh) {
  const weights = [1, 1, 1, 1, 1, 1, 1, 1, 1];
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);

  const maskResult: Array<number> = [];
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const so = y * sw + x;
      let a = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = y + cy - halfSide;
          const scx = x + cx - halfSide;

          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            const srcOff = scy * sw + scx;
            const wt = weights[cy * side + cx];

            a += mask[srcOff] * wt;
          }
        }
      }

      maskResult[so] = a >= 255 * 4 ? 255 : 0;
    }
  }

  return maskResult;
}

function smoothEdgeMask(mask, sw, sh) {
  const weights = [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9];
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);

  const maskResult: Array<number> = [];
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const so = y * sw + x;
      let a = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = y + cy - halfSide;
          const scx = x + cx - halfSide;

          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            const srcOff = scy * sw + scx;
            const wt = weights[cy * side + cx];

            a += mask[srcOff] * wt;
          }
        }
      }

      maskResult[so] = a;
    }
  }

  return maskResult;
}

/**
 * Mask Filter
 * @function
 * @name Mask
 * @memberof Konva.Filters
 * @param {Object} imageData
 * @example
 * node.cache();
 * node.filters([Konva.Filters.Mask]);
 * node.threshold(200);
 */
export const Mask: Filter = function (imageData) {
  // Detect pixels close to the background color
  let threshold = this.threshold(),
    mask = backgroundMask(imageData, threshold);
  if (mask) {
    // Erode
    mask = erodeMask(mask, imageData.width, imageData.height);

    // Dilate
    mask = dilateMask(mask, imageData.width, imageData.height);

    // Gradient
    mask = smoothEdgeMask(mask, imageData.width, imageData.height);

    // Apply mask
    applyMask(imageData, mask);
  }

  return imageData;
};

Factory.addGetterSetter(
  Node,
  'threshold',
  0,
  getNumberValidator(),
  Factory.afterSetFilter
);