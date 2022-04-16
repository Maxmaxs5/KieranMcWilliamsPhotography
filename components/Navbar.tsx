import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import { getCurrentScrollPos } from "helpers/helpers";

export default function Navbar() {
  const router = useRouter();

  const navbarUpdates = () => {
    const scrollPos = getCurrentScrollPos(window, document);

    const navbar = document.getElementById("navbar");

    if (navbar) {
      if (scrollPos > 0 || router.route !== "/") {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }
  };

  useEffect(() => {
    if (typeof window !== undefined) {
      window.addEventListener("resize", (event) => {
        navbarUpdates();
      });
      window.addEventListener("scroll", (event) => {
        navbarUpdates();
      });
      navbarUpdates();
    }
  });

  return (
    <div id="navbar">
      <div id="navbarContainer">
        <Link href="/">
          <a id="navbarImage"></a>
        </Link>
        <Link href="/">
          <a id="navbarName">McWilliams Photo</a>
        </Link>

        <div id="navbarButtonsDiv">
          <Link href="/">
            <a
              className={`navbarButton ${router.route === "/" ? "active" : ""}`}
            >
              Home
            </a>
          </Link>
          <Link href="/collections">
            <a
              className={`navbarButton ${
                router.route.includes("collections") ? "active" : ""
              }`}
            >
              Collections
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
