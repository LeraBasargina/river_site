export const segmentationVideo = {
  src: "/media/survey-segmentation.mp4",
  poster: "/media/survey-video-poster.jpg",
};

export function stamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return [minutes, remainder].map((value) => String(value).padStart(2, "0")).join(":");
}
