import React, { useState } from "react";
import { useRouter } from "next/router";

import PhotoAlbum from "components/PhotoAlbum";

import { collections } from "data/collections";

export default function PhotoAlbumGrid({ isHome }: { isHome: boolean }) {
  const router = useRouter();
  const { filter } = router.query;

  const [active, setActive] = useState(
    typeof filter === "string" && filter ? filter : "All"
  );

  const filterOptions = ["All", "People", "Nature"];

  return (
    <>
      <div id="photoAlbumsFilter" style={{ marginTop: isHome ? 0 : "" }}>
        {filterOptions.map((each, index) => {
          return (
            <React.Fragment key={each}>
              <h3
                className={active === each ? "active" : ""}
                onClick={() => {
                  setActive(each);

                  if (!isHome) {
                    router.replace({
                      query: each !== "All" ? { filter: each } : {},
                    });
                  }
                }}
              >
                {each}
              </h3>
              {index < filterOptions.length - 1 ? (
                <div className="verticalDivider" />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      <div id="photoAlbums">
        {collections.map((each) =>
          active === "All" || each.type.includes(active) ? (
            <PhotoAlbum collection={each} key={each.folder} />
          ) : null
        )}
      </div>
    </>
  );
}
