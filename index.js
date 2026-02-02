const button = document.querySelector(".btn");
const copyBtn = document.querySelector(".copy-btn");
const clearBtn = document.querySelector(".clear-btn");
const output = document.getElementById("output");
const mic = document.getElementById("mic");

// speech recognition API
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

recognition.continuous = !isMobile;
recognition.lang = "uk-UA";
recognition.interimResults = true;

// state flags
let finalTranscript = "";
let shouldListen = false;
let userStopped = true;
let lastFinalChunk = "";
let sentenceEnded = true;

// silence detection
const SILENCE_THRESHOLD = 0.02; //means if volume stays below 0.02
const SILENCE_TIME = 800; //800ms - end of a sentence
let silenceStart = null;

// flags for web audio API
let audioContext;
let analyzer;
let micSource;
let audioStream;
let dataArray;

// events
recognition.onstart = () => {
  button.style.backgroundColor = "#6c7df0";
  button.textContent = "Ти багато говориш, перестань";

  if (!isMobile) {
    startAudioLevel();
  }
};

recognition.onend = () => {
  if (userStopped) {
    if (!isMobile) {
      stopAudioLevel();
    }
    button.style.backgroundColor = "#8e9fe6";
    button.textContent = "Ок, продовжуй балакати";
    return;
  }

  // for mobile devices
  if (shouldListen && isMobile) {
    recognition.start();
  }
};

recognition.onresult = (event) => {
  let interimTranscript = "";

  const now = Date.now();

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    const script = result[0].transcript.trim();

    if (result.isFinal && script !== lastFinalChunk) {
      if (sentenceEnded && finalTranscript) {
        finalTranscript = finalTranscript.trim() + ". ";
      }
      finalTranscript += formatSentence(script) + " ";
      lastFinalChunk = script;
      sentenceEnded = false;
    } else {
      interimTranscript += script;
    }
  }
  output.textContent = finalTranscript + interimTranscript;
  output.scrollTop = output.scrollHeight;
};

recognition.onerror = (event) => {
  output.textContent = "Error: " + event.error;
};

// web audio API (for mic sensitivity)
const startAudioLevel = async () => {
  audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  audioContext = new AudioContext();
  analyzer = audioContext.createAnalyser();
  analyzer.fftSize = 512;

  micSource = audioContext.createMediaStreamSource(audioStream);
  micSource.connect(analyzer);

  dataArray = new Uint8Array(analyzer.frequencyBinCount);

  monitorVolume();
};

let volume = 0;

const monitorVolume = () => {
  if (!analyzer) return;

  analyzer.getByteTimeDomainData(dataArray);

  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const value = (dataArray[i] - 128) / 128;
    sum += value * value;
  }

  volume = Math.sqrt(sum / dataArray.length);

  // silence detection
  if (volume < SILENCE_THRESHOLD) {
    if (!silenceStart) silenceStart = Date.now();

    if (Date.now() - silenceStart > SILENCE_TIME) {
      sentenceEnded = true;
    }
  } else {
    silenceStart = null;
  }

  updateMicUI(volume);

  requestAnimationFrame(monitorVolume);
};

let smoothVolume = 0;

const updateMicUI = (volume) => {
  smoothVolume += (volume - smoothVolume) * 0.2;

  mic.style.transform = `scale(${1 + smoothVolume * 2})`;
};

const stopAudioLevel = () => {
  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop());
    audioStream = null;
  }

  if (audioContext) {
    micSource.disconnect();
    micSource = null;
  }

  analyzer = null;
};

//additional functions
const copyMessage = async () => {
  try {
    if (output.textContent) {
      await navigator.clipboard.writeText(output.textContent);

      const existingAlert = document.querySelector(".alert");
      if (existingAlert) return;

      const alertMessage = document.createElement("p");
      alertMessage.textContent = "Скопійовано";
      alertMessage.classList.add("alert");

      document.body.appendChild(alertMessage);

      setTimeout(() => {
        alertMessage.remove();
      }, 2000);
    }
  } catch (err) {
    console.log("Не вдалося скопіювати", err.message);
  }
};

const formatSentence = (text) => {
  let formatted = text.trim();

  if (!formatted) return "";

  if (sentenceEnded) {
    formatted = formatted[0].toUpperCase() + formatted.slice(1);
    sentenceEnded = false;
  }
  return formatted;
};

// listeners
button.addEventListener("click", () => {
  if (shouldListen) {
    shouldListen = false;
    userStopped = true;
    recognition.stop();
    sentenceEnded = true;
  } else {
    shouldListen = true;
    userStopped = false;
    recognition.start();
  }
});

copyBtn.addEventListener("click", copyMessage);

clearBtn.addEventListener("click", () => {
  finalTranscript = "";
  lastFinalChunk = "";
  output.textContent = "";
  sentenceEnded = true;
});
