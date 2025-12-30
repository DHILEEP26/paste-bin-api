import express from "express";
import {
  viewPasteHtml
} from "../controller/pasteController";

const router = express.Router();

router.get("/:id", viewPasteHtml);

export default router;