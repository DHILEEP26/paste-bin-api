import express from "express";
import {
  createPaste,
  getPasteById,
  viewPasteHtml,
} from "../controller/pasteController";

const router = express.Router();

// API Routes
router.post("/", createPaste);
router.get("/:id", getPasteById);

// HTML view route (no /api prefix)
// This will be mounted at /p so becomes /p/:id
router.get("/:id", viewPasteHtml);

export default router;