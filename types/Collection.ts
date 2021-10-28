import { CollectionType } from "./CollectionType";


export interface Collection {
  folder: string,
  type: CollectionType,
  numPeople?: number,
  totalRows: number,
  albumPhoto: string,
  photos: {
    src: string,
    rows: number | string,
    cols: number | string,
    folder?: string,
  }[],
}