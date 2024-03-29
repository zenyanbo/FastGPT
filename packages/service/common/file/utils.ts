import { isProduction } from '../system/constants';
import fs from 'fs';
import path from 'path';

export const removeFilesByPaths = (paths: string[]) => {
  paths.forEach((path) => {
    fs.unlink(path, (err) => {
      if (err) {
        // console.error(err);
      }
    });
  });
};

export const guessBase64ImageType = (str: string) => {
  const imageTypeMap: Record<string, string> = {
    '/': 'image/jpeg',
    i: 'image/png',
    R: 'image/gif',
    U: 'image/webp',
    Q: 'image/bmp'
  };

  const defaultType = 'image/jpeg';
  if (typeof str !== 'string' || str.length === 0) {
    return defaultType;
  }

  const firstChar = str.charAt(0);
  return imageTypeMap[firstChar] || defaultType;
};

export const clearDirFiles = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  fs.readdirSync(dirPath).forEach((file) => {
    const curPath = `${dirPath}/${file}`;
    if (fs.lstatSync(curPath).isDirectory()) {
      clearDirFiles(curPath);
    } else {
      fs.unlinkSync(curPath);
    }
  });
};

export const clearTmpUploadFiles = () => {
  if (!isProduction) return;
  const tmpPath = '/tmp';

  fs.readdir(tmpPath, (err, files) => {
    if (err) return;

    for (const file of files) {
      if (file === 'v8-compile-cache-0') continue;

      const filePath = path.join(tmpPath, file);

      fs.stat(filePath, (err, stats) => {
        if (err) return;

        // 如果文件是在1小时前上传的，则认为是临时文件并删除它
        if (Date.now() - stats.mtime.getTime() > 1 * 60 * 60 * 1000) {
          fs.unlink(filePath, (err) => {
            if (err) return;
            console.log(`Deleted temp file: ${filePath}`);
          });
        }
      });
    }
  });
};
