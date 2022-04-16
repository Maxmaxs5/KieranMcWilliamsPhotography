import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import ErrorPage from "next/error";

import Collection from "components/Collection";

import { collections } from "data/collections";

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: collections.map((each) => {
      return { params: { folder: each.folder } };
    }),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {},
  };
};

export default function CollectionPage() {
  const router = useRouter();
  const { folder } = router.query;

  const collection = collections.find((each) => each.folder === folder);

  // Shouldn't be needed due to getStaticPaths, but will leave here
  if (!collection) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <div id="bodyContainer">
      <Collection collection={collection} />
    </div>
  );
}
