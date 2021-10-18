import { MouseEventHandler } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { imageLoader } from '../helpers/helpers';
import { folderToMainDateString, folderToTitle } from '../helpers/helpers';
import { gcpAlbumPhotoEnding } from '../data/globals';
import { Collection } from '../types/Collection';


export default function PhotoAlbum({
  collection
}: {
  collection: Collection
}) {
  return (
    <Link href={`/collections/${collection.folder}`}>
      <div>
        <div>
          <Image
            loader={imageLoader}
            src={`${collection.folder}/${collection.albumPhoto + gcpAlbumPhotoEnding}`}
            width={250}
            height={250}
          />
        </div>
        <h2>{folderToTitle(collection.folder)}</h2>
        <h2>{
          collection.type
          +
          (collection.numPeople ? ` (${collection.numPeople})` : '')
        }</h2>
        {/* <h2>{folderToMainDateString(collection.folder)}</h2> */}
      </div>
    </Link>
  )
}