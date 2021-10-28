import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

import Collection from 'components/Collection';

import { getCurrentScrollPos, imageLoader } from 'helpers/helpers';

import { highlightsCollection } from 'data/collections';

import type { NextPage } from 'next';


const Home: NextPage = () => {
  const router = useRouter();

  let previousWindowSize = { height: 0, width: 0 };

  useEffect(() => {
    const unload = () => ScrollTrigger.getAll().forEach(each => each.kill());

    const load = () => {
      if (typeof window !== undefined) {
        previousWindowSize = { height: window.innerHeight, width: window.innerWidth };
        
        gsap.registerPlugin(ScrollTrigger);

        // Because we below completely re-load on resize, we don't need to worry about it smart-refreshing itself,
        //   at least on "resize", which we removed from the below otherwise default list,
        //   this alleviates page jitter when the top bar on mobile fluctuates, resizing the page
        ScrollTrigger.config({
          autoRefreshEvents: "visibilitychange,DOMContentLoaded,load"
        });

        const vhFunc = (vh: number) => window.innerHeight * (vh / 100);

        [1, 2, 3, 4].forEach(each => {
          const eachSelector = `.aboutTextTitle:nth-of-type(${each})`;
          
          gsap.to(eachSelector, {
            scrollTrigger: {
              trigger: eachSelector,
              start: () => "top " + vhFunc(95),
              end: () => "top " + vhFunc(55),
              // scrub: true,
              scrub: 0.5,
              // markers: true,
            },
            transform: "",
            color: () => window.matchMedia('(prefers-color-scheme: dark)').matches ? "white" : "#333",
            ease: "power1",
          });
        })

        const startingImageHeight = Math.round(window.innerWidth * .96 * 2 / 3);
        const finalImageHeight = Math.round(Math.min(startingImageHeight * 2, window.innerHeight * .84));
        const imageAdjustment = Math.round((finalImageHeight / 2 - startingImageHeight / 2));

        ["#showcasePortrait", "#showcaseNature"].forEach(each => {
          const showcaseBackground = document.querySelector(`${each} .showcaseBackground`) as HTMLElement | null;
          if (showcaseBackground) {
            showcaseBackground.style.height = (startingImageHeight) + "px";
            showcaseBackground.style.transform = "translate(0%, 0%)";
          }

          const showcaseDivider = document.querySelector(`${each}Divider`) as HTMLElement | null
          if (showcaseDivider) {
            showcaseDivider.style.paddingTop = imageAdjustment + "px";
          }

          gsap.to(`${each} .showcaseBackground`, {
            scrollTrigger: {
              trigger: each,
              start: () => "center " + vhFunc(50),
              end: () => vhFunc(120) + " top",
              scrub: true,
              // scrub: 0.5,
              pin: true,
              pinType: "fixed",
              anticipatePin: 1,
              // markers: true,
            },
            backgroundSize: "200%",
            backgroundPositionY: "33%",
            height: () => finalImageHeight + "px",
            y: () => "-" + imageAdjustment + "px",
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
      const beforeReloadScrollPos = getCurrentScrollPos(window, document);

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
        <title>McWilliams Photo</title>
        <meta name="description" content="Welcome to my photography website! I hope you enjoy your stay!" />

        <meta property="og:title" content="McWilliams Photo Website" />
        <meta property="og:image" content="https://kieranmcwilliams.com/Kieran_McWilliams_Website_Image.png" />
        <meta property="og:description" content="Welcome to my photography website! I hope you enjoy your stay!" />
      </Head> */}

      <div id="bodyContainer">
        <div id="profileDivBackground" className="containerDiv">
          <div id="profileDiv">
            <div id="resumePictureContainer">
              <Image loader={imageLoader} src={"TEMP_LOGO.png"} width={75} height={75} />
            </div>

            <div id="profilePictureNameEmailResumeContainer">
              <div id="profilePictureContainer">
                <div id="profilePicture"></div>
              </div>

              <div id="nameEmailResumeContainer">
                <h3 id="nameHeader">Kieran<br />McWilliams</h3>
                <a id="email" href="mailto:kieran.j@mcwilliams.cc">kieran.j@mcwilliams.cc</a>
              </div>
            </div>
          </div>
        </div>

        <div id="tiltedAboutDivBackground"></div>

        <p id="profileDivMadeByText" style={{display: "none"}}>Handcrafted by Kieran</p>

        <div id="aboutDiv" className="containerDiv">
          <h2 className="containerDivHeader">About</h2>

          <p className="aboutTextTitle" style={{transform: "translate(-40vw)"}}>Photographer.</p>
          <p className="aboutTextTitle" style={{transform: "translate(40vw)"}}>Freelancer.</p>
          <p className="aboutTextTitle" style={{transform: "translate(-40vw)"}}>Nature Lover.</p>
          <p className="aboutTextTitle" style={{transform: "translate(40vw)"}}>Vibe Specialist.</p>

          <p id="aboutText">
            I create stunning images for Professionals, Friends, Events, and Nature.
          </p>
        </div>

        <div className="dividerWrapper" style={{height: "10vh"}}><div className="divider" /></div>

        <div style={{width: "96vw", margin: "2vw"}}>
          <div id="showcasePortrait" className="showcaseDiv" style={{zIndex:50}}>
            <div className="showcaseBackground" style={{
              maxHeight: "84vh",
              background: "url(https://storage.googleapis.com/mcwilliamsphoto/DSCF7429_main.jpg) 50% 50% no-repeat",
              backgroundSize: "100%",
            }}>

            </div>
          </div>
        </div>

        <div id="showcasePortraitDivider" className="dividerWrapper" style={{height: "4vh"}}><div className="divider" /></div>

        <div style={{width: "96vw", margin: "2vw"}}>
          <div id="showcaseNature" className="showcaseDiv" style={{zIndex:50}}>
            <div className="showcaseBackground" style={{
              maxHeight: "84vh",
              background: "url(https://storage.googleapis.com/mcwilliamsphoto/DSCF6314_main.jpg) 50% 50% no-repeat",
              backgroundSize: "100%",
            }}>

            </div>
          </div>
        </div>

        <div id="showcaseNatureDivider" className="dividerWrapper" style={{height: "10vh"}}><div className="divider" /></div>

        <div id="collectionsAndHighlightsDiv">
          <div>
            <h2>Check out my</h2><h1><Link href="/collections">Collections</Link></h1>
          </div>

          <h2>Or see some Highlights:</h2>
        </div>

        <Collection collection={highlightsCollection} isHighlights />
      </div>
    </>
  )
}

export default Home
