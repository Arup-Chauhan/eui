/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import chroma from 'chroma-js';
import { shade, tint, lightness as getLightness } from './manipulation';
import { getOn } from '../theme/utils';

export const wcagContrastMin = 4.5; // WCAG AA minimum contrast ratio for normal (non-large) text

/**
 * Creates a new color that meets or exceeds WCAG level AA
 * @param foreground - Color to manipulate
 * @param ratio - Amount to change in absolute terms. 0-10.
 * *
 * @param themeOrBackground - Color to use as the contrast basis or just pass EuiTheme
 */
export const makeHighContrastColor =
  (_foreground: string, ratio = 4.85) =>
  (
    themeOrBackground:
      | string
      | {
          colors: { body: string };
          [key: string]: any;
        }
  ) => {
    const foreground = (
      typeof themeOrBackground === 'object'
        ? getOn(themeOrBackground, _foreground) ?? _foreground
        : _foreground
    ) as string;
    const background =
      typeof themeOrBackground === 'object'
        ? themeOrBackground.colors.body
        : themeOrBackground;

    if (chroma(foreground).alpha() < 1 || chroma(background).alpha() < 1) {
      console.warn(
        `Contrast cannot be accurately calculated when colors have alpha channel opacity. Make sure the provided foreground and background colors have no transparency:

Foreground: ${foreground}
Background: ${background}`
      );
    }

    let contrast = chroma.contrast(foreground, background);

    // Determine the lightness factor of the background color first to
    // determine whether to shade or tint the foreground.
    const brightness = getLightness(background);

    let highContrastTextColor = foreground;

    while (contrast < ratio) {
      if (brightness > 50) {
        highContrastTextColor = shade(highContrastTextColor, 0.05);
      } else {
        highContrastTextColor = tint(highContrastTextColor, 0.05);
      }

      contrast = chroma.contrast(highContrastTextColor, background);

      const lightness = getLightness(highContrastTextColor);

      if (lightness < 5) {
        console.warn(
          'High enough contrast could not be determined. Most likely your background color does not adjust for light mode.'
        );
        return highContrastTextColor;
      }

      if (lightness > 95) {
        console.warn(
          'High enough contrast could not be determined. Most likely your background color does not adjust for dark mode.'
        );
        return highContrastTextColor;
      }
    }

    return chroma(highContrastTextColor).hex();
  };

/**
 * Creates a new color with increased contrast
 * Disabled content only needs a contrast of at least 2 because there is no interaction available
 * @param foreground - Color to manipulate
 * @param ratio - Amount to change in absolute terms. 0-10.
 * *
 * @param themeOrBackground - Color to use as the contrast basis
 */
export const makeDisabledContrastColor =
  (color: string, ratio = 2) =>
  (
    themeOrBackground:
      | string
      | {
          colors: { body: string };
          [key: string]: any;
        }
  ) =>
    makeHighContrastColor(color, ratio)(themeOrBackground);

    // packages/eui/src/services/color/contrast.ts


/**
 * Gets the contrast ratio between two colors.
 * @param {string} textColor - The text color in hexadecimal format.
 * @param {string} backgroundColor - The background color in hexadecimal format.
 * @returns {number} - The contrast ratio.
 */
export const getColorContrast = (textColor: string, backgroundColor: string): number => {
  return chroma.contrast(textColor, backgroundColor);
};

/**
 * Warns if the contrast ratio is below a minimum threshold.
 * @param {string} textColor - The text color.
 * @param {string} backgroundColor - The background color.
 * @param {number} wcagContrastMin - Minimum contrast ratio threshold.
 */
export const warnIfContrastBelowMin = (textColor: string, backgroundColor: string, wcagContrastMin: number): void => {
  const contrastRatio = getColorContrast(textColor, backgroundColor);
  if (contrastRatio < wcagContrastMin) {
    console.warn(
      `Warning: ${backgroundColor} background with ${textColor} text has a low contrast ratio of ${contrastRatio.toFixed(
        2
      )}. Should be above ${wcagContrastMin}.`
    );
  }
};
