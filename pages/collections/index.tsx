import Link from 'next/link'

import PhotoAlbumGrid from '../../components/PhotoAlbumGrid';

import type { NextPage } from 'next'


const Collections: NextPage = () => {
  return (
    <>
      {/* <Head>
        <title>Kieran McWilliams Photography</title>
        <meta name="description" content="Welcome to my photography website! I hope you enjoy your stay!" />

        <meta property="og:title" content="Kieran McWilliams Photography Website" />
        <meta property="og:image" content="https://kieranmcwilliams.com/Kieran_McWilliams_Website_Image.png" />
        <meta property="og:description" content="Welcome to my photography website! I hope you enjoy your stay!" />
      </Head> */}

      <div id="navbar">
        <div id="navbarContainer">
          <a style={{display:"none"}} id="navbarImage" href="#home"></a>
          <a id="navbarName" href="#">Kieran McWilliams</a>

          <div id="navbarButtonsDiv">
            <Link href="/"><a className="navbarButton">Home</a></Link>
            <Link href="/collections"><a className="navbarButton">Collections</a></Link>
          </div>

          {/* TESTING */}
          <div style={{display:"none"}}>
            <p id="testScroll"></p>
            <p id="testWidth"></p>
            <p id="testWidth2"></p>
            <p id="testHeight"></p>
          </div>

          <button id="mobileNavbarMenu">Menu <i className="fa fa-bars"></i></button>
        </div>
      </div>

      <div id="mobileNavbar" style={{height:"0px"}}>
        <div className="navbarButtonMobileDiv">
          <Link href="/"><a className="navbarButtonMobile">Home</a></Link>
        </div>
        <div className="navbarButtonMobileDiv">
          <Link href="/collections"><a className="navbarButtonMobile">Collections</a></Link>
        </div>
      </div>

      <div id="bodyContainer">
        <PhotoAlbumGrid isHome={false} />
      </div>
    </>
  )
}

export default Collections
