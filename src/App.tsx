/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Check, X, Loader2 } from 'lucide-react';

// NOTE: Since this app uses a server-side proxy for API keys (required for security),
// the GEMINI_API_KEY is handled automatically via the AI Studio Secrets panel.
const GEMINI_API_KEY = "PROVIDED_BY_AI_STUDIO";

export default function App() {
  const [screen, setScreen] = useState<'upload' | 'loading' | 'quiz' | 'results'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [quizData, setQuizData] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState('Reading your document');
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState('Medium');
  const [qCount, setQCount] = useState(5);

  // Loading messages rotation
  useEffect(() => {
    if (screen !== 'loading') return;
    const msgs = ['Reading your document', 'Identifying key concepts', 'Crafting questions', 'Almost ready'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % msgs.length;
      setLoadingMsg(msgs[i]);
    }, 1500);
    return () => clearInterval(interval);
  }, [screen]);

  const handleUpload = async (event: any) => {
    const uploadedFile = event.target.files?.[0] || event.dataTransfer?.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setError(null);
  };

  const generateQuiz = async () => {
    if (!file) return setError("Please upload a document first.");
    setScreen('loading');
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fileData: base64, 
            mimeType: file.type,
            difficulty,
            questionCount: qCount
          })
        });
        if (!res.ok) throw new Error("API call failed.");
        const data = await res.json();
        setQuizData(data);
        setScreen('quiz');
        setCurrentIdx(0);
        setScore(0);
      } catch (err) {
        setError("Failed to generate quiz. Please try again.");
        setScreen('upload');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {screen === 'upload' && (
        <div className="w-full max-w-2xl bg-card p-8 rounded-2xl shadow-xl transition-all duration-500 ease-out">
          <h1 className="text-4xl font-sans font-bold text-center mb-2">Quizzr</h1>
          <p className="text-text-sec text-center mb-8">Drop a document. Get tested instantly.</p>
          
          <div 
            className="border-2 border-dashed border-electric/50 rounded-xl p-8 text-center hover:border-electric transition-colors cursor-pointer mb-6"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-electric'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('border-electric'); }}
            onDrop={(e) => { e.preventDefault(); handleUpload(e); }}
          >
            <Upload className="mx-auto mb-4 text-electric" size={48} />
            <input type="file" onChange={handleUpload} className="hidden" id="file" />
            <label htmlFor="file" className="cursor-pointer">
              {file ? <p className="text-text-main">{file.name}</p> : <p className="text-text-sec">Click or drag image/PDF</p>}
            </label>
          </div>

          <div className="flex gap-4 mb-6">
            {['Easy', 'Medium', 'Hard'].map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-2 rounded-full ${difficulty === d ? 'bg-electric' : 'bg-navy'} transition-all`}>{d}</button>
            ))}
          </div>

          <div className="flex gap-4 mb-6">
            {[3, 5, 10].map(c => (
              <button key={c} onClick={() => setQCount(c)} className={`flex-1 py-2 rounded-full ${qCount === c ? 'bg-electric' : 'bg-navy'} transition-all`}>{c}</button>
            ))}
          </div>

          <button onClick={generateQuiz} className="w-full py-4 bg-electric rounded-xl font-bold hover:bg-blue-600 transition-transform hover:scale-[1.02]">Generate Quiz</button>
        </div>
      )}

      {screen === 'loading' && (
        <div className="text-center">
          <Loader2 className="animate-spin text-electric mx-auto mb-6" size={64} />
          <p className="text-2xl font-semibold transition-opacity duration-300">{loadingMsg}</p>
        </div>
      )}

      {screen === 'quiz' && quizData[currentIdx] && (
        <div className="w-full max-w-2xl bg-card p-8 rounded-2xl shadow-xl">
          <div className="h-2 bg-navy rounded-full mb-6 relative">
            <div className="h-full bg-electric rounded-full transition-all duration-300" style={{ width: `${(currentIdx / quizData.length) * 100}%` }}></div>
          </div>
          <p className="text-text-sec mb-2">Question {currentIdx + 1} of {quizData.length}</p>
          <h2 className="text-2xl font-medium mb-8">{quizData[currentIdx].question}</h2>
          <div className="grid gap-4">
            {quizData[currentIdx].options.map((opt: string, i: number) => (
              <button key={i} className="p-4 bg-navy rounded-xl text-left hover:scale-[1.01] transition-transform">{String.fromCharCode(65+i)}. {opt}</button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-error p-4 rounded-lg flex justify-between">
          <p>{error}</p>
          <button onClick={() => setError(null)}><X /></button>
        </div>
      )}
    </div>
  );
}

