"use client";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useCallback, useEffect, useState } from "react";
import { debounce } from "./lib/utils";

type ApiResponse = {
  question: string;
  answer: string;
  score: number;
};

const handleSubmit: (s: string) => Promise<ApiResponse[] | undefined> = async (
  sentence: string
) => {
  try {
    const response = await fetch(
      "https://4m98xzm96k.execute-api.us-east-1.amazonaws.com/process-sentence",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add any additional headers as needed
        },
        body: JSON.stringify({ sentence }),
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = (await response.json()) as ApiResponse[];
    console.log("POST request successful:", data);
    return data;
    // Handle response data as needed
  } catch (error) {
    console.error("Error during POST request:", error);
    // Handle errors
  }
};

const Home = () => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  const [isClient, setIsClient] = useState(false);
  const [enable, setEnabled] = useState<boolean>(false);
  const [transcript2, setTranscript2] = useState<string>("");
  const [apiResponses, setApiResponses] = useState<ApiResponse[]>([]);

  const handleTranscript = useCallback(
    debounce(async (sentence: string) => {
      console.log("sentence", sentence);
      const res = await handleSubmit(sentence);
      if (res) {
        setApiResponses((r) => [...r, ...res]);
      }
      console.log("res", res);
      // handleSubmit(sentence)
    }, 2000),
    [setApiResponses]
  );

  useEffect(() => {
    handleTranscript(transcript2);
  }, [transcript2, handleTranscript]);
  
  useEffect(() => {
    const sliced = transcript?.slice(-200)
    console.log('microphone transcript sliced', sliced);
    handleTranscript(sliced);
  }, [transcript, handleTranscript]);

  useEffect(() => setIsClient(true), [])

  if (!isClient) return null

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <input
        type="text"
        value={transcript2}
        onChange={(event) => setTranscript2(event.target.value)}
        style={{ color: "black" }}
        placeholder="Enter text..."
      />
      <div className="flex flex-row justify-between w-full gap-2">
        <div className="flex-1 flex flex-col justify-center bg-gray-700">
          <div style={{ fontSize: 16, fontWeight: "bold" }}>
            API Responses section:
          </div>
          {apiResponses?.map((res, i) => (
            <div style={{ marginBottom: "8px" }} key={`${res.answer}-i`}>
              Response #{i}
              <div>
                Question: {res.question}
                <br />
                Answer: {res.answer}
                <br />
                Score: {res.score}
                <br />
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col bg-gray-700">
          {browserSupportsSpeechRecognition && (
            <div>
              <p>Microphone: {listening ? "on" : "off"}</p>
              <button
                onClick={() =>
                  SpeechRecognition.startListening({ continuous: true })
                }
              >
                Start
              </button>
              {/* <button onClick={() => SpeechRecognition.startListening()}>Start</button> */}
              <button onClick={() => SpeechRecognition.stopListening()}>
                Stop
              </button>
              <button onClick={resetTranscript}>Reset</button>
              <p>{transcript}</p>
            </div>
          )}
          {!browserSupportsSpeechRecognition && "Not Supported"}
        </div>
      </div>
    </main>
  );
};

export default Home;
