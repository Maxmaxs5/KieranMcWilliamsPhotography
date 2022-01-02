import { Dispatch, MouseEvent, SetStateAction, useEffect, useState } from 'react';
import Image from 'next/image';

import { gcpBaseURL, gcpBlurDirName, gcpOptimizedDirNameWeb, gcpOptimizedDirNameMobile } from 'data/globals';

import { Collection, CollectionPhoto } from 'types/Collection';
import { windowIsMobile } from 'helpers/helpers';


export default function PhotoCollage({
  collection,
  isHighlights,
  setCurrentIndexSharedState
}: {
  collection: Collection,
  isHighlights?: boolean,
  setCurrentIndexSharedState: Dispatch<SetStateAction<number>>
}) {
  const [ widthVW, setWidthVW ] = useState(75);

  const photoCollageUpdates = () => {
    if (window.matchMedia("only screen and (min-width: 0px) and (max-width: 1100px)").matches) {
      if (widthVW !== 96) {
        setWidthVW(96);
      }
    } else if (widthVW !== 75) {
      setWidthVW(75);
    }
  }
  
  useEffect(() => {
    if (typeof window !== undefined) {
      window.addEventListener("resize", (event) => {
        photoCollageUpdates();
      });
      window.addEventListener("scroll", (event) => {
        photoCollageUpdates();
      })
      photoCollageUpdates();
    }
  });

  /**
   * Parse the collection's rows/cols value, meaning append "span" to the front if it is a number,
   *   otherwise leave alone as already includes "span" and potentially more
   */
  const parseCollectionRowsCols = (value: number | string) => {
    if (typeof value === "number") {
      return `span ${value}`;
    } else {
      return value;
    }
  }

  const handleImageClick = (event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, index: number) => {
    setCurrentIndexSharedState(index);
  }

  const getImage = (imgFolder: string, each: CollectionPhoto, webOrMobileDirName: string) => {
    return <Image
      src={`${gcpBaseURL}/${imgFolder}/${webOrMobileDirName}/${each.src}`}
      unoptimized
      placeholder="blur"
      blurDataURL={`${gcpBaseURL}/${imgFolder}/${gcpBlurDirName}/${each.src}`}
      layout="fill"
      objectFit="cover"
      objectPosition="center center"
    />;
  }


  return (
    <div id="photoCollage" style={{
      height: `calc(${widthVW}vw / 18 * ${collection.totalRows})`,
      width: `${widthVW}vw`,
      gridTemplateRows: `repeat(${collection.totalRows}, 1fr)`
    }}>
      {
        collection.photos.map((each, index) => {
          const imgFolder = isHighlights && each.folder ? each.folder : collection.folder;

          return (
            <div
              style={{
                gridRow: parseCollectionRowsCols(each.rows),
                gridColumn: parseCollectionRowsCols(each.cols),
              }}
              onClick={(e) => handleImageClick(e, index)}
              key={each.src}
            >
              <div>
                {
                  typeof window !== "undefined"
                    ? getImage(imgFolder, each, windowIsMobile(window) ? gcpOptimizedDirNameMobile : gcpOptimizedDirNameWeb)
                    : null
                }
              </div>
              {/* <div className="nextJSImageWebMobile web">
                {getImage(imgFolder, each, gcpOptimizedDirNameWeb)}
              </div>
              <div className="nextJSImageWebMobile mobile">
                {getImage(imgFolder, each, gcpOptimizedDirNameMobile)}
              </div> */}
            </div>
          )
        })
      }
    </div>
  )
}