const video = document.querySelector('video');
const canvas = document.querySelector('canvas');

const alertSound = new Audio('./alert.mp3');
const bg = document.body;

init();

async function init() {
  try {
    console.log('init');

    // Get user media (webcam) and sets it as the source for the video element
    console.log('getting webcam for video source');
    const stream = await navigator.mediaDevices.getUserMedia({video: {width: 640, height: 480}});
    video.srcObject = stream;
    console.log('--> success');

    // Wait for video to start playing
    console.log('waiting for video source to start playing');
    await (async () => new Promise((resolve, reject) => video.onplaying = resolve))();
    console.log('--> success');

    // Set up canvas for drawing detected points
    const { videoWidth, videoHeight } = video;
    video.width = videoWidth;
    video.height = videoHeight;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Load bodypix
    console.log('loading bodypix');
    const net = await bodyPix.load({multiplier: 0.75, stride: 16, quantBytes: 4});
    console.log('--> success');

    running = true;
    runDetection(net);
  } catch (err) {
    console.error(err);
  }
};

async function runDetection(net) {
  console.log('begin detection...');
  let lastFaceArray = new Int32Array(video.width * video.height);

  const netConfig = {
    flipHorizontal: true,
    maxDetections: 1,
    scoreThreshold: 0.5,
    segmentationThreshold: 0.6,
  };

  while (true) {
    const seg = await net.segmentPersonParts(video, netConfig);

    // Check if any segmentations are actually found
    if (!seg.allPoses[0]) {
      console.info("No segmentation data");
      continue;
    }

    // Draw the segment to canvas
    drawSegmentMask(seg);

    // Do the actual detection
    const person = seg.allPoses[0];
    let nose = person.keypoints[0].score > 0.9;
    let leftEye = person.keypoints[1].score > 0.9;
    let rightEye = person.keypoints[2].score > 0.9;

    if (nose && (leftEye || rightEye)) {
      let faceArray = [];
      let overlap = 0;
      seg.data.forEach((v, i) => {
        // Fill in face array
        faceArray[i] = [0, 1].includes(v) ? v : -1;

        // Check if pixel contains a hand
        if ([10, 11].includes(v)) {
          // Compare to last frame - was there a face at that same pixel?
          if (lastFaceArray[i] !== -1) {
            overlap++;
          }
        }
      });

      if (overlap > 25) {
        detectedFaceTouch();
      }

      lastFaceArray = faceArray;
    }
  }

  console.log('stop detection...');

  console.log('clearing canvas');
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function drawSegmentMask(seg) {
  let target = seg;

  // Filter data to just left face, right face, left hand, right hand
  target.data = seg.data.map(v => {
    return [0, 1, 10, 11].includes(v) ? v : -1;
  });

  const cMask = bodyPix.toColoredPartMask(target);
  bodyPix.drawMask(canvas, video, cMask, 0.7, 0, true);
}

function detectedFaceTouch() {
  alertSound.play();

  bg.style.backgroundColor = 'red';
  setTimeout(() => { bg.style.backgroundColor = ''; }, 500);
}

