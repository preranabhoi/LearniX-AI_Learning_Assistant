import React, { useEffect, useState } from "react";
import { Plus, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import quizService from "../../services/quizService";
import Spinner from "../../components/common/Spinner";

const QuizManager = ({ documentId }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const navigate = useNavigate();

  const fetchQuizzes = async () => {
    try {
      const data = await quizService.getQuizzesByDocument(documentId);
      setQuizzes(data || []);
    } catch (error) {
      toast.error("Failed to fetch quizzes.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [documentId]);

  const handleGenerateQuiz = async () => {
    try {
      setGenerating(true);
      await quizService.generateQuiz(documentId);
      toast.success("Quiz generated successfully!");
      fetchQuizzes();
    } catch (error) {
      toast.error("Failed to generate quiz.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Quizzes
        </h2>

        <button
          onClick={handleGenerateQuiz}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg shadow disabled:opacity-50 transition"
        >
          <Plus size={16} />
          {generating ? "Generating..." : "Generate Quiz"}
        </button>
      </div>

      {/* Empty State */}
      {quizzes.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">
            No quizzes generated yet.
          </p>
        </div>
      )}

      {/* Quiz Grid */}
      {quizzes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {quizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition"
            >
              {/* Score Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-600">
                  Score: {quiz.score ?? 0}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                {quiz.title || "Quiz"}
              </h3>

              {/* Date */}
              <p className="text-xs text-gray-400 mb-4">
                Created {new Date(quiz.createdAt).toLocaleDateString()}
              </p>

              {/* Question Count */}
              <div className="text-xs text-gray-600 mb-4">
                {quiz.questions?.length || 0} Questions
              </div>

              {/* View Results */}
              <button
                onClick={() =>
                  navigate(`/quizzes/${quiz._id}/results`)
                }
                className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
              >
                <BarChart3 size={16} />
                View Results
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizManager;
