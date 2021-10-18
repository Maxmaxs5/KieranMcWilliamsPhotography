import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import ErrorPage from 'next/error';

import PhotoCollage from '../../components/PhotoCollage';
import { collections } from '../../data/collections';

import { MouseEventHandler } from 'react';


export const getStaticPaths: GetStaticPaths = async() => {
  return {
    paths: collections.map(each => {
      return { params: { folder: each.folder } }
    }),
    fallback: false
  }
}

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {}
  }
}

export default function Collection() {
  const router = useRouter();
  const { folder } = router.query;

  const collection = collections.find(each => each.folder === folder);

  // Shouldn't be needed due to getStaticPaths, but will leave here
  if (!collection) {
    return <ErrorPage statusCode={404} />;
  }

  const handleLightboxClick: MouseEventHandler<HTMLDivElement> = () => {
    const lightbox = document.getElementById("lightbox");
    
    if (lightbox) {
      lightbox.replaceChildren(lightbox.children[0]);
      // lightbox.innerHTML = "";
      lightbox.style.display = "none";
    }
  }

  return (
    <>
      <div id="lightbox" style={{display: "none"}} onClick={handleLightboxClick}>
        <h1 id="lightboxCloseButton">X</h1>

        {/* Images dynamically inserted here */}
      </div>

      <div id="bodyContainer">
        <PhotoCollage collection={collection} />
      </div>
    </>
  )
}