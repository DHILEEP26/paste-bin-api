import { Request, Response } from "express";
import * as PasteService from "../service/pasteService";

// Helper function to get current time (supports TEST_MODE)
const getCurrentTime = (req: Request): Date => {
  if (process.env.TEST_MODE === "1") {
    const testNowMs = req.headers["x-test-now-ms"];
    if (testNowMs && typeof testNowMs === "string") {
      return new Date(parseInt(testNowMs, 10));
    }
  }
  return new Date();
};

// Create a new paste
export const createPaste = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { content, ttl_seconds, max_views } = req.body;

    // Validate content
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: "Content is required and must be a non-empty string",
      });
      return;
    }

    // Validate ttl_seconds
    if (ttl_seconds !== undefined && ttl_seconds !== null) {
      if (!Number.isInteger(ttl_seconds) || ttl_seconds < 1) {
        res.status(400).json({
          success: false,
          message: "ttl_seconds must be an integer >= 1",
        });
        return;
      }
    }

    // Validate max_views
    if (max_views !== undefined && max_views !== null) {
      if (!Number.isInteger(max_views) || max_views < 1) {
        res.status(400).json({
          success: false,
          message: "max_views must be an integer >= 1",
        });
        return;
      }
    }
    const paste = await PasteService.createPaste({
      content,
      ttl_seconds,
      max_views,
    });

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/p/${paste.id}`;

    res.status(201).json({
      id: paste.id,
      url,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: `Error creating paste: ${error.message}`,
    });
  }
};

// Get paste by ID (API)
export const getPasteById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentTime = getCurrentTime(req);

    const paste = await PasteService.getPasteById(id, currentTime, true);

    if (!paste) {
      res.status(404).json({
        success: false,
        message: "Paste not found or expired",
      });
      return;
    }

    res.status(200).json({
      content: paste.content,
      remaining_views: paste.remaining_views,
      expires_at: paste.expires_at,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: "Paste not found or expired",
    });
  }
};

// View paste as HTML
export const viewPasteHtml = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentTime = getCurrentTime(req);

    const paste = await PasteService.getPasteById(id, currentTime, false);

    if (!paste) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Paste Not Found</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              text-align: center;
            }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>Paste Not Found</h1>
          <p>This paste does not exist or has expired.</p>
        </body>
        </html>
      `);
      return;
    }

    // Escape HTML to prevent XSS
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const safeContent = escapeHtml(paste.content);

    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Paste - ${id}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Courier New', monospace;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .content {
            white-space: pre-wrap;
            word-wrap: break-word;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            margin: 20px 0;
          }
          .info {
            color: #666;
            font-size: 14px;
            margin-top: 20px;
          }
          h1 {
            color: #333;
            margin-top: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Paste</h1>
          <div class="content">${safeContent}</div>
          <div class="info">
            ${paste.remaining_views !== null ? `<p>Remaining views: ${paste.remaining_views}</p>` : ''}
            ${paste.expires_at ? `<p>Expires at: ${paste.expires_at}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error: any) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Paste Not Found</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          h1 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>Paste Not Found</h1>
        <p>This paste does not exist or has expired.</p>
      </body>
      </html>
    `);
  }
};