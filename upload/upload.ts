import fs from "fs";
import sharp from "sharp";
import { Storage } from "@google-cloud/storage";

import { gcpAlbumPhotoEnding, gcpOptimizedDirName } from "../data/globals";


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
const uploadPhotoDir = "upload/photos";

const storage = new Storage();

/**
 * Uploads a file to GCP
 * 
 * @param localPath The file's local path
 * @param gcpPath The file's to-be GCP path
 */
const uploadFile = async(localPath: string, gcpPath: string) => {
  await storage.bucket(gcpBucketName).upload(localPath, {
    destination: gcpPath,
  });

  console.log(gcpPath);
}

/**
 * A recursive function that optimizes and uploads an image to be within the file size range set above
 * 
 * @param origLocalFilePath The local filepath for the original full-resolution image
 * @param origGCPFilePath The to-be GCP filepath for the original full-resolution image
 * @param optimizedLocalFilePath The local filepath for the to-be optimized image
 * @param optimizedGCPFilePath The to-be GCP filepath for the to-be optimized image
 * @param quality The quality to be used by Sharp when optimizing the image
 * @param iteration The current iteration counter, ensures that this method does not infinite loop by exiting early,
 *   if unable to make it within the file size range within the set number of iterations
 */
const optimizeAndUpload = (
  origLocalFilePath: string,
  origGCPFilePath: string,
  optimizedLocalFilePath: string,
  optimizedGCPFilePath: string,
  quality = startingSharpQuality,
  iteration = 0
) => {
  sharp(origLocalFilePath)
    .jpeg({ quality: quality })
    .toFile(optimizedLocalFilePath)
    .then((data) => {
      const fileSizeKB = Math.round(data.size / 1024);
      
      if (
        iteration > numSharpIterations
        ||
        (fileSizeKB >= minFileSizeKB && fileSizeKB <= maxFileSizeKB)
      ) {
        console.log({optimizedGCPFilePath, iteration, quality, fileSizeKB});

        uploadFile(origLocalFilePath, origGCPFilePath).catch(console.error);
        uploadFile(optimizedLocalFilePath, optimizedGCPFilePath).catch(console.error);
      } else {
        const increment = quality < 85 && quality > 15 ? sharpQualityIncrement : sharpQualitySmallerIncrement;

        const newQuality = fileSizeKB < minFileSizeKB ? quality + increment : quality - increment;
        
        optimizeAndUpload(
          origLocalFilePath, origGCPFilePath, optimizedLocalFilePath, optimizedGCPFilePath,
          newQuality, iteration + 1
        );
      }
    });
}

/**
 * Reads, optimizes, and uploads all folders within the given directory
 * 
 * If directory is not structured as expected will fail
 * 
 * @param path The path to the directory to be read and uploaded
 */
const readDirAndUpload = (path: string) => {
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

          const optimizedLocalDirPath = `${folderFilePath}/${gcpOptimizedDirName}`;

          if (!fs.existsSync(optimizedLocalDirPath)) {
            fs.mkdir(optimizedLocalDirPath, (err) => {
              if (err) {
                return console.log(err);
              }
            });
          }
        
          newFiles.forEach((newFile) => {
            const filePath = `${folderFilePath}/${newFile}`;

            if (!fs.lstatSync(filePath).isDirectory()) {
              if (newFile.includes(gcpAlbumPhotoEnding)) {
                uploadFile(
                  filePath, `${newCollectionFolder}/${newFile}`,
                );
              } else {
                optimizeAndUpload(
                  filePath, `${newCollectionFolder}/${newFile}`,
                  `${optimizedLocalDirPath}/${newFile}`, `${newCollectionFolder}/${gcpOptimizedDirName}/${newFile}`
                );
              }
            } else {
              console.log(`${filePath} is not a file`);
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