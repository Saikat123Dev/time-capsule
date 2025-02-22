import { Send, StopCircle, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function TextToSpeech() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [transcription, setTranscription] = useState(null);
  const [error, setError] = useState(null);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        const defaultVoice = availableVoices.find((voice) => voice.lang === 'en-US') || availableVoices[0];
        setSelectedVoice(defaultVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Audio chunk recorded, size:', event.data.size);
        } else {
          console.log('Empty audio chunk received');
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        console.log('Recording stopped. Audio Blob size:', audioBlob.size);
        if (audioBlob.size > 0) {
          setRecordedAudio(audioBlob);
          // Optional: Play the audio to verify it recorded correctly
          const url = URL.createObjectURL(audioBlob);
          const audio = new Audio(url);
          audio.play();
          console.log('Audio playback triggered for verification. URL:', url);
        } else {
          setError(
            'Recorded audio is empty. Ensure your microphone can hear the speakers or enable "Stereo Mix" in your sound settings.'
          );
        }
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      };

      console.log('Starting recording...');
      mediaRecorderRef.current.start();
    } catch (err) {
      setError(
        'Failed to start recording: ' +
          err.message +
          '. Please allow microphone access and ensure an audio input device is available.'
      );
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Stopping recording...');
      mediaRecorderRef.current.stop();
      // Stop the tracks to release the media stream
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const sendAudioToAPI = async () => {
    if (!recordedAudio) {
      setError('No recorded audio available');
      return;
    }

    console.log('Preparing to send audio. Blob size:', recordedAudio.size, 'Blob type:', recordedAudio.type);
    if (recordedAudio.size === 0) {
      setError('Recorded audio is empty. Ensure the recording captured sound.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audioFile', recordedAudio, 'speech.webm');

      // Log FormData contents (for debugging, note: FormData logging is limited)
      for (let [key, value] of formData.entries()) {
        console.log(`FormData entry: ${key}`, value);
      }

      console.log('Sending audio to API...');
      const response = await fetch('http://localhost:3000/api/captions/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setTranscription(data);
      setRecordedAudio(null);
    } catch (err) {
      setError('Failed to process audio: ' + err.message);
      console.error('API error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeak = async () => {
    if (!text.trim()) return;

    setRecordedAudio(null);
    setTranscription(null);
    setError(null);

    // Start recording first
    await startRecording();

    // Then speak the text
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      console.log('Speech synthesis started');
      setIsPlaying(true);
    };
    utterance.onend = () => {
      console.log('Speech synthesis ended');
      setIsPlaying(false);
      stopRecording(); // Stop recording when speech ends
    };
    utterance.onerror = (event) => {
      setError('Speech synthesis error: ' + event.error);
      console.error('Speech error:', event);
      setIsPlaying(false);
      stopRecording();
    };

    console.log('Speaking text:', text);
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    stopRecording();
    setIsPlaying(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-4">
        <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Voice
        </label>
        <select
          id="voice-select"
          className="w-full p-2 border border-gray-300 rounded-md"
          value={voices.findIndex((voice) => voice === selectedVoice)}
          onChange={(e) => setSelectedVoice(voices[e.target.value])}
          disabled={voices.length === 0}
        >
          {voices.length === 0 ? (
            <option value="">Loading voices...</option>
          ) : (
            voices.map((voice, index) => (
              <option key={index} value={index}>
                {voice.name} ({voice.lang})
              </option>
            ))
          )}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
          Enter Text to Convert
        </label>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          rows="4"
          placeholder="Type your text here..."
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSpeak}
          disabled={!text.trim() || isPlaying || isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Volume2 className="w-4 h-4" />
          Speak
        </button>

        <button
          onClick={handleStop}
          disabled={!isPlaying}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
        >
          <StopCircle className="w-4 h-4" />
          Stop
        </button>

        <button
          onClick={sendAudioToAPI}
          disabled={!recordedAudio || isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          <Send className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Generate Captions'}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      {voices.length === 0 && (
        <p className="text-red-500 text-sm mt-4">
          No voices available. Please check your browser's speech synthesis support or system settings.
        </p>
      )}

      {recordedAudio && (
        <p className="text-green-600 text-sm mt-4">
          Audio recorded successfully (Size: {recordedAudio.size} bytes). Click "Generate Captions" to process.
        </p>
      )}

      {transcription && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generated Captions</h3>
          <pre className="whitespace-pre-wrap text-sm text-gray-700">
            {JSON.stringify(transcription, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
