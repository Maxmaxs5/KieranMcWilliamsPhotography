import fs from "fs";
import sharp from "sharp";
import { Storage } from "@google-cloud/storage";

import {
  gcpAlbumPhotoEnding,
  gcpAlbumPhotoBlurredEnding,
  gcpBlurDirName,
  gcpFullDirName,
  gcpOptimizedDirNameWeb,
  gcpOptimizedDirNameMobile,
  gcpOptimizedDirNameMobileGrid,
} from "../data/globals";


/*
 * Local upload pipeline helper, streamlines the process of taking images chosen for a new collection and:
 *   1. Uploading the full-resolution versions
 *   2. Creating and uploading custom optimized versions
 *   3. Uploading the handmade album image
 * 
 * The upload/photos directory is git-ignored, but should follow this structure:
 *   [{new collection folder name}]:
 *     {...new collection images}
 *     {new collection album image}
 * 
 * And after processing, both the local new collection directory and its mirror uploaded to GCP will look like:
 *   [{new collection folder name}]:
 *     [raw]:
 *       {...optimized new collection images}
 *     {...new collection images}
 *     {new collection album image}
 * 
 * Any non-directory files in upload/photos will be ignored by both Git and this pipeline.
 * 
 * Re-running this pipeline with previously-uploaded collection folders in upload/photos will not cause any problems.
 * 
 * Creating the album image is done by hand using Photoshop's export for web on a custom square crop,
 *   resized to 500x500, and should end up being under 500kb.
 */

const doingFastUpload = process.argv.includes("doFastUpload");
const doingUploadExisting = process.argv.includes("uploadExisting");

const minFileSizeKBWeb = 700;
const maxFileSizeKBWeb = 1000;
const minFileSizeKBMobile = 300;
const maxFileSizeKBMobile = 500;
const minFileSizeKBMobileGrid = 200;
const maxFileSizeKBMobileGrid = 250;
const startingSharpQuality = 50;
const sharpQualityIncrement = 5;
const sharpQualitySmallerIncrement = 2;

const sharpQualityFarPoint = 15;
const numSharpIterations =
  (Math.max(startingSharpQuality, 100 - startingSharpQuality) - sharpQualityFarPoint) / sharpQualityIncrement
  +
  (sharpQualityFarPoint) / sharpQualitySmallerIncrement;

const gcpBucketName = "mcwilliamsphoto";
const gcpDirNames = [
  gcpFullDirName, gcpOptimizedDirNameWeb, gcpOptimizedDirNameMobile, gcpOptimizedDirNameMobileGrid, gcpBlurDirName
];
const uploadPhotoDir = "upload/photos";

const watermarkMainLogoBasePath = "upload/mcwilliams_photo_logo_watermark";
const watermarkMainLogoPath = `${watermarkMainLogoBasePath}.png`;
const watermarkMainLogoPathSquare = `${watermarkMainLogoBasePath}_square.png`;
const watermarkCustomLogoBasePath = "upload/watermarks/mcwilliams_photo_logo";
// Width of each logo type as well as short edge of Fujifilm X-S10
const watermarkWidthPercentOfShortEdge = 3096 / 4160;
const watermarkWidthPercentOfShortEdgeSquare = 1750 / 4160;

const watermarks: {
  [shortEdgeLength: number]: {
    watermarkLogoPath: string;
    watermarkLogoPathSquare: string;
  }
} = {
  // Short edge for Fujifilm X-S10
  4160: {
    watermarkLogoPath: watermarkMainLogoPath,
    watermarkLogoPathSquare: watermarkMainLogoPathSquare
  }
};

const storage = new Storage();

/**
 * Returns whether to not process/upload a given file by GCP filepath
 * 
 * @param gcpPath The file's GCP path
 * @returns Whether the file should be not processed/uploaded
 */
const dontUploadFile = async (gcpPath: string) => {
  return doingFastUpload && await fileIsInGCP(gcpPath);
}

/**
 * Returns whether or not a file is in GCP
 * 
 * @param gcpPath The file's GCP path
 * @returns Whether or not the file is in GCP
 */
const fileIsInGCP = async (gcpPath: string) => {
  // Baseline results in file not existing within GCP
  let exists: boolean[] = [false];
  
  try {
    exists = await storage.bucket(gcpBucketName).file(gcpPath).exists();
  } catch (e) {
    console.log(e);
  }

  return !exists.flat().includes(false);
}

/**
 * Uploads a file to GCP
 * 
 * @param localPath The file's local path
 * @param gcpPath The file's to-be GCP path
 */
const uploadFile = async(localPath: string, gcpPath: string) => {
  if (await dontUploadFile(gcpPath)) {
    return;
  }

  try {
    await storage.bucket(gcpBucketName).upload(localPath, {
      destination: gcpPath,
      resumable: false
    });
  } catch (e) {
    console.log(e);
  }

  console.log(gcpPath);
}

/**
 * Watermarks the original full-res image, heavily blurs the original image, and uploads both
 * 
 * @param origLocalFilePath The local filepath for the original full-resolution image
 * @param fullLocalFilePath The local filepath for the watermarked full-resolution image
 * @param fullGCPFilePath The to-be GCP filepath for the watermarked full-resolution image
 * @param blurLocalFilePath The local filepath for the to-be blur image
 * @param blurGCPFilePath The to-be GCP filepath for the to-be blur image
 */
 const watermarkFullResAndBlurFullResAndUpload = async (
  origLocalFilePath: string,
  fullLocalFilePath: string,
  fullGCPFilePath: string,
  blurLocalFilePath: string,
  blurGCPFilePath: string,
) => {
  if (await dontUploadFile(fullGCPFilePath) && await dontUploadFile(blurGCPFilePath)) {
    return;
  }

  if (!doingUploadExisting || !fs.existsSync(fullLocalFilePath) || !fs.existsSync(blurLocalFilePath)) {
    // Sharp the original to the watermarked full-res
    const image = sharp(origLocalFilePath);
    await image
      .metadata()
      .then(async (metadata) => {
        if (!metadata || !metadata.height || !metadata.width) {
          console.log(`Metadata missing for ${origLocalFilePath}, skipping.`);
          return;
        }

        const shortEdgeLength = Math.min(metadata.height, metadata.width);
        const watermarkInfo = await getWatermarkInfo(shortEdgeLength);

        await image
          .composite([{
            input: watermarkInfo.watermarkLogoPath,
            gravity: 'southeast'
          }, {
            input: watermarkInfo.watermarkLogoPathSquare,
            gravity: 'centre'
          }])
          .jpeg({ quality: 100 })
          .toFile(fullLocalFilePath)
          .then(async (data) => {
            // Sharp the original to the blurred
            await sharp(origLocalFilePath)
              .resize({
                fit: sharp.fit.contain,
                height: data.height >= data.width ? 500 : undefined,
                width: data.width >= data.height ? 500 : undefined,
              })
              .blur()
              .jpeg({ quality: 10 })
              .toFile(blurLocalFilePath)
          });
      });
  }
  
  try {
    await uploadFile(fullLocalFilePath, fullGCPFilePath);
    await uploadFile(blurLocalFilePath, blurGCPFilePath);
  } catch (e) {
    console.log(e);
  }
}

/**
 * A recursive function that optimizes and uploads an image to be within the file size range set above
 * 
 * @param origLocalFilePath The local filepath for the original full-resolution image
 * @param optimizedLocalFilePath The local filepath for the to-be optimized image
 * @param optimizedGCPFilePath The to-be GCP filepath for the to-be optimized image
 * @param minFileSizeKB The minimum file size in KB this method allows to be called "optimized" and thus uploads when in range
 * @param maxFileSizeKB The maximum file size in KB this method allows to be called "optimized" and thus uploads when in range
 * @param quality The quality to be used by Sharp when optimizing the image
 * @param iteration The current iteration counter, ensures that this method does not infinite loop by exiting early,
 *   if unable to make it within the file size range within the set number of iterations
 */
const optimizeAndUpload = async (
  origLocalFilePath: string,
  optimizedLocalFilePath: string,
  optimizedGCPFilePath: string,
  minFileSizeKB: number,
  maxFileSizeKB: number,
  quality = startingSharpQuality,
  iteration = 0
) => {
  if (await dontUploadFile(optimizedGCPFilePath)) {
    return;
  }

  const runWhenDoneLooping = async () => {
    try {
      await uploadFile(optimizedLocalFilePath, optimizedGCPFilePath);
    } catch (e) {
      console.log(e);
    }
  }

  if (doingUploadExisting && fs.existsSync(optimizedLocalFilePath)) {
    await runWhenDoneLooping();
    return;
  }

  // Sharp the original to the optimized
  const image = sharp(origLocalFilePath);
  await image
    .metadata()
    .then(async (metadata) => {
      if (!metadata || !metadata.height || !metadata.width) {
        console.log(`Metadata missing for ${origLocalFilePath}, skipping.`);
        return;
      }

      const shortEdgeLength = Math.min(metadata.height, metadata.width);
      const watermarkInfo = await getWatermarkInfo(shortEdgeLength);

      let imageBuffer = await image
        .composite([{
          input: watermarkInfo.watermarkLogoPathSquare,
          gravity: 'centre'
        }])
        .toBuffer();
      
      if (optimizedGCPFilePath.includes(gcpOptimizedDirNameMobileGrid)) {
        imageBuffer = await sharp(imageBuffer)
          .resize({
            fit: sharp.fit.contain,
            height: metadata.height <= metadata.width ? 1000 : undefined,
            width: metadata.width <= metadata.height ? 1000 : undefined,
          })
          .toBuffer();
      }

      await sharp(imageBuffer)
        .jpeg({ quality: Math.min(Math.max(quality, 0), 100) })
        .toFile(optimizedLocalFilePath)
        .then(async (data) => {
          const fileSizeKB = Math.round(data.size / 1024);
          
          if (
            iteration > numSharpIterations
            ||
            (fileSizeKB >= minFileSizeKB && fileSizeKB <= maxFileSizeKB)
          ) {
            console.log({optimizedGCPFilePath, iteration, quality, fileSizeKB});

            await runWhenDoneLooping();
          } else {
            const increment = quality < 85 && quality > 15 ? sharpQualityIncrement : sharpQualitySmallerIncrement;

            const newQuality = fileSizeKB < minFileSizeKB ? quality + increment : quality - increment;
            
            await optimizeAndUpload(
              origLocalFilePath, optimizedLocalFilePath, optimizedGCPFilePath,
              minFileSizeKB, maxFileSizeKB, newQuality, iteration + 1
            );
          }
        });
    });
}

/**
 * A function that blurs and uploads both the original and blurred versions of the given album image
 * 
 * @param albumLocalFilePath The local filepath for the custom album image
 * @param albumGCPFilePath The to-be GCP filepath for the blurred custom album image
 */
 const blurAndUploadAlbumPhoto = async (
  albumLocalFilePath: string,
  albumGCPFilePath: string,
) => {
  if (await dontUploadFile(albumGCPFilePath)) {
    return;
  }

  const albumBlurredLocalFilePath = albumLocalFilePath.replace(gcpAlbumPhotoEnding, gcpAlbumPhotoBlurredEnding);
  const albumBlurredGCPFilePath = albumGCPFilePath.replace(gcpAlbumPhotoEnding, gcpAlbumPhotoBlurredEnding);
  
  if (!doingUploadExisting || !fs.existsSync(albumBlurredLocalFilePath)) {
    // Sharp the album photo to the blurred album photo
    await sharp(albumLocalFilePath)
      .resize({
        height: 200,
        width: 200,
      })
      .blur()
      .jpeg({ quality: 10 })
      .toFile(albumBlurredLocalFilePath);
  }
  
  try {
    await uploadFile(albumLocalFilePath, albumGCPFilePath);
    await uploadFile(albumBlurredLocalFilePath, albumBlurredGCPFilePath);
  } catch (e) {
    console.log(e);
  }
}

/**
 * Returns, potentially after creating, a watermark specifically sized to the short edge length param
 * 
 * @param shortEdgeLength The short edge of the image that needs a watermark
 * @returns The watermark info for an image of the short edge length
 */
const getWatermarkInfo = async (shortEdgeLength: number) => {
  const watermarkInfo = watermarks[shortEdgeLength];

  if (!watermarkInfo) {
    const newWatermarkInfo = await createWatermarks(shortEdgeLength);
    return newWatermarkInfo;
  } else {
    return watermarkInfo;
  }
}

/**
 * Creates then returns a watermark specifically sized to the short edge length param
 * 
 * @param shortEdgeLength The short edge of the image that needs a watermark
 * @returns The watermark info for an image of the short edge length
 */
const createWatermarks = async (shortEdgeLength: number) => {
  const newWatermarkInfo = {
    watermarkLogoPath: `${watermarkCustomLogoBasePath}_${shortEdgeLength}.png`,
    watermarkLogoPathSquare: `${watermarkCustomLogoBasePath}_square_${shortEdgeLength}.png`,
  }

  await Promise.all([
    sharp(watermarkMainLogoPath)
      .resize({
        fit: sharp.fit.contain,
        width: Math.round(shortEdgeLength * watermarkWidthPercentOfShortEdge),
      })
      .png({ quality: 100 })
      .toFile(newWatermarkInfo.watermarkLogoPath)
    ,
    sharp(watermarkMainLogoPathSquare)
      .resize({
        fit: sharp.fit.contain,
        width: Math.round(shortEdgeLength * watermarkWidthPercentOfShortEdgeSquare),
      })
      .png({ quality: 100 })
      .toFile(newWatermarkInfo.watermarkLogoPathSquare)
  ]);

  watermarks[shortEdgeLength] = newWatermarkInfo;
  return newWatermarkInfo;
}

/**
 * Reads, optimizes, and uploads all folders within the given directory
 * 
 * If directory is not structured as expected will fail
 * 
 * @param path The path to the directory to be read and uploaded
 */
const readDirAndUpload = async(path: string) => {
  let newCollectionFolders: string[];
  try {
    newCollectionFolders = await fs.promises.readdir(path);
  } catch (e) {
    console.log(e);
    return;
  }
  if (!newCollectionFolders) {
    console.log("newCollectionFolders undefined");
    return;
  }

  for (const newCollectionFolder of newCollectionFolders) {
    const folderFilePath = `${path}/${newCollectionFolder}`;

    if (fs.lstatSync(folderFilePath).isDirectory()) {
      let newFiles: string[];
      try {
        newFiles = await fs.promises.readdir(folderFilePath);
      } catch (e) {
        console.log(e);
        return;
      }
      if (!newFiles) {
        console.log("newFiles undefined");
        return;
      }

      const localDirPaths = gcpDirNames.map(each => {
        return `${folderFilePath}/${each}`;
      });

      const [
        fullLocalDirPath, optimizedLocalDirPathWeb, optimizedLocalDirPathMobile, optimizedLocalDirPathMobileGrid, blurLocalDirPath
      ] = localDirPaths;

      localDirPaths.forEach(each => {
        if (!doingFastUpload && fs.existsSync(each)) {
          fs.rmSync(each, { recursive: true, force: true });
        }

        if (!fs.existsSync(each)) {
          fs.mkdirSync(each);
        }
      });
    
      // newFiles.forEach(async (newFile) => {
      for (const newFile of newFiles) {
        const filePath = `${folderFilePath}/${newFile}`;

        if (!fs.lstatSync(filePath).isDirectory()) {
          if (newFile.includes(gcpAlbumPhotoEnding)) {
            await blurAndUploadAlbumPhoto(
              filePath, `${newCollectionFolder}/${newFile}`,
            );
          } else if (!newFile.includes(gcpAlbumPhotoBlurredEnding)) {
            const gcpFilePaths = gcpDirNames.map(each => {
              return `${newCollectionFolder}/${each}/${newFile}`;
            });

            const [
              fullGCPFilePath, optimizedGCPFilePathWeb, optimizedGCPFilePathMobile, optimizedGCPFilePathMobileGrid, blurGCPFilePath
            ] = gcpFilePaths;
            
            await Promise.all([
              // Web
              optimizeAndUpload(
                filePath,
                `${optimizedLocalDirPathWeb}/${newFile}`, optimizedGCPFilePathWeb,
                minFileSizeKBWeb, maxFileSizeKBWeb
              ),
              // Mobile
              optimizeAndUpload(
                filePath,
                `${optimizedLocalDirPathMobile}/${newFile}`, optimizedGCPFilePathMobile,
                minFileSizeKBMobile, maxFileSizeKBMobile
              ),
              // Mobile Grid
              optimizeAndUpload(
                filePath,
                `${optimizedLocalDirPathMobileGrid}/${newFile}`, optimizedGCPFilePathMobileGrid,
                minFileSizeKBMobileGrid, maxFileSizeKBMobileGrid
              ),
              // Full-Res and Blurred
              watermarkFullResAndBlurFullResAndUpload(
                filePath,
                `${fullLocalDirPath}/${newFile}`, fullGCPFilePath,
                `${blurLocalDirPath}/${newFile}`, blurGCPFilePath
              ),
            ]);
          }
        } else {
          if (!gcpDirNames.some(each => filePath.endsWith(each))) {
            console.log(`${filePath} is not a file`);
          }
        }
      // });
      }
    } else {
      console.log(`${folderFilePath} is not a directory`);
    }
  }

  console.log("DONE");
}

readDirAndUpload(uploadPhotoDir);