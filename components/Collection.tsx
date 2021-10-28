import { useState } from 'react';

import PhotoCollage from 'components/PhotoCollage';
import Lightbox from 'components/Lightbox';

import { Collection as CollectionType } from 'types/Collection';


export default function Collection({
  collection,
  isHighlights,
}: {
  collection: CollectionType,
  isHighlights?: boolean,
}) {
  const [ currentIndexSharedState, setCurrentIndexSharedState ] = useState(-1);
  const [ fullResolutionSharedState, setFullResolutionSharedState ] = useState(false);


  return (
    <>
      <Lightbox
        collection={collection}
        isHighlights={isHighlights}
        currentIndexSharedState={currentIndexSharedState}
        setCurrentIndexSharedState={setCurrentIndexSharedState}
        fullResolutionSharedState={fullResolutionSharedState}
        setFullResolutionSharedState={setFullResolutionSharedState}
      />

      <PhotoCollage
        collection={collection}
        isHighlights={isHighlights}
        setCurrentIndexSharedState={setCurrentIndexSharedState}
      />
    </>
  )
}