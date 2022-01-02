import { Dispatch, MouseEvent, MouseEventHandler, SetStateAction } from 'react';
import Image from 'next/image';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight, faCircleNotch } from "@fortawesome/free-solid-svg-icons";
// Fixes, see https://github.com/FortAwesome/react-fontawesome/issues/134
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false; /* eslint-disable import/first */

import { gcpBaseURL, gcpBlurDirName, gcpFullDirName, gcpOptimizedDirNameWeb, gcpOptimizedDirNameMobile } from 'data/globals';

import { Collection } from 'types/Collection';
import { windowIsMobile } from 'helpers/helpers';


export default function Lightbox({
  collection,
  isHighlights,
  currentIndexSharedState,
  setCurrentIndexSharedState,
  fullResolutionSharedState,
  setFullResolutionSharedState
}: {
  collection: Collection,
  isHighlights?: boolean,
  currentIndexSharedState: number,
  setCurrentIndexSharedState: Dispatch<SetStateAction<number>>,
  fullResolutionSharedState: boolean,
  setFullResolutionSharedState: Dispatch<SetStateAction<boolean>>
}) {
  if (currentIndexSharedState < 0 || currentIndexSharedState >= collection.photos.length) {
    return <></>;
  }


  const lightboxPhoto = collection.photos[currentIndexSharedState];
  const imgFolder = isHighlights && lightboxPhoto.folder ? lightboxPhoto.folder : collection.folder;


  const handleLightboxOrCloseClick: MouseEventHandler<HTMLDivElement> = (event) => {
    setCurrentIndexSharedState(-1);
  }

  const handleLeftRightButtonClick = (event: MouseEvent<HTMLHeadingElement, globalThis.MouseEvent>, isLeftButton: boolean) => {
    cancelLightboxClose(event);

    setCurrentIndexSharedState(
      isLeftButton ? (
        currentIndexSharedState <= 0 ? collection.photos.length - 1 : currentIndexSharedState - 1
      ) : (
        currentIndexSharedState + 1 >= collection.photos.length ? 0 : currentIndexSharedState + 1
      )
    );
  }

  const handleClickFullResCheckbox: MouseEventHandler<HTMLDivElement> = (event) => {
    cancelLightboxClose(event);

    setFullResolutionSharedState(!fullResolutionSharedState)
  }

  const cancelLightboxClose: MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  }

  const getFullResolutionDiv = () => {
    return (
      <>
        <div id="lightboxFullResolutionDiv" onClick={handleClickFullResCheckbox}>
          <input type="checkbox" name="fullResolution" checked={fullResolutionSharedState} readOnly />

          <label htmlFor="fullResolution">
            <h1>Full Res.</h1>
          </label>
        </div>
      </>
    )
  }

  const getLeftRightButtonsAndName = () => {
    return (
      <>
        <h1 id="lightboxLeftButton" onClick={(e) => handleLeftRightButtonClick(e, true)}>
          <FontAwesomeIcon icon={faAngleLeft} className="lightboxButtonIcon" />
        </h1>
        <h2 id="lightboxImageName">{lightboxPhoto.src}</h2>
        <h1 id="lightboxRightButton" onClick={(e) => handleLeftRightButtonClick(e, false)}>
          <FontAwesomeIcon icon={faAngleRight} className="lightboxButtonIcon" />
        </h1>
      </>
    )
  }

  const getCloseButton = () => {
    return <h1 id="lightboxCloseButton" onClick={handleLightboxOrCloseClick}>Close</h1>;
  }

  const getImage = (webOrMobileDirName: string) => {
    return <Image
      onClick={cancelLightboxClose}
      src={`${gcpBaseURL}/${imgFolder}/${fullResolutionSharedState ? gcpFullDirName : webOrMobileDirName}/${lightboxPhoto.src}`}
      unoptimized
      placeholder="blur"
      blurDataURL={`${gcpBaseURL}/${imgFolder}/${gcpBlurDirName}/${lightboxPhoto.src}`}
      layout="fill"
      objectFit="contain"
      objectPosition="center center"
    />;
  }


  return (
    <div id="lightbox" onClick={handleLightboxOrCloseClick}>
      <div id="loadingSpinner">
        <FontAwesomeIcon icon={faCircleNotch} spin size="2x" />
      </div>

      <div id="lightboxImageDiv">
        <div>
          {
            typeof window !== "undefined"
              ? getImage(windowIsMobile(window) ? gcpOptimizedDirNameMobile : gcpOptimizedDirNameWeb)
              : null
          }
        </div>
      </div>

      <div className="lightboxActionDiv" onClick={cancelLightboxClose}>
        {getFullResolutionDiv()}

        <div className="verticalDivider" style={{margin: "0 .25em 0 1em"}} />

        {getLeftRightButtonsAndName()}

        <div className="verticalDivider" style={{margin: "0 1em 0 .25em"}} />

        {getCloseButton()}
      </div>

      <div className="lightboxActionDiv mobile" onClick={cancelLightboxClose}>
        <div>
          {getLeftRightButtonsAndName()}
        </div>

        <div>
          {getFullResolutionDiv()}

          <div className="verticalDivider" style={{margin: "0 1em"}} />

          {getCloseButton()}
        </div>
      </div>
    </div>
  )
}