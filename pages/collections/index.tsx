import type { NextPage } from "next";

import PhotoAlbumGrid from "components/PhotoAlbumGrid";

const CollectionsPage: NextPage = () => {
  return (
    <>
      {/* <Head>
        <title>McWilliams Photo</title>
        <meta name="description" content="Welcome to my photography website! I hope you enjoy your stay!" />

        <meta property="og:title" content="McWilliams Photo Website" />
        <meta property="og:image" content="https://kieranmcwilliams.com/Kieran_McWilliams_Website_Image.png" />
        <meta property="og:description" content="Welcome to my photography website! I hope you enjoy your stay!" />
      </Head> */}

      <div id="bodyContainer">
        <PhotoAlbumGrid isHome={false} />
      </div>
    </>
  );
};

export default CollectionsPage;
