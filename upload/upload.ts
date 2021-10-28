import fs from "fs";
import sharp from "sharp";
import { Storage } from "@google-cloud/storage";

import {
  gcpAlbumPhotoEnding,
  gcpAlbumPhotoBlurredEnding,
  gcpBlurDirName,
  gcpFullDirName,
  gcpOptimizedDirName
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
 */


const doingFastUpload = process.argv.includes("doFastUpload");

const minFileSizeKB = 700;
const maxFileSizeKB = 1000;
const startingSharpQuality = 50;
const sharpQualityIncrement = 5;
const sharpQualitySmallerIncrement = 2;

const sharpQualityFarPoint = 15;
const numSharpIterations =
  (Math.max(startingSharpQuality, 100 - startingSharpQuality) - sharpQualityFarPoint) / sharpQualityIncrement
  +
  (sharpQualityFarPoint) / sharpQualitySmallerIncrement;

const gcpBucketName = "mcwilliamsphoto";
const gcpDirNames = [ gcpFullDirName, gcpOptimizedDirName, gcpBlurDirName ];
const uploadPhotoDir = "upload/photos";

// TODO: NEW LOGO
// Note: sized to ~950x950 inner / 1750x3500 total and ~550x550 inner / 1000x2000 total
const watermarkLogoPathLG = "upload/TEMP_LOGO_NEW_LG.png";
const watermarkLogoPathSM = "upload/TEMP_LOGO_NEW_SM.png";
// Note: transparent to 33/255 = ~13%
const watermarkLogoPathLGTransparent = "upload/TEMP_LOGO_NEW_LG_TRANSPARENT.png";
const watermarkLogoPathSMTransparent = "upload/TEMP_LOGO_NEW_SM_TRANSPARENT.png";

const storage = new Storage();

/**
 * Uploads a file to GCP
 * 
 * @param localPath The file's local path
 * @param gcpPath The file's to-be GCP path
 */
const uploadFile = async(localPath: string, gcpPath: string) => {
  if (doingFastUpload) {
    const exists = await storage.bucket(gcpBucketName).file(gcpPath).exists();

    if (!exists.flat().includes(false)) {
      return;
    }
  }

  await storage.bucket(gcpBucketName).upload(localPath, {
    destination: gcpPath,
  });

  console.log(gcpPath);
}

/**
 * A recursive function that optimizes and uploads an image to be within the file size range set above
 * 
 * @param origLocalFilePath The local filepath for the original full-resolution image
 * @param fullLocalFilePath The local filepath for the watermarked full-resolution image
 * @param fullGCPFilePath The to-be GCP filepath for the watermarked full-resolution image
 * @param optimizedLocalFilePath The local filepath for the to-be optimized image
 * @param optimizedGCPFilePath The to-be GCP filepath for the to-be optimized image
 * @param blurLocalFilePath The local filepath for the to-be blur image
 * @param blurGCPFilePath The to-be GCP filepath for the to-be blur image
 * @param quality The quality to be used by Sharp when optimizing the image
 * @param iteration The current iteration counter, ensures that this method does not infinite loop by exiting early,
 *   if unable to make it within the file size range within the set number of iterations
 */
const optimizeAndUpload = (
  origLocalFilePath: string,
  fullLocalFilePath: string,
  fullGCPFilePath: string,
  optimizedLocalFilePath: string,
  optimizedGCPFilePath: string,
  blurLocalFilePath: string,
  blurGCPFilePath: string,
  quality = startingSharpQuality,
  iteration = 0
) => {
  // Sharp the original to the optimized
  sharp(origLocalFilePath)
    .composite([{
      input: origLocalFilePath.includes("DSCF") ? watermarkLogoPathLGTransparent : watermarkLogoPathSMTransparent,
      gravity: 'centre'
    }])
    .jpeg({ quality: Math.min(Math.max(quality, 0), 100) })
    .toFile(optimizedLocalFilePath)
    .then((data) => {
      const fileSizeKB = Math.round(data.size / 1024);
      
      if (
        iteration > numSharpIterations
        ||
        (fileSizeKB >= minFileSizeKB && fileSizeKB <= maxFileSizeKB)
      ) {
        console.log({optimizedGCPFilePath, iteration, quality, fileSizeKB});

        // Sharp the original to the blurred
        sharp(origLocalFilePath)
          .resize({
            fit: sharp.fit.contain,
            height: data.height > data.width ? 500 : undefined,
            width: data.width > data.height ? 500 : undefined,
          })
          .blur()
          .jpeg({ quality: 10 })
          .toFile(blurLocalFilePath)
          .then(() => {
            // Sharp the original to the watermarked full-res
            sharp(origLocalFilePath)
              .composite([{
                input: origLocalFilePath.includes("DSCF") ? watermarkLogoPathLG : watermarkLogoPathSM,
                gravity: 'southeast'
              }, {
                input: origLocalFilePath.includes("DSCF") ? watermarkLogoPathLGTransparent : watermarkLogoPathSMTransparent,
                gravity: 'centre'
              }])
              .jpeg({ quality: 100 })
              .toFile(fullLocalFilePath)
              .then(() => {
                uploadFile(fullLocalFilePath, fullGCPFilePath).catch(console.error);
                uploadFile(optimizedLocalFilePath, optimizedGCPFilePath).catch(console.error);
                uploadFile(blurLocalFilePath, blurGCPFilePath).catch(console.error);
              });
          });
      } else {
        const increment = quality < 85 && quality > 15 ? sharpQualityIncrement : sharpQualitySmallerIncrement;

        const newQuality = fileSizeKB < minFileSizeKB ? quality + increment : quality - increment;
        
        optimizeAndUpload(
          origLocalFilePath, fullLocalFilePath, fullGCPFilePath,
          optimizedLocalFilePath, optimizedGCPFilePath, blurLocalFilePath, blurGCPFilePath,
          newQuality, iteration + 1
        );
      }
    });
}

/**
 * A function that blurs and uploads both the original and blurred versions of the given album image
 * 
 * @param albumLocalFilePath The local filepath for the custom album image
 * @param albumGCPFilePath The to-be GCP filepath for the blurred custom album image
 */
 const blurAndUploadAlbumPhoto = (
  albumLocalFilePath: string,
  albumGCPFilePath: string,
) => {
  const albumBlurredLocalFilePath = albumLocalFilePath.replace(gcpAlbumPhotoEnding, gcpAlbumPhotoBlurredEnding);
  const albumBlurredGCPFilePath = albumGCPFilePath.replace(gcpAlbumPhotoEnding, gcpAlbumPhotoBlurredEnding);
    
  // Sharp the original to the blurred
  sharp(albumLocalFilePath)
    .resize({
      height: 200,
      width: 200,
    })
    .blur()
    .jpeg({ quality: 10 })
    .toFile(albumBlurredLocalFilePath)
    .then(() => {
      uploadFile(albumLocalFilePath, albumGCPFilePath).catch(console.error);
      uploadFile(albumBlurredLocalFilePath, albumBlurredGCPFilePath).catch(console.error);
    });
}

/**
 * Reads, optimizes, and uploads all folders within the given directory
 * 
 * If directory is not structured as expected will fail
 * 
 * @param path The path to the directory to be read and uploaded
 */
const readDirAndUpload = async(path: string) => {
  fs.readdir(path, (err, newCollectionFolders) => {
    if (err) {
      return console.log(err);
    }
  
    newCollectionFolders.forEach((newCollectionFolder) => {
      const folderFilePath = `${path}/${newCollectionFolder}`;

      if (fs.lstatSync(folderFilePath).isDirectory()) {
        fs.readdir(folderFilePath, (err, newFiles) => {
          if (err) {
            return console.log(err);
          }

          const [ fullLocalDirPath, optimizedLocalDirPath, blurLocalDirPath ] = gcpDirNames.map(each => {
            return `${folderFilePath}/${each}`;
          });

          [ fullLocalDirPath, optimizedLocalDirPath, blurLocalDirPath ].forEach(each => {
            if (!fs.existsSync(each)) {
              fs.mkdir(each, (err) => {
                if (err) {
                  return console.log(err);
                }
              });
            }
          })
        
          newFiles.forEach(async(newFile) => {
            const filePath = `${folderFilePath}/${newFile}`;

            if (!fs.lstatSync(filePath).isDirectory()) {
              if (newFile.includes(gcpAlbumPhotoEnding)) {
                blurAndUploadAlbumPhoto(
                  filePath, `${newCollectionFolder}/${newFile}`,
                )
              } else {
                const [ fullGCPFilePath, optimizedGCPFilePath, blurGCPFilePath ] = gcpDirNames.map(each => {
                  return `${newCollectionFolder}/${each}/${newFile}`;
                });
                
                let doUpload = true;
                if (doingFastUpload) {
                  const allExist = await Promise.all([
                    fullGCPFilePath, optimizedGCPFilePath, blurGCPFilePath
                  ].map(each => {
                    return storage.bucket(gcpBucketName).file(each).exists();
                  }))
                  
                  if (!allExist.flat().includes(false)) {
                    doUpload = false;
                  }
                }

                if (doUpload) {
                  optimizeAndUpload(
                    filePath,
                    `${fullLocalDirPath}/${newFile}`, fullGCPFilePath,
                    `${optimizedLocalDirPath}/${newFile}`, optimizedGCPFilePath,
                    `${blurLocalDirPath}/${newFile}`, blurGCPFilePath
                  );
                }
              }
            } else {
              if (!gcpDirNames.some(each => filePath.endsWith(each))) {
                console.log(`${filePath} is not a file`);
              }
            }
          });
        });
      } else {
        console.log(`${folderFilePath} is not a directory`);
      }
    });
  })
}

readDirAndUpload(uploadPhotoDir);