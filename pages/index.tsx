import { useEffect } from 'react';
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

import PhotoAlbumGrid from '../components/PhotoAlbumGrid';
import { imageLoader } from '../helpers/helpers'

import type { NextPage } from 'next'


const Home: NextPage = () => {
  const router = useRouter();

  let previousWindowSize = { height: 0, width: 0 };

  useEffect(() => {
    const unload = () => {console.log("UNLOAD");ScrollTrigger.getAll().forEach(each => each.kill());}

    const load = () => {
      console.log("LOAD");
      if (typeof window !== undefined) {
        previousWindowSize = { height: window.innerHeight, width: window.innerWidth };
        
        gsap.registerPlugin(ScrollTrigger);

        const vhFunc = (vh: number) => window.innerHeight * (vh / 100);

        ["#aboutText1", "#aboutText2", "#aboutText3", "#aboutText4"].forEach(each => {
          gsap.to(each, {
            scrollTrigger: {
              trigger: each,
              start: () => "top " + vhFunc(95),
              end: () => "top " + vhFunc(55),
              // scrub: true,
              scrub: 0.5,
              // markers: true,
            },
            transform: "",
            color: "white",
            ease: "power1",
            // transform: "translate(0)",
            // color: "white",
          });
        })

        const startingImageHeight = Math.round(window.innerWidth * .96 * 2 / 3);
        const finalImageHeight = Math.round(Math.min(startingImageHeight * 2, window.innerHeight * .84));
        const imageAdjustment = Math.round((finalImageHeight / 2 - startingImageHeight / 2));

        ["#intro", "#intro2"].forEach(each => {
          const element = document.querySelector(`${each} .background-container`);
          // TODO: FIX?
          if (element) {
            (element as HTMLElement).style.height = (startingImageHeight) + "px";
            // (element as HTMLElement).style.height = (startingImageHeight * 2) + "px";

            (element as HTMLElement).style.transform = "translate(0%, 0%)";
          }

          const introDivider = document.querySelector(`${each}Divider`)
          if (introDivider) {
            (introDivider as HTMLElement).style.paddingTop = imageAdjustment + "px";
          }

          gsap.to(`${each} .background-container`, {
            scrollTrigger: {
              trigger: each,
              start: () => "center " + vhFunc(50),
              // start: "top " + vhFunc(8),
              // start: "top top",
              // TODO: MAYBE DIFF?
              end: () => vhFunc(120) + " top",
              // end: "bottom center",
              scrub: true,
              // scrub: 0.5,
              pin: true,
              pinType: "fixed",
              // markers: true,
              anticipatePin: 1,
              // pinReparent: true, // IS A LAST RESORT
            },
            backgroundSize: "200%",
            backgroundPositionY: "33%",
            // scale: 2,
            // TODO: FIX?
            height: () => finalImageHeight + "px",
            y: () => "-" + imageAdjustment + "px",
            // transform: () => `translate(0, -${imageAdjustment + "px"})`,
          });
        })
      }
    };

    router.events.on('routeChangeStart', (url) => {
      if (url !== "/") {
        unload();
      }
    });

    window.addEventListener("resize", (event) => {
      const beforeReloadScrollPos = window.scrollY || document.documentElement.scrollTop;

      // If width same and only height changed (fluctuating top bar on mobile, don't rerender as it messes up page position)
      if (window.innerWidth === previousWindowSize.width && window.innerHeight !== previousWindowSize.height) {
        return;
      }

      unload();
      load();

      window.scrollTo(0, beforeReloadScrollPos);
    });

    load();
  }, []);

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
        <div id="profileDivBackground" className="containerDiv">
          <div id="profileDiv">
            <div id="resumePictureContainer">
              <Image loader={imageLoader} src={"TEMP_LOGO.png"} width={75} height={75} />
            </div>

            <div id="profilePictureNameEmailResumeContainer">
              <div id="profilePictureContainer">
                {/* <Image loader={imageLoader} src={gcpProfilePicture} width={250} height={250} /> */}
                <div id="profilePicture"></div>
              </div>

              <div id="nameEmailResumeContainer">
                <h3 id="nameHeader">Kieran<br />McWilliams</h3>
                <a id="email" href="mailto:kieran.j@mcwilliams.cc">kieran.j@mcwilliams.cc</a>
                <a id="myResume" href="https://bit.ly/kieran-resume-summer-2021">My Resume</a>
              </div>
            </div>
          </div>
        </div>

        <div id="tiltedAboutDivBackground"></div>

        <p id="profileDivMadeByText" style={{display: "none"}}>Handcrafted by Kieran</p>

        <div id="aboutDiv" className="containerDiv">
          <p id="about" className="navbarJump"></p>
          <h2 className="containerDivHeader">About</h2>

          <p id="aboutText1" style={{fontSize: "1.25em", transform: "translate(-40vw)", color: "transparent"}}>Photographer.</p>
          <p id="aboutText2" style={{fontSize: "1.25em", transform: "translate(40vw)", color: "transparent"}}>Freelancer.</p>
          <p id="aboutText3" style={{fontSize: "1.25em", transform: "translate(-40vw)", color: "transparent"}}>Nature Lover.</p>
          <p id="aboutText4" style={{fontSize: "1.25em", transform: "translate(40vw)", color: "transparent"}}>Vibe Specialist.</p>

          <p id="aboutText">
            I create stunning images for Professionals, Friends, Events, and Nature.
          </p>
        </div>

        <div className="dividerWrapper" style={{height: "10vh"}}><div className="divider" /></div>

        <div style={{width: "96vw", margin: "2vw"}}>
          <div id="intro" className="intro" style={{zIndex:50}}>
            <div className="background-container" style={{
              maxHeight: "84vh",
              background: "url(https://storage.googleapis.com/mcwilliamsphoto/DSCF7429_main.jpg) 50% 50% no-repeat",
              backgroundSize: "100%",
            }}>

            </div>
          </div>
        </div>

        <div id="introDivider" className="dividerWrapper" style={{height: "4vh"}}><div className="divider" /></div>

        <div style={{width: "96vw", margin: "2vw"}}>
          <div id="intro2" className="intro" style={{zIndex:50}}>
            <div className="background-container" style={{
              maxHeight: "84vh",
              background: "url(https://storage.googleapis.com/mcwilliamsphoto/DSCF6314_main.jpg) 50% 50% no-repeat",
              backgroundSize: "100%",
            }}>

            </div>
          </div>
        </div>

        <div id="intro2Divider" className="dividerWrapper" style={{height: "10vh"}}><div className="divider" /></div>

        <PhotoAlbumGrid isHome={true} />
      </div>
    </>
  )
}

export default Home
