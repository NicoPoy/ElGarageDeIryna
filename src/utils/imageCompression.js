const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const WEBP_QUALITY = 0.78;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen.'));
    };
    image.src = objectUrl;
  });

const canvasToBlob = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error('No se pudo comprimir la imagen.'));
      },
      'image/webp',
      WEBP_QUALITY
    );
  });

const getResizedDimensions = ({ height, width }) => {
  const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);

  return {
    height: Math.round(height * ratio),
    width: Math.round(width * ratio)
  };
};

const toWebpFileName = (fileName) =>
  `${fileName.replace(/\.[^/.]+$/, '') || 'producto'}.webp`;

export const compressImageToWebp = async (file) => {
  const image = await loadImage(file);
  const { height, width } = getResizedDimensions(image);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas);

  return new File([blob], toWebpFileName(file.name), {
    lastModified: Date.now(),
    type: 'image/webp'
  });
};
