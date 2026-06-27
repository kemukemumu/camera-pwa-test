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
  setStatus(capturedBlob ? "謦ｮ蠖ｱ貂医∩" : "蛛懈ｭ｢荳ｭ");
};

const startCamera = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("縺薙・繝悶Λ繧ｦ繧ｶ縺ｯ繧ｫ繝｡繝ｩ陦ｨ遉ｺ縺ｫ蟇ｾ蠢懊＠縺ｦ縺・∪縺帙ｓ縲・);
    return;
  }

  try {
    setStatus("繧ｫ繝｡繝ｩ縺ｮ險ｱ蜿ｯ繧貞ｾ・▲縺ｦ縺・∪縺・..");
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
    setStatus("繧ｫ繝｡繝ｩ陦ｨ遉ｺ荳ｭ");
  } catch (error) {
    startButton.disabled = false;
    captureButton.disabled = true;
    stopButton.disabled = true;

    if (error.name === "NotAllowedError") {
      setStatus("繧ｫ繝｡繝ｩ蛻ｩ逕ｨ縺瑚ｨｱ蜿ｯ縺輔ｌ縺ｾ縺帙ｓ縺ｧ縺励◆縲ゅヶ繝ｩ繧ｦ繧ｶ縺ｮ讓ｩ髯占ｨｭ螳壹ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
      return;
    }

    if (error.name === "NotFoundError") {
      setStatus("蛻ｩ逕ｨ縺ｧ縺阪ｋ繧ｫ繝｡繝ｩ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲・);
      return;
    }

    setStatus("繧ｫ繝｡繝ｩ繧帝幕蟋九〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・TTPS縺ｮURL縺ｧ髢九＞縺ｦ縺・ｋ縺狗｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
    console.error(error);
  }
};

const capturePhoto = () => {
  if (!stream || !preview.videoWidth || !preview.videoHeight) {
    setStatus("縺ｾ縺謦ｮ蠖ｱ縺ｧ縺阪∪縺帙ｓ縲ゅき繝｡繝ｩ譏蜒上′陦ｨ遉ｺ縺輔ｌ縺ｦ縺九ｉ隧ｦ縺励※縺上□縺輔＞縲・);
    return;
  }

  captureCanvas.width = preview.videoWidth;
  captureCanvas.height = preview.videoHeight;
  captureCanvas.getContext("2d").drawImage(preview, 0, 0);

  captureCanvas.toBlob((blob) => {
    if (!blob) {
      setStatus("謦ｮ蠖ｱ逕ｻ蜒上ｒ菴懈・縺ｧ縺阪∪縺帙ｓ縺ｧ縺励◆縲・);
      return;
    }

    if (capturedObjectUrl) URL.revokeObjectURL(capturedObjectUrl);

    capturedBlob = blob;
    capturedObjectUrl = URL.createObjectURL(blob);
    capturedImage.src = capturedObjectUrl;
    photoPreview.hidden = false;
    saveButton.disabled = false;
    setStatus("謦ｮ蠖ｱ縺励∪縺励◆縲ゅせ繝槭・縺ｫ菫晏ｭ倥〒縺阪∪縺吶・);
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
        title: "謦ｮ蠖ｱ縺励◆蜀咏悄",
        text: "Camera PWA Test縺ｧ謦ｮ蠖ｱ縺励◆蜀咏悄縺ｧ縺吶・,
      });
      setStatus("菫晏ｭ・蜈ｱ譛峨ｒ髢句ｧ九＠縺ｾ縺励◆縲・);
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        setStatus("菫晏ｭ・蜈ｱ譛峨ｒ繧ｭ繝｣繝ｳ繧ｻ繝ｫ縺励∪縺励◆縲・);
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
  setStatus("逕ｻ蜒上ｒ繝繧ｦ繝ｳ繝ｭ繝ｼ繝峨＠縺ｾ縺励◆縲・);
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
