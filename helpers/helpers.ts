import { ImageLoader } from 'next/image'

import { gcpBaseURL, maxWidthMobileLandscape, maxWidthMobilePortrait } from 'data/globals';


/**
 * Deconstructs a collection's folder string into its title
 * 
 * @param folder The folder string for a collection
 * @returns The title of the folder
 */
export const folderToTitle = (folder: string) => {
  return folder.replace(/_/g, " ");
}

/**
 * The global image loader for Next.js Image elements throughout the app
 * 
 * @param param0 An object with src defined (and width/quality as well, but are not really used,
 *   just pretended to be used to appease Next.js into thinking we're optimizing the image,
 *   but we simply always use the same pre-optimized version, allowing us to only need to make one custom image
 * @returns The full URL for the image to be used in the Next.js Image element
 */
export const imageLoader: ImageLoader = ({ src }) => {
  return `${gcpBaseURL}/${src}`;
  // return `${gcpBaseURL}/${src}?width=${width}`;
}

/**
 * Gets the current scroll position of the page
 * 
 * @param window The global window element, passed a param to ensure defined correctly in this scope
 * @param document The global document element, passed a param to ensure defined correctly in this scope
 * @returns The current scroll position
 */
export const getCurrentScrollPos = (window: Window & typeof globalThis, document: Document) => {
  if (typeof window !== undefined) {
    return window.scrollY || document.documentElement.scrollTop;
  } else {
    return 0;
  }
}

/**
 * Returns whether or not the window is in mobile, either portrait or landscape, based on best-guess media queries
 * 
 * @param window The global window element, passed a param to ensure defined correctly in this scope
 * @returns A boolean representing whether the current window is in mobile (true) or desktop (false)
 */
export const windowIsMobile = (window: Window & typeof globalThis) => {
  const portrait = `only screen and (min-width: 0px) and (max-width: ${maxWidthMobilePortrait}px) and (orientation: portrait)`;
  const landscape = `only screen and (min-height: 0px) and (max-height: ${maxWidthMobilePortrait}px) and (min-width: 0px) and (max-width: ${maxWidthMobileLandscape}px) and (orientation: landscape)`;

  return window.matchMedia(portrait).matches || window.matchMedia(landscape).matches;
}