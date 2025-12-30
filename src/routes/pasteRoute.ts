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


export default router;