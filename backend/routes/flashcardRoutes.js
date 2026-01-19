import express from "express";
import { body } from "express-validator";
import {
  getFlashcards,
  getAllFlashcardSets,
  reviewFlashcard,
  toggleStarFlashcard,
  deleteFlashcardSet,
} from "../controllers/flashcardController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllFlashcardSets);
router.post("/:documentId", getFlashcards);
router.get("/:cardId/review", reviewFlashcard);
router.put("/:cardId/star", toggleStarFlashcard);
router.post("/:id", protect, deleteFlashcardSet);

export default router;
