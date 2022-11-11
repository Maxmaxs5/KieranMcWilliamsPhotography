import Image from "next/image";
import Link from "next/link";

import { folderToTitle, imageLoader } from "helpers/helpers";
import {
  gcpAlbumPhotoEnding,
  gcpAlbumPhotoBlurredEnding,
  gcpBaseURL,
} from "data/globals";

import { Collection } from "types/Collection";

export default function PhotoAlbum({ collection }: { collection: Collection }) {
  return (
    <Link href={`/collections/${collection.folder}`}>
      <div>
        <div>
          <h1>:)</h1>
          <Image
            loader={imageLoader}
            src={`${collection.folder}/${
              collection.albumPhoto + gcpAlbumPhotoEnding
            }`}
            placeholder="blur"
            blurDataURL={`${gcpBaseURL}/${collection.folder}/${
              collection.albumPhoto + gcpAlbumPhotoBlurredEnding
            }`}
            width={250}
            height={250}
          />
        </div>

        <h2>{folderToTitle(collection.folder)}</h2>

        <h2>
          {collection.type +
            (collection.numPeople ? ` (${collection.numPeople})` : "")}
        </h2>
      </div>
    </Link>
  );
}
