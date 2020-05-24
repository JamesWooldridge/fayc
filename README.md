## fayc

COVID-19 face touch prevention using tensorflow and [body-pix](https://github.com/tensorflow/tfjs-models/tree/master/body-pix) model.

![example](https://i.imgur.com/KymtrHC.png)

Just a fun little project to try out tensorflow for the first time! Uses your webcam to detect when you touch your face and notifies you via the classic MGS Alert! sound.

### Approach
#### Detection
Body part segmentation is done using the [body-pix](https://github.com/tensorflow/tfjs-models/tree/master/body-pix) tensorflow model. Using the webcam as an input stream, we continuously segment the image into body parts. We then separate  the face and hands into arrays of pixels. For each pixel that contains a hand, we also check if in the last frame, there was a face there. If there is, we increment a count. When the count reaches a threshold, we consider the face to be touched and alert the user.

Note that there is no depth detection, and we are just checking for overlapping segments. Therefore, holding your hand in front of your face (but not touching) will trigger an alert. No, it's not accurate, but if I could build a depth sensitive segmentation model, I probably wouldn't be a web developer...

#### Display
The face and hand segments are drawn to a canvas that is laid over the video.

### Running
Simply open `index.html` in your browser and enable webcam permissions. No need to install any dependencies - tensorflow and body-pix are pulled in via CDN.