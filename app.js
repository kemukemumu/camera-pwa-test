const preview = document.querySelector("#cameraPreview");
const emptyState = document.querySelector("#emptyState");
const statusText = document.querySelector("#statusText");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");

let stream = null;

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
  stopButton.disabled = true;
  setStatus("停止中");
};

const startCamera = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("このブラウザはカメラ表示に対応していません。");
    return;
  }

  try {
    setStatus("カメラの許可を待っています...");
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
    stopButton.disabled = false;
    setStatus("カメラ表示中");
  } catch (error) {
    startButton.disabled = false;
    stopButton.disabled = true;

    if (error.name === "NotAllowedError") {
      setStatus("カメラ利用が許可されませんでした。ブラウザの権限設定を確認してください。");
      return;
    }

    if (error.name === "NotFoundError") {
      setStatus("利用できるカメラが見つかりませんでした。");
      return;
    }

    setStatus("カメラを開始できませんでした。HTTPSのURLで開いているか確認してください。");
    console.error(error);
  }
};

startButton.addEventListener("click", startCamera);
stopButton.addEventListener("click", stopCamera);
window.addEventListener("pagehide", stopCamera);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}
