import React, { useState, useEffect } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowLeft,
  Sparkles,
  Brain,
} from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";
import flashcardService from "../../services/flashcardService";
import aiService from "../../services/aiService";
import Spinner from "../common/Spinner";
import Modal from "../common/Modal";
import Flashcard from "./Flashcard";

const FlashcardManager = ({ documentId }) => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [setToDelete, setSetToDelete] = useState(null);

  useEffect(() => {
    if (documentId) fetchFlashcardSets();
  }, [documentId]);

  const fetchFlashcardSets = async () => {
    try {
      setLoading(true);
      const response =
        await flashcardService.getFlashcardsForDocument(documentId);
      setFlashcardSets(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch flashcard sets.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    try {
      setGenerating(true);
      await aiService.generateFlashcards(documentId);
      toast.success("Flashcards generated successfully!");
      fetchFlashcardSets();
    } catch (error) {
      toast.error(error.message || "Failed to generate flashcards.");
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async (cardId) => {
    try {
      await flashcardService.reviewFlashcard(cardId);
    } catch {
      toast.error("Failed to review flashcard.");
    }
  };

  const handleNextCard = () => {
    if (!selectedSet) return;

    const currentCard = selectedSet.cards[currentCardIndex];
    handleReview(currentCard._id);

    setCurrentCardIndex(
      (prev) => (prev + 1) % selectedSet.cards.length
    );
  };

  const handlePrevCard = () => {
    if (!selectedSet) return;

    const currentCard = selectedSet.cards[currentCardIndex];
    handleReview(currentCard._id);

    setCurrentCardIndex(
      (prev) =>
        (prev - 1 + selectedSet.cards.length) %
        selectedSet.cards.length
    );
  };

  const handleToggleStar = async (cardId) => {
    try {
      await flashcardService.toggleStar(cardId);

      const updatedSets = flashcardSets.map((set) =>
        set._id === selectedSet._id
          ? {
              ...set,
              cards: set.cards.map((card) =>
                card._id === cardId
                  ? { ...card, isStarred: !card.isStarred }
                  : card
              ),
            }
          : set
      );

      setFlashcardSets(updatedSets);
      setSelectedSet(
        updatedSets.find((set) => set._id === selectedSet._id)
      );
    } catch {
      toast.error("Failed to update star status.");
    }
  };

  const handleDeleteRequest = (e, set) => {
    e.stopPropagation();
    setSetToDelete(set);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!setToDelete) return;

    try {
      setDeleting(true);
      await flashcardService.deleteFlashcardSet(setToDelete._id);
      toast.success("Flashcard set deleted!");
      setIsDeleteModalOpen(false);
      setSetToDelete(null);
      fetchFlashcardSets();
    } catch (error) {
      toast.error(error.message || "Failed to delete flashcard set.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectedSet = (set) => {
    setSelectedSet(set);
    setCurrentCardIndex(0);
  };

  /* ===================== VIEWER ===================== */

  const renderFlashcardViewer = () => {
    if (!selectedSet || !selectedSet.cards?.length) return null;

    const currentCard = selectedSet.cards[currentCardIndex];

    return (
      <div className="space-y-8">
        <button
          onClick={() => setSelectedSet(null)}
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
          Back to Sets
        </button>

        <div className="flex flex-col items-center space-y-8">
          <div className="w-full max-w-2xl">
            <Flashcard
              flashcard={currentCard}
              onToggleStar={handleToggleStar}
            />
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={handlePrevCard}
              disabled={selectedSet.cards.length <= 1}
              className="group flex items-center gap-2 px-5 h-11 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
              Previous
            </button>

            <div className="px-4 py-2 bg-slate-50 rounded-lg border">
              <span className="text-sm font-semibold">
                {currentCardIndex + 1} / {selectedSet.cards.length}
              </span>
            </div>

            <button
              onClick={handleNextCard}
              disabled={selectedSet.cards.length <= 1}
              className="group flex items-center gap-2 px-5 h-11 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium disabled:opacity-40"
            >
              Next
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ===================== LIST ===================== */

  const renderSetList = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      );
    }

    if (!flashcardSets.length) {
      return (
        <div className="text-center py-16 space-y-6">
          <Brain className="w-10 h-10 mx-auto text-emerald-500" />
          <h3 className="text-lg font-semibold">
            No Flashcards Yet
          </h3>
          <button
            onClick={handleGenerateFlashcards}
            disabled={generating}
            className="px-6 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
          >
            {generating ? "Generating..." : "Generate Flashcards"}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Your Flashcard Sets
          </h3>
          <button
            onClick={handleGenerateFlashcards}
            disabled={generating}
            className="px-5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold"
          >
            Generate New Set
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcardSets.map((set) => (
            <div
              key={set._id}
              onClick={() => handleSelectedSet(set)}
              className="bg-white border-2 border-slate-200 hover:border-emerald-300 rounded-2xl p-6 cursor-pointer transition hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <h4 className="font-semibold">
                  Flashcard Set
                </h4>
                <button
                  onClick={(e) => handleDeleteRequest(e, set)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                Created {moment(set.createdAt).format("MMM D, YYYY")}
              </p>

              <p className="text-sm mt-4 font-semibold text-emerald-600">
                {set.cards.length}{" "}
                {set.cards.length === 1 ? "card" : "cards"}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-3xl border shadow-lg p-8">
        {selectedSet ? renderFlashcardViewer() : renderSetList()}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Flashcard Set?"
      >
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="px-4 h-10 bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            className="px-4 h-10 bg-red-600 text-white rounded-lg"
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
};

export default FlashcardManager;
