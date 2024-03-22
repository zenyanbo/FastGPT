import fs from 'fs';

export const removeFilesByPaths = (paths: string[]) => {
  paths.forEach((path) => {
    fs.unlink(path, (err) => {
      if (err) {
        // console.error(err);
      }
    });
  });
};

const imageTypeMap: Record<string, string> = {
  '/': 'image/jpeg',
  i: 'image/png',
  R: 'image/gif',
  U: 'image/webp',
  Q: 'image/bmp'
};

export const guessImageTypeFromBase64 = (str: string) => {
  const defaultType = 'image/jpeg';
  if (typeof str !== 'string' || str.length === 0) {
    return defaultType;
  }

  const firstChar = str.charAt(0);
  return imageTypeMap[firstChar] || defaultType;
};
