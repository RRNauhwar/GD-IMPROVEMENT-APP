import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in the standard DOM lib).
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognition {
  supported: boolean;
  listening: boolean;
  finalTranscript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setManualTranscript: (t: string) => void;
}

export function useSpeechRecognition(lang = "en-US"): UseSpeechRecognition {
  const ctorRef = useRef<SpeechRecognitionCtor | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldListenRef = useRef(false);

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctor = getRecognitionCtor();
    ctorRef.current = ctor;
    setSupported(!!ctor);
  }, []);

  const start = useCallback(() => {
    const ctor = ctorRef.current;
    if (!ctor) {
      setError("Speech recognition is not supported in this browser. Use Chrome or Edge, or type your transcript.");
      return;
    }
    setError(null);
    const rec = new ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = "";
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript;
        if (r.isFinal) finalChunk += text + " ";
        else interim += text;
      }
      if (finalChunk) setFinalTranscript((prev) => (prev + finalChunk).replace(/\s+/g, " "));
      setInterimTranscript(interim);
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setError(`Microphone error: ${e.error}. You can also type your transcript.`);
    };
    rec.onend = () => {
      // Chrome stops periodically; restart if we still want to listen.
      if (shouldListenRef.current) {
        try {
          rec.start();
        } catch {
          /* ignore */
        }
      } else {
        setListening(false);
      }
    };

    recRef.current = rec;
    shouldListenRef.current = true;
    try {
      rec.start();
      setListening(true);
    } catch {
      /* start() throws if already started */
    }
  }, [lang]);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    setInterimTranscript("");
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  const setManualTranscript = useCallback((t: string) => {
    setFinalTranscript(t);
  }, []);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return {
    supported,
    listening,
    finalTranscript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
    setManualTranscript,
  };
}
