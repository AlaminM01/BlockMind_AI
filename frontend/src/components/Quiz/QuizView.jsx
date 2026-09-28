import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getQuizTopics, getQuizQuestions, submitQuiz } from '../../services/api';

const QuizView = () => {
  const { setActiveTab, setPendingQuery } = useApp();
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); // { [question_id]: option_index }
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const data = await getQuizTopics();
        setTopics(data.topics || []);
      } catch (err) {
        console.error('Failed to load quiz topics:', err);
      }
    };
    loadTopics();
    fetchNewQuiz('all');
  }, []);

  const fetchNewQuiz = async (topic) => {
    try {
      setLoading(true);
      setEvaluation(null);
      setUserAnswers({});
      const data = await getQuizQuestions(topic === 'all' ? null : topic, 5);
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIdx) => {
    if (evaluation) return; // Locked after submitting
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(userAnswers).length < questions.length) {
      alert('Please answer all questions before submitting your quiz!');
      return;
    }

    try {
      setSubmitting(true);
      const submissions = questions.map((q) => ({
        question_id: q.id,
        selected_option: userAnswers[q.id],
      }));
      const res = await submitQuiz(submissions);
      setEvaluation(res);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskAIAboutQuestion = (q, result) => {
    const query = `Can you explain the following blockchain concept from the book "${result?.book_reference || q.book}"?\n\nQuestion: "${q.question}"\nExplanation: ${result?.explanation || ''}`;
    if (setPendingQuery) {
      setPendingQuery(query);
    }
    setActiveTab('chat');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 text-purple-300 border border-purple-500/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Blockchain Study & Certification Quiz
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AI Tutor Mode
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Test your knowledge from the 5 indexed blockchain books with automated grading and cited explanations.
            </p>
          </div>
        </div>

        {/* Topic Selector & Reset */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
              fetchNewQuiz(e.target.value);
            }}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Blockchain Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchNewQuiz(selectedTopic)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Quiz</span>
          </button>
        </div>
      </div>

      {/* Score Summary Card (When evaluated) */}
      {evaluation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/40 shadow-glow-cyan space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
                  Evaluation Result
                </span>
                <h3 className="text-xl font-bold text-white">{evaluation.grade}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-slate-400">Score</span>
                <p className="text-2xl font-bold text-cyan-400">
                  {evaluation.score} / {evaluation.total}
                </p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-right">
                <span className="text-xs text-slate-400">Accuracy</span>
                <p className="text-2xl font-bold text-emerald-400">{evaluation.percentage}%</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <BrainCircuit className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Generating questions from blockchain corpus...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const evalResult = evaluation?.results?.find((r) => r.question_id === q.id);
            return (
              <div
                key={q.id || idx}
                className={`p-5 rounded-2xl transition-all border ${
                  evalResult
                    ? evalResult.is_correct
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-900/70 border-white/5'
                }`}
              >
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-purple-300 border border-purple-500/20">
                      {q.topic}
                    </span>
                    <span className="text-xs font-mono text-slate-400">[{q.difficulty}]</span>
                  </div>

                  <span className="text-xs text-slate-400 font-medium truncate max-w-xs">
                    {q.book}
                  </span>
                </div>

                {/* Question Text */}
                <h4 className="text-sm font-semibold text-slate-100 mb-4 leading-relaxed">
                  {q.question}
                </h4>

                {/* Options */}
                <div className="space-y-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userAnswers[q.id] === optIdx;
                    const isCorrectOption = evalResult && evalResult.correct_option === optIdx;
                    const isWrongSelection = evalResult && isSelected && !evalResult.is_correct;

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all flex items-start gap-3 border ${
                          isCorrectOption
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                            : isWrongSelection
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                            : isSelected
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200 shadow-glow-cyan'
                            : 'bg-slate-800/50 border-white/5 hover:border-white/20 text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold mt-0.5">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1 leading-relaxed">{opt}</span>
                        {isCorrectOption && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />}
                        {isWrongSelection && <XCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation & Book Citation when submitted */}
                {evalResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Explanation & Book Grounding:</span>
                      </div>
                      <button
                        onClick={() => handleAskAIAboutQuestion(q, evalResult)}
                        className="text-[11px] text-purple-300 hover:text-purple-200 flex items-center gap-1 hover:underline"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Study with AI Tutor</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{evalResult.explanation}</p>
                    <div className="text-[11px] text-slate-400 font-mono pt-1">
                      Reference: <span className="text-cyan-300">{evalResult.book_reference}</span> — {evalResult.chapter_reference}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}

          {/* Submit Button */}
          {!evaluation && (
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting || questions.length === 0}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold shadow-glow-cyan flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <span>Submit & Grade Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizView;
