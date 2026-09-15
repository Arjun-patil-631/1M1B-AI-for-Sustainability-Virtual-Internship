import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { IamAuthenticator } from "ibm-cloud-sdk-core";
import { WatsonXAI } from "@ibm-cloud/watsonx-ai";

const app = express();
const PORT = 5000;

app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const watsonxAI = WatsonXAI.newInstance({
  version: "2024-05-31",
  serviceUrl:
    process.env.WATSONX_AI_SERVICE_URL ||
    "https://us-south.ml.cloud.ibm.com",
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSONX_AI_APIKEY || "",
  }),
});

app.post(
  "/api/analyze",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No image uploaded.",
        });
      }

      if (!process.env.WATSONX_AI_PROJECT_ID) {
        return res.status(500).json({
          error: "WATSONX_AI_PROJECT_ID is not configured.",
        });
      }

      const mimeType = req.file.mimetype;

      if (!mimeType.startsWith("image/")) {
        return res.status(400).json({
          error: "Only image files are supported.",
        });
      }

      const base64Image = req.file.buffer.toString("base64");

      const prompt = `
You are EcoSort AI, an AI-powered waste sorting assistant.

Analyze the uploaded image and identify the primary waste item.

Classify it into exactly ONE of these categories:

- Organic
- Paper
- Plastic
- Glass
- Metal
- E-Waste
- Other / Unknown

Return ONLY valid JSON using this exact structure:

{
  "item": "specific item name",
  "category": "one category from the list",
  "confidence": 0,
  "guidance": "short disposal guidance",
  "ecoTip": "short sustainability tip"
}

Rules:

1. confidence must be an integer from 0 to 100.
2. Do not invent details that cannot reasonably be identified.
3. If the image is unclear, use "Other / Unknown" and a low confidence.
4. Do not claim that a particular bin color is universal.
5. Disposal guidance should say to follow local waste-management rules where appropriate.
6. For batteries and electronic devices, identify them as E-Waste.
7. Do not include markdown.
`;

      const response = await watsonxAI.textChat({
        modelId: "ibm/granite-vision-3-3-2b",
        projectId: process.env.WATSONX_AI_PROJECT_ID,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        maxTokens: 300,
        temperature: 0,
      });

      const content =
        response.result.choices[0]?.message?.content;

      if (!content) {
        throw new Error("AI returned an empty response.");
      }

      const cleaned = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const result = JSON.parse(cleaned);

      return res.json(result);
    } catch (error) {
      console.error("AI analysis error:", error);

      return res.status(500).json({
        error: "Unable to analyze the image.",
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(`EcoSort backend running on http://localhost:${PORT}`);
});