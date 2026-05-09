/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  BookOpen, 
  Trophy, 
  Settings, 
  History,
  Moon, 
  Sun,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Timer,
  ChevronRight,
  ChevronLeft,
  RefreshCcw,
  BrainCircuit
} from 'lucide-react';
import { Question, QuizConfig, QuizResult, Difficulty } from './types';
import { generateQuizQuestions } from './services/geminiService';

const TOPICS = {
  'DBMS': ['Normalization', 'SQL', 'Transactions', 'Indexing', 'ER Model'],
  'Operating Systems': ['Deadlock', 'CPU Scheduling', 'Paging', 'Memory Management', 'File Systems'],
  'Computer Networks': ['TCP/IP', 'Routing', 'Flow Control', 'DNS', 'HTTP/SSL'],
  'Data Structures': ['Trees', 'Graphs', 'Hashing', 'Stacks/Queues', 'LinkedLists'],
  'Algorithms': ['Sorting', 'Dynamic Programming', 'Greedy', 'Graph Algorithms', 'NP-Completeness'],
  'Compiler Design': ['Parsers', 'Lexical Analysis', 'Intermediate Code', 'Optimization'],
  'Machine Learning': ['Linear Regression', 'Neural Networks', 'Decision Trees', 'Clustering'],
  'Aptitude': ['Quantitative', 'Verbal', 'Logical Reasoning', 'Probability']
};

type View = 'Welcome' | 'Setup' | 'Quiz' | 'Result' | 'History';

export default function App() {
  const [view, setView] = useState<View>('Welcome');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [config, setConfig] = useState<QuizConfig>({
    topic: 'DBMS',
    subtopic: 'Normalization',
    difficulty: 'Medium',
    questionCount: 5
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [history, setHistory] = useState<QuizResult[]>([]);

  // Theme logic
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('gate_quiz_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const startQuiz = async () => {
    setIsLoading(true);
    try {
      const qs = await generateQuizQuestions(config);
      setQuestions(qs);
      setUserAnswers(new Array(qs.length).fill(null));
      setCurrentIdx(0);
      setTimeRemaining(qs.length * 60); // 60s per question
      setView('Quiz');
    } catch (err) {
      alert(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const finishQuiz = () => {
    const total = questions.length;
    let correct = 0;
    let wrong = 0;
    
    const answers = questions.map((q, idx) => {
      const userAns = userAnswers[idx];
      const isCorrect = userAns === q.answer;
      if (userAns !== null) {
        if (isCorrect) correct++;
        else wrong++;
      }
      return { question: q, userAnswer: userAns, isCorrect };
    });

    const score = (correct * 1) + (wrong * -0.33);
    const quizResult: QuizResult = {
      score: parseFloat(score.toFixed(2)),
      correct,
      wrong,
      total,
      accuracy: Math.round((correct / total) * 100),
      timeTaken: (total * 60) - timeRemaining,
      answers,
      timestamp: Date.now()
    };

    setResult(quizResult);
    const newHistory = [quizResult, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('gate_quiz_history', JSON.stringify(newHistory));
    setView('Result');
  };

  return (
    <div className="min-h-screen transition-colors duration-500">
      <nav className="fixed top-0 w-full z-50 p-4 flex justify-between items-center glass-card border-none rounded-none bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400">
          <div className="p-2 bg-indigo-600 text-white rounded-lg">
            <BrainCircuit size={24} />
          </div>
          <span className="hidden sm:inline">GATE AI Quiz Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setView('History')}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <History size={20} />
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'Welcome' && <WelcomeView setView={setView} />}
          {view === 'Setup' && (
            <SetupView 
              config={config} 
              setConfig={setConfig} 
              onStart={startQuiz} 
              isLoading={isLoading} 
            />
          )}
          {view === 'Quiz' && (
            <QuizRunner 
              questions={questions}
              currentIdx={currentIdx}
              setCurrentIdx={setCurrentIdx}
              userAnswers={userAnswers}
              setUserAnswers={setUserAnswers}
              timeRemaining={timeRemaining}
              setTimeRemaining={setTimeRemaining}
              onFinish={finishQuiz}
            />
          )}
          {view === 'Result' && result && (
            <ResultView result={result} onRetry={() => setView('Setup')} />
          )}
          {view === 'History' && (
            <HistoryView history={history} onClose={() => setView('Welcome')} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-View Components ---

function WelcomeView({ setView }: { setView: (v: View) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center space-y-8 py-12"
    >
      <div className="inline-block p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl mb-4 shrink-0">
        <GraduationCap size={64} />
      </div>
      <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
        Master the <span className="text-indigo-600">GATE</span> with AI
      </h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
        Generate dynamic, syllabus-accurate Computer Science questions powered by Gemini AI. Real-time marking, detailed explanations, and performance tracking.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
        <button 
          onClick={() => setView('Setup')}
          className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 hover:scale-[1.02] transition-all flex items-center gap-2 group"
        >
          Get Started <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
        <button 
          onClick={() => setView('History')}
          className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          View Past Tests
        </button>
      </div>
    </motion.div>
  );
}

function SetupView({ config, setConfig, onStart, isLoading }: { 
  config: QuizConfig, 
  setConfig: (c: QuizConfig) => void, 
  onStart: () => void,
  isLoading: boolean
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="glass-card p-6 sm:p-10 rounded-3xl space-y-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
          <Settings size={24} />
        </div>
        <h2 className="text-2xl font-bold">Quiz Configuration</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold opacity-70">Main Topic</label>
          <select 
            value={config.topic}
            onChange={(e) => setConfig({ ...config, topic: e.target.value, subtopic: TOPICS[e.target.value as keyof typeof TOPICS][0] })}
            className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            {Object.keys(TOPICS).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold opacity-70">Subtopic</label>
          <select 
            value={config.subtopic}
            onChange={(e) => setConfig({ ...config, subtopic: e.target.value })}
            className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            {TOPICS[config.topic as keyof typeof TOPICS].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold opacity-70">Difficulty</label>
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => setConfig({ ...config, difficulty: d })}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  config.difficulty === d 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 hover:text-indigo-600'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold opacity-70">Questions: {config.questionCount}</label>
          <input 
            type="range" min="3" max="15"
            value={config.questionCount}
            onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      <button 
        onClick={onStart}
        disabled={isLoading}
        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 overflow-hidden relative"
      >
        {isLoading ? (
          <>
            <RefreshCcw className="animate-spin" size={20} />
            AI is formulating questions...
          </>
        ) : (
          <>
            Generate & Start Quiz
            <ChevronRight size={20} />
          </>
        )}
      </button>
    </motion.div>
  );
}

function QuizRunner({ questions, currentIdx, setCurrentIdx, userAnswers, setUserAnswers, timeRemaining, setTimeRemaining, onFinish }: { 
  questions: Question[], 
  currentIdx: number,
  setCurrentIdx: (i: number) => void,
  userAnswers: (string | null)[],
  setUserAnswers: (a: (string | null)[]) => void,
  timeRemaining: number,
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>,
  onFinish: () => void
}) {
  const currentQ = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  useEffect(() => {
    if (timeRemaining <= 0) {
      onFinish();
      return;
    }
    const timer = setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelect = (opt: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIdx] = opt;
    setUserAnswers(newAnswers);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end mb-2">
        <div>
          <p className="text-sm font-bold text-indigo-600 mb-1 font-mono uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BookOpen size={20} /> Solving Session
          </h3>
        </div>
        <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 rounded-xl ${
          timeRemaining < 30 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
        }`}>
          <Timer size={20} />
          {formatTime(timeRemaining)}
        </div>
      </div>

      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-8">
        <motion.div 
          className="h-full bg-indigo-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="glass-card p-6 sm:p-10 rounded-3xl space-y-8 min-h-[400px] flex flex-col">
        <p className="text-lg sm:text-2xl font-semibold leading-relaxed grow">
          {currentQ.question}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {currentQ.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              className={`quiz-option flex items-start gap-3 ${
                userAnswers[currentIdx] === opt ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500' : ''
              }`}
            >
              <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm shrink-0 uppercase transition-colors group-hover:bg-indigo-100">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="pt-0.5">{opt}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="px-6 py-3 font-bold flex items-center gap-2 hover:text-indigo-600 disabled:opacity-0 transition-all"
        >
          <ChevronLeft size={20} /> Previous
        </button>
        
        {currentIdx === questions.length - 1 ? (
          <button
            onClick={onFinish}
            className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 hover:scale-105 transition-all flex items-center gap-2"
          >
            Finish Quiz <CheckCircle2 size={20} />
          </button>
        ) : (
          <button
            onClick={() => setCurrentIdx(currentIdx + 1)}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2"
          >
            Next Question <ChevronRight size={20} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ResultView({ result, onRetry }: { result: QuizResult, onRetry: () => void }) {
  const [showReview, setShowReview] = useState(false);

  if (showReview) return <ReviewSection answers={result.answers} onBack={() => setShowReview(false)} />;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4 py-8 mb-8">
        <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl mb-4">
          <Trophy size={48} />
        </div>
        <h2 className="text-4xl font-black italic">Test Complete!</h2>
        <p className="text-slate-600 font-mono tracking-widest uppercase">Final Performance Metrics</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <StatCard label="Total Score" value={result.score} sub="+1 For Correct, -0.33 For Wrong" highlight />
        <StatCard label="Accuracy" value={`${result.accuracy}%`} sub={`${result.correct} / ${result.total}`} />
        <StatCard label="Time Taken" value={`${Math.floor(result.timeTaken/60)}m ${result.timeTaken%60}s`} />
        <StatCard label="Efficiency" value={result.score > 0 ? "Qualified" : "Practice Needed"} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={onRetry}
          className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCcw size={20} /> Attempt New Set
        </button>
        <button 
          onClick={() => setShowReview(true)}
          className="px-10 py-5 bg-white dark:bg-slate-800 text-indigo-600 border border-indigo-600 rounded-2xl font-black shadow-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2"
        >
          <BookOpen size={20} /> Review Solutions
        </button>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string, value: any, sub?: string, highlight?: boolean }) {
  return (
    <div className={`p-6 rounded-3xl glass-card text-center flex flex-col justify-center gap-1 ${highlight ? 'ring-2 ring-indigo-500 scale-105' : ''}`}>
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-60 font-mono">{label}</p>
      <p className={`text-2xl sm:text-3xl font-black ${highlight ? 'text-indigo-600' : ''}`}>{value}</p>
      {sub && <p className="text-[8px] opacity-40 font-mono leading-tight">{sub}</p>}
    </div>
  );
}

function ReviewSection({ answers, onBack }: { answers: QuizResult['answers'], onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between sticky top-24 z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm py-2 rounded-xl px-4">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="text-indigo-600" /> Detailed Solutions
        </h3>
        <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all font-bold flex items-center gap-1">
          <ChevronLeft size={20} /> Back to Results
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
        {answers.map((item, idx) => (
          <div key={idx} className="glass-card p-6 sm:p-8 rounded-3xl space-y-4 border-l-4" style={{ borderColor: item.isCorrect ? '#22c55e' : (item.userAnswer === null ? '#94a3b8' : '#ef4444')}}>
            <div className="flex justify-between items-start gap-4">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold font-mono">Q{idx + 1}</span>
              {item.isCorrect ? (
                <span className="text-green-600 flex items-center gap-1 text-sm font-bold"><CheckCircle2 size={16} /> Correct</span>
              ) : item.userAnswer === null ? (
                 <span className="text-slate-500 font-bold text-sm">Unanswered</span>
              ) : (
                <span className="text-red-600 flex items-center gap-1 text-sm font-bold"><XCircle size={16} /> Incorrect</span>
              )}
            </div>

            <p className="text-lg font-bold leading-snug">{item.question.question}</p>
            
            <div className="space-y-2">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <p className="text-xs uppercase font-bold opacity-50 mb-1">Your Answer</p>
                <p className={item.isCorrect ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>{item.userAnswer || "No answer selected"}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-900/50">
                <p className="text-xs uppercase font-bold text-green-600/60 mb-1">Correct Answer</p>
                <p className="font-semibold text-green-700 dark:text-green-400">{item.question.answer}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs uppercase font-bold opacity-50 mb-2 flex items-center gap-1"><HelpCircle size={14} /> AI Analysis & Explanation</p>
              <p className="text-sm sm:text-base leading-relaxed opacity-80 italic">{item.question.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function HistoryView({ history, onClose }: { history: QuizResult[], onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="glass-card p-6 sm:p-8 rounded-3xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><History /> Test History</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><XCircle /></button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {history.length === 0 ? (
          <p className="text-center py-12 text-slate-500 italic">No tests attempted yet. Start your preparation now!</p>
        ) : (
          history.map((record, idx) => (
            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex justify-between items-center group hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800">
              <div>
                <p className="font-bold text-lg">Score: {record.score}</p>
                <p className="text-xs opacity-50 font-mono">{new Date(record.timestamp).toLocaleDateString()} at {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-indigo-600">{record.accuracy}% Accuracy</p>
                <p className="text-[10px] uppercase opacity-40 font-mono">{record.correct}C / {record.wrong}W / {record.total}T</p>
              </div>
            </div>
          ))
        )}
      </div>
      
      <button onClick={onClose} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Close History</button>
    </motion.div>
  );
}
