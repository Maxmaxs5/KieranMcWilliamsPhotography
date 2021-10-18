import { ImageLoader } from 'next/image'

import { gcpBaseURL } from '../data/globals';


/**
 * Deconstructs a collection's folder string into its title
 * 
 * @param folder The folder string for a collection
 * @returns The title of the folder
 */
export const folderToTitle = (folder: string) => {
  return folder.substring(folder.indexOf("_") + 1).replace(/_/g, " ");
}

/**
 * Deconstructs a collection's folder string into its date string
 * 
 * @param folder The folder string for a collection
 * @returns The date string of the folder
 */
export const folderToMainDateString = (folder: string) => {
  return folder.substring(0, folder.indexOf("_"));
}

/**
 * The global image loader for Next.js Image elements throughout the app
 * 
 * @param param0 An object with src defined (and width/quality as well, but are not really used,
 *   just pretended to be used to appease Next.js into thinking we're optimizing the image,
 *   but we simply always use the same pre-optimized version, allowing us to only need to make one custom image
 * @returns The full URL for the image to be used in the Next.js Image element
 */
export const imageLoader: ImageLoader = ({ src, width, quality }) => {
  return `${gcpBaseURL}/${src}?width=${width}`;
}