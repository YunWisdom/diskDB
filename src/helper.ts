import Debug from 'debug';
import { manual as mkdirp } from 'mkdirp';
import { ICollection, IDBOptions, IDocument } from './interfaces';

import { promises } from 'fs';
import { dirname } from 'path';
import { EXT_DB, EXT_JSON, MESSAGES } from './global';

import { Compress } from './compress';

export const LOG = Debug('diskdb');
const compress = new Compress();

/**
 * @description check if file exists
 * @author Arvind Ravulavaru
 * @date 2020-09-22
 * @export
 * @param {string} file
 * @returns {Promise<boolean>}
 */
export async function exists(file: string): Promise<boolean> {
  try {
    await promises.access(file);
    return true;
  } catch (error) {
    LOG(MESSAGES.ERROR.GEN + error);
    return false;
  }
}
/**
 * @description writes contents to a file
 * @author Arvind Ravulavaru
 * @date 2020-09-22
 * @export
 * @param {string} file
 * @param {string} contents
 * @returns {Promise<boolean>}
 */
export async function write(
  file: string,
  contents: string,
  shouldCompress: boolean
): Promise<boolean> {
  try {
    // make sure the folder exists before creating the file
    const folder = dirname(file);
    // create missing dirs
    await mkdirp(folder);
    await promises.writeFile(
      file,
      shouldCompress ? (await compress.compress(contents)).toString() : contents
    );
    return true;
  } catch (error) {
    LOG(MESSAGES.ERROR.GEN + error);
    return false;
  }
}
/**
 * @description reads contents from a file
 * @author Arvind Ravulavaru
 * @date 2020-09-22
 * @export
 * @param {string} file
 * @returns {(Promise<ICollection['documents'] | null>)}
 */
export async function read(
  file: string,
  options: IDBOptions
): Promise<ICollection | null> {
  try {
    const contents = options.compress ? (await compress.decompress(await promises.readFile(file, 'utf-8'))).toString() : await promises.readFile(file, 'utf-8');
    return JSON.parse(contents);
  } catch (error) {
    if(error.name==MESSAGES.ERROR.SYN_ERR){
      console.log(MESSAGES.ERROR.PARSING_ERROR)
      process.exit(1);
    }
    return null;
  }
}
/**
 * @description removes a file
 * @author Arvind Ravulavaru
 * @date 2020-09-22
 * @export
 * @param {string} file
 * @returns {(Promise<boolean | null>)}
 */
export async function remove(file: string): Promise<boolean | null> {
  try {
    await promises.unlink(file);
    return true;
  } catch (error) {
    LOG(MESSAGES.ERROR.GEN + error);
    return null;
  }
}

/**
 * @description Generates document meta data
 * @author Arvind Ravulavaru
 * @date 2020-09-22
 * @export
 * @returns {IDocument['meta']}
 */
export function genMeta(): IDocument['meta'] {
  return {
    timestamp: +new Date(),
    version: 0,
  };
}
/**
 * @description Returns files in a directory
 * @author Arvind Ravulavaru
 * @date 2020-10-5
 * @export
 * @returns {Promise<String[]>}
 */
export async function readDirectory(path: string) {
  let files = await promises.readdir(path);
  let collectionNames:string[]=[];
  if(files.length > 0){
    for (let i in files){
      collectionNames.push(files[i].replace(EXT_DB||EXT_JSON,''));
    }
  }
 return collectionNames;
}