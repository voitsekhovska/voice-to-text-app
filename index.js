const button = document.querySelector(".btn");
const copyBtn = document.querySelector(".copy-btn");
const clearBtn = document.querySelector(".clear-btn");
const output = document.getElementById("output");
const mic = document.getElementById("mic");

// speech recognition API
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true;
recognition.lang = "uk-UA";
recognition.interimResults = true;

let finalTranscript = "";
let isListening = false;

// events
recognition.onstart = () => {
  isListening = true;
  mic.classList.add("listening");
  button.style.backgroundColor = "#6c7df0";
  button.textContent = "Ти багато говориш, перестань";
};

recognition.onend = () => {
  isListening = false;
  mic.classList.remove("listening");
  button.style.backgroundColor = "#8e9fe6";
  button.textContent = "Ок, продовжуй балакати";
};

recognition.onresult = (event) => {
  let interimTranscript = "";

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const script = event.results[i][0].transcript;

    if (event.results[i].isFinal) {
      finalTranscript += script + " ";
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

// listeners
button.addEventListener("click", () => {
  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

copyBtn.addEventListener("click", copyMessage);

clearBtn.addEventListener("click", () => {
  finalTranscript = "";
  output.textContent = "";
});
