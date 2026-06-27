const preview = document.querySelector("#cameraPreview");
const captureCanvas = document.querySelector("#captureCanvas");
const emptyState = document.querySelector("#emptyState");
const photoPreview = document.querySelector("#photoPreview");
const capturedImage = document.querySelector("#capturedImage");
const statusText = document.querySelector("#statusText");
const startButton = document.querySelector("#startButton");
const captureButton = document.querySelector("#captureButton");
const saveButton = document.querySelector("#saveButton");
const stopButton = document.querySelector("#stopButton");

let stream = null;
let capturedBlob = null;
let capturedObjectUrl = null;

const messages = {
  idle: "\u5f85\u6a5f\u4e2d",
  stopped: "\u505c\u6b62\u4e2d",
  captured: "\u64ae\u5f71\u6e08\u307f",
  unsupported: "\u3053\u306e\u30d6\u30e9\u30a6\u30b6\u306f\u30ab\u30e1\u30e9\u8868\u793a\u306b\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u305b\u3093\u3002",
  waiting: "\u30ab\u30e1\u30e9\u306e\u8a31\u53ef\u3092\u5f85\u3063\u3066\u3044\u307e\u3059...",
  running: "\u30ab\u30e1\u30e9\u8868\u793a\u4e2d",
  denied: "\u30ab\u30e1\u30e9\u5229\u7528\u304c\u8a31\u53ef\u3055\u308c\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u30d6\u30e9\u30a6\u30b6\u306e\u6a29\u9650\u8a2d\u5b9a\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
  notFound: "\u5229\u7528\u3067\u304d\u308b\u30ab\u30e1\u30e9\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3067\u3057\u305f\u3002",
  startFailed: "\u30ab\u30e1\u30e9\u3092\u958b\u59cb\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002HTTPS\u306eURL\u3067\u958b\u3044\u3066\u3044\u308b\u304b\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
  notReady: "\u307e\u3060\u64ae\u5f71\u3067\u304d\u307e\u305b\u3093\u3002\u30ab\u30e1\u30e9\u6620\u50cf\u304c\u8868\u793a\u3055\u308c\u3066\u304b\u3089\u8a66\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
  blobFailed: "\u64ae\u5f71\u753b\u50cf\u3092\u4f5c\u6210\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002",
  captureDone: "\u64ae\u5f71\u3057\u307e\u3057\u305f\u3002\u30b9\u30de\u30db\u306b\u4fdd\u5b58\u3067\u304d\u307e\u3059\u3002",
  shareStarted: "\u4fdd\u5b58/\u5171\u6709\u3092\u958b\u59cb\u3057\u307e\u3057\u305f\u3002",
  shareCanceled: "\u4fdd\u5b58/\u5171\u6709\u3092\u30ad\u30e3\u30f3\u30bb\u30eb\u3057\u307e\u3057\u305f\u3002",
  downloaded: "\u753b\u50cf\u3092\u30c0\u30a6\u30f3\u30ed\u30fc\u30c9\u3057\u307e\u3057\u305f\u3002",
};

const setStatus = (message) => {
  statusText.textContent = message;
};

const stopCamera = () => {
  if (!stream) return;

  stream.getTracks().forEach((track) => track.stop());
  stream = null;
  preview.srcObject = null;
  emptyState.classList.remove("hidden");
  startButton.disabled = false;
  captureButton.disabled = true;
  stopButton.disabled = true;
  setStatus(capturedBlob ? messages.captured : messages.stopped);
};

const startCamera = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus(messages.unsupported);
    return;
  }

  try {
    setStatus(messages.waiting);
    startButton.disabled = true;

    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    preview.srcObject = stream;
    emptyState.classList.add("hidden");
    captureButton.disabled = false;
    stopButton.disabled = false;
    setStatus(messages.running);
  } catch (error) {
    startButton.disabled = false;
    captureButton.disabled = true;
    stopButton.disabled = true;

    if (error.name === "NotAllowedError") {
      setStatus(messages.denied);
      return;
    }

    if (error.name === "NotFoundError") {
      setStatus(messages.notFound);
      return;
    }

    setStatus(messages.startFailed);
    console.error(error);
  }
};

const capturePhoto = () => {
  if (!stream || !preview.videoWidth || !preview.videoHeight) {
    setStatus(messages.notReady);
    return;
  }

  captureCanvas.width = preview.videoWidth;
  captureCanvas.height = preview.videoHeight;
  captureCanvas.getContext("2d").drawImage(preview, 0, 0);

  captureCanvas.toBlob((blob) => {
    if (!blob) {
      setStatus(messages.blobFailed);
      return;
    }

    if (capturedObjectUrl) URL.revokeObjectURL(capturedObjectUrl);

    capturedBlob = blob;
    capturedObjectUrl = URL.createObjectURL(blob);
    capturedImage.src = capturedObjectUrl;
    photoPreview.hidden = false;
    saveButton.disabled = false;
    setStatus(messages.captureDone);
  }, "image/jpeg", 0.92);
};

const savePhoto = async () => {
  if (!capturedBlob) return;

  const fileName = `camera-photo-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`;
  const file = new File([capturedBlob], fileName, { type: "image/jpeg" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "\u64ae\u5f71\u3057\u305f\u5199\u771f",
        text: "Camera PWA Test",
      });
      setStatus(messages.shareStarted);
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        setStatus(messages.shareCanceled);
        return;
      }
      console.warn("Share failed, falling back to download:", error);
    }
  }

  const link = document.createElement("a");
  link.href = capturedObjectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setStatus(messages.downloaded);
};

startButton.addEventListener("click", startCamera);
captureButton.addEventListener("click", capturePhoto);
saveButton.addEventListener("click", savePhoto);
stopButton.addEventListener("click", stopCamera);
window.addEventListener("pagehide", stopCamera);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}
