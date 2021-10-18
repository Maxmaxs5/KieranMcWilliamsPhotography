import Image from 'next/image';
import { MouseEventHandler } from 'react';

import { imageLoader } from '../helpers/helpers';
import { gcpOptimizedDirName } from '../data/globals';
import { Collection } from '../types/Collection';


export default function PhotoCollage({
  collection
}: {
  collection: Collection
}) {
  /**
   * Parse the collection's rows/cols value, meaning append "span" to the front if it is a number,
   *   otherwise leave alone as already includes "span" and potentially more
   * 
   * @param value 
   * @returns 
   */
  const parseCollectionRowsCols = (value: number | string) => {
    if (typeof value === "number") {
      return `span ${value}`;
    } else {
      return value;
    }
  }

  /**
   * Handles the click of an image in the collage, bringing up the full-resolution lightbox display for that image
   * 
   * @param event The mouse event
   */
  const handleImageClick: MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLImageElement;

    if (!target) {
      return;
    }

    const lightbox = document.getElementById("lightbox");

    if (lightbox) {
      const img = document.createElement("img");

      img.src = target.src.replace(`/${gcpOptimizedDirName}`, "");

      lightbox.appendChild(img);
      // lightbox.innerHTML = `<img src="${imgURL}">`;
      lightbox.style.display = "";
    }
  }

  return (
    <div id="photoCollage" style={{
      height: `calc(96vw / 18 * ${collection.totalRows})`,
      gridTemplateRows: `repeat(${collection.totalRows}, 1fr)`
    }}>
      {
        collection.photos.map(each => (
          <div
            style={{gridRow: parseCollectionRowsCols(each.rows), gridColumn: parseCollectionRowsCols(each.cols)}}
            onClick={handleImageClick}
            key={each.src}
          >
            <Image loader={imageLoader} src={`${collection.folder}/${gcpOptimizedDirName}/${each.src}`} width="100%" height="100%" />
          </div>
        ))
      }
    </div>
  )
}