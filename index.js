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

// flags
let finalTranscript = "";
let isListening = false;
let shouldListen = false;
let userStopped = true;
let lastFinalChunk = "";
let shouldCapitalizeNext = true;
let finalTime = 0;
const PAUSE = 1000;

// events
recognition.onstart = () => {
  isListening = true;
  mic.classList.add("listening");
  button.style.backgroundColor = "#6c7df0";
  button.textContent = "Ти багато говориш, перестань";
};

recognition.onend = () => {
  isListening = false;

  if (userStopped) {
    mic.classList.remove("listening");
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

    if (result.isFinal) {
      if (now - finalTime > PAUSE && finalTranscript) {
        finalTranscript = finalTranscript.trim() + ". ";
        shouldCapitalizeNext = true;
      }
      if (script !== lastFinalChunk) {
        finalTranscript += formatSentence(script) + " ";
        lastFinalChunk = script;
        finalTime = now;
      }
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

  if (shouldCapitalizeNext) {
    formatted = formatted[0].toUpperCase() + formatted.slice(1);
    shouldCapitalizeNext = false;
  }
  return formatted;
};

// listeners
button.addEventListener("click", () => {
  if (shouldListen) {
    shouldListen = false;
    userStopped = true;
    recognition.stop();
    shouldCapitalizeNext = true;
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
  finalTime = 0;
  shouldCapitalizeNext = true;
});
