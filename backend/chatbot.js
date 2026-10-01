import dotenv from "dotenv"
dotenv.config()
import express from "express"
import Groq from "groq-sdk"
import { storedocument } from "./Rag.js"
import { searchdocuments } from "./Rag.js"
import { redis } from "./redis.js"
import multer from "multer"
import fs from "fs/promises"
import { isDuplicate } from "./Rag.js"
import crypto from "crypto"
import connectdb from "./db.js"
import { tavily } from "@tavily/core"
import { getquizs } from "./Rag.js"
import cloudinary from "./config/cloudinary.js"
import Document from "./models/document.js"
import { getSummaryChunks } from "./Rag.js"
import summary from "./models/summary.js"
import User from "./models/User.js"
import { deleteDocumentVectors } from "./Rag.js"
import sarvam from "./sarvam.js"

import { stringSimilarity } from "string-similarity-js"
const chatbot = express.Router()

const LIMITS = {
    requestsPerMinute: 10,
    requestsPerDay: 200,
    tokensPerMinute: 4000,
    tokensPerDay: 50000
};

const PROLIMITS = {
    requestsPerMinute: 15,
    requestsPerDay: 400,
    tokensPerMinute: 6000,
    tokensPerDay: 100000
};

const PREMIUMLIMITS = {
    requestsPerMinute: 20,
    requestsPerDay: 600,
    tokensPerMinute: 7000,
    tokensPerDay: 150000
};

const PLAN_LIMITS = {
    free: LIMITS,
    pro: PROLIMITS,
    premium: PREMIUMLIMITS
};

connectdb()
const groq = new Groq({
    apiKey: process.env.GROQ_API
})


const upload = multer({
    dest: "uploads/"
})

async function checkQuota(ip, sessionid) {

    const user = await User.findOne({ sessionId: sessionid });

    if (!user) {
        throw new Error("User not found");
    }

    if (
    user.plan !== "free" &&
    user.planExpiresAt &&
    user.planExpiresAt <= new Date()
) {
    user.plan = "free";
    user.planExpiresAt = null;

    await user.save();
}

 const limits = PLAN_LIMITS[user.plan];
    const minuteKey = `quota:${ip}:minute`;
    const dayKey = `quota:${ip}:day`;

    let minute = await redis.get(minuteKey);
    let day = await redis.get(dayKey);

    // First request
    if (!minute) {
        minute = {
            requests: 0,
            tokens: 0
        };

        await redis.set(
            minuteKey,
            minute,
            {
                ex: 60
            }
        );
    }

    // First request of the day
    if (!day) {
        day = {
            requests: 0,
            tokens: 0
        };

        await redis.set(
            dayKey,
            day,
            {
                ex: 60 * 60 * 24
            }
        );
    }

    // =========================
    // REQUEST LIMITS
    // =========================
if (minute.requests >= limits.requestsPerMinute) {

    const remainingSeconds = await redis.ttl(minuteKey);

    return {
        allowed: false,
        reason: "requests_per_minute",
        message: "You have reached the request limit for this minute.",
        remainingSeconds
    };
}

   if (day.requests >= limits.requestsPerDay) {

    const remainingSeconds = await redis.ttl(dayKey);

    return {
        allowed: false,
        reason: "requests_per_day",
        message: "You have reached your daily request limit.",
        remainingSeconds
    };
}

    // =========================
    // TOKEN LIMITS
    // =========================

  if (minute.tokens >= limits.tokensPerMinute) {

    const remainingSeconds = await redis.ttl(minuteKey);

    return {
        allowed: false,
        reason: "tokens_per_minute",
        message: "You have reached the token limit for this minute.",
        remainingSeconds
    };
}

 if (day.tokens >= limits.tokensPerDay) {

    const remainingSeconds = await redis.ttl(dayKey);

    return {
        allowed: false,
        reason: "tokens_per_day",
        message: "You have reached your daily token limit.",
        remainingSeconds
    };
}

    return {
        allowed: true,
        minute,
        day,
        minuteKey,
        dayKey
    };
}

async function updateQuota(quota, usedTokens) {

    quota.minute.requests += 1;
    quota.minute.tokens += usedTokens;

    quota.day.requests += 1;
    quota.day.tokens += usedTokens;

    await redis.set(
        quota.minuteKey,
        quota.minute,
        {
            ex: 60
        }
    );

    await redis.set(
        quota.dayKey,
        quota.day,
        {
            ex: 60 * 60 * 24
        }
    );
}

chatbot.post("/user/session", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    let user = await User.findOne({ sessionId });

    if (!user) {
      user = await User.create({
        sessionId: sessionId,
        // plan automatically "free" hoga
      });
    }

    res.json({
      success: true,
      plan: user.plan,
    });
  } catch (error) {
    console.error("Session error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create session",
    });
  }
});


chatbot.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
    try {

        console.log(req.file);

        const { sessionid } = req.body;

        const filebuffer = await fs.readFile(req.file.path);

        const fileHash = crypto
            .createHash("sha256")
            .update(filebuffer)
            .digest("hex");

        const duplicate = await isDuplicate(sessionid, fileHash);

        if (duplicate) {
            return res.json({
                success: false,
                message: "Ye PDF already upload ki ja chuki hai."
            });
        }

        const filepath = req.file.path;

        const documentId = crypto.randomUUID();


        // 1️⃣ PDF Cloudinary par upload
        const cloudinaryResult = await cloudinary.uploader.upload(
            filepath,
            {
                resource_type: "raw",
                folder: "genai-pdfs",
                public_id: documentId
            }
        );


    res.json({
    success: true,
    message: "PDF uploaded successfully",
    filename: req.file.originalname,
    documentId: documentId
});

storedocument(
    filepath,
    sessionid,
    fileHash,
    documentId
)


        res.json({
            success: true,
            message: "PDF uploaded successfully",
            filename: req.file.originalname,
            documentId: documentId
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "PDF upload failed"
        });
    }
});

chatbot.post("/summaries", async (req,res)=>{
       try {
   const ip = req.ip;
 const {documentId, sessionid, offset = 0} = req.body
    const quota = await checkQuota(ip, sessionid);

    if (!quota.allowed) {
      return res.json({
        success: false,
        quotaExceeded: true,
        reason: quota.reason,
        message: quota.message,
        remainingSeconds: quota.remainingSeconds
      });
    }

       
          if (Array.isArray(documentId)) {
      if (documentId.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select a PDF."
        });
      }

      if (documentId.length > 1) {
        return res.status(400).json({
          success: false,
          message: "Please select only one PDF."
        });
      }
    }

    const result = await SummaryAi(
      sessionid,
      documentId,
      quota,
        offset
      
    );

    await summary.create({
        sessionid,
         documentId,
        offset,
        text:result.summary,
        progress:result.progress
    })

    return res.json({
  success: true,
  mode: "summary",
  summary: result
});

       } catch (error) {
        console.log(error, "error aa raha hai kuch to summary wale mai");
        
       }
})


chatbot.get(
  "/summaries/:sessionid/:documentId",
  async (req, res) => {
    try {
      const { sessionid, documentId } = req.params;

      const summaries = await summary.find({
        sessionid,
        documentId
      }).sort({ createdAt: 1 });

      return res.json({
        success: true,
        summaries
      });

    } catch (error) {
      console.log("Summary fetch error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not load summaries."
      });
    }
  }
);


chatbot.get("/documents/:sessionid", async (req, res) => {
  try {
    const { sessionid } = req.params;

    const documents = await Document.find({ sessionid });

    res.json({
      success: true,
      documents,
    });

  } catch (error) {
    console.log("Documents fetch error:", error);

    res.status(500).json({
      success: false,
      documents: [],
    });
  }
});

chatbot.patch("/documents/:documentId/select", async (req, res) => {
  try {
    const { documentId } = req.params;
    const { selected } = req.body;

    const document = await Document.findOneAndUpdate(
      { documentId },
      { selected },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      document,
    });

  } catch (error) {
    console.log("Document selection update error:", error);

    res.status(500).json({
      success: false,
      message: "Could not update document selection",
    });
  }
});

const Tavily = new tavily({
    apiKey: process.env.TAVILY_API_KEY
})

chatbot.get("/session/:sessionid", async (req, res) => {
  try {
    const { sessionid } = req.params;
    const { mode, quizType } = req.query;

    let redisKey;

    // =========================
    // QUIZ HISTORY
    // =========================

    if (mode === "quiz") {

      if (quizType === "random") {
        redisKey = `quiz:random:${sessionid}`;
      }

      else if (quizType === "pdf") {
        redisKey = `quiz:pdf:${sessionid}`;
      }

      else {
        return res.json({
          success: true,
          history: []
        });
      }
    }

    // =========================
    // SUMMARY HISTORY
    // =========================

    else if (mode === "summary") {
      redisKey = `summary:${sessionid}`;
    }

    // =========================
    // CHAT HISTORY
    // =========================

    else {
      redisKey = sessionid;
    }

    // =========================
    // GET HISTORY
    // =========================

    const history = await redis.get(redisKey) || [];

    console.log("History Redis Key:", redisKey);
    console.log("History:", history);

    res.json({
      success: true,
      history
    });

  } catch (error) {
    console.log("Session history error:", error);

    res.status(500).json({
      success: false,
      history: []
    });
  }
});


chatbot.delete(
  "/documents/:sessionid/:documentId",
  async (req, res) => {
    try {
      const { sessionid, documentId } = req.params;

      // MongoDB se document delete
      const document = await Document.findOneAndDelete({
        sessionid,
        documentId,
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Document not found.",
        });
      }

      await deleteDocumentVectors(documentId)

      return res.json({
        success: true,
        message: "Document deleted successfully.",
      });

    } catch (error) {
      console.log("Document delete error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not delete document.",
      });
    }
  }
);


chatbot.delete(
  "/clearsummary/:sessionid/:documentId",
  async (req, res) => {
    try {
      const { sessionid, documentId } = req.params;

      await summary.deleteMany({
        sessionid,
        documentId
      });

      return res.json({
        success: true,
        message: "Summary cleared successfully."
      });

    } catch (error) {
      console.log("Clear summary error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not clear summary."
      });
    }
  }
);

chatbot.post("/sendmsg", async (req, res) => {
    const ip = req.ip
    try {
   const { query, sessionid, documentId, mode, quizType } = req.body
         const quota = await checkQuota(ip, sessionid);

    if (!quota.allowed) {
        
      return res.json({
        success: false,
        quotaExceeded: true,
        reason: quota.reason,
        message: quota.message,
        remainingSeconds: quota.remainingSeconds
      });
    }

        console.log("SENDMSG HIT");
        console.log("BODY:", req.body);
     
        console.log("mode:", mode);
        console.log("quizType:", quizType);
        if (mode === "quiz") {
            console.log("quiz mode wala chalega");

            if (quizType == "pdf") {
                console.log("quiz mode wale ka pdf type wala chalega");

                if (!Array.isArray(documentId) || documentId.length === 0) {
                    return res.json({
                        success: false,
                        mode: "quiz",
                        msg: "Please select a PDF before starting the quiz."
                    });
                }

                const result = await QuizAi(sessionid, documentId,quota)

                if (result.error) {
                    return res.json({
                        success: true,
                        mode: "quiz",
                        type: "retry",
                        quiztype: quizType,
                        aimsg: result.message
                    });
                }

                return res.json({
                    success: true,
                    aimsg: result,
                    type: "question",
                    mode: mode,
                    quiztype: quizType
                })
            }
            if (quizType == "random") {
                console.log("quiz mode wale ka random type wala chalega");
                const result = await RandomAi(sessionid, documentId, quota)
                if (result.error) {
                    return res.json({
                        success: true,
                        mode: "quiz",
                        type: "retry",
                        quiztype: quizType,
                        aimsg: result.message
                    });
                }

                return res.json({
                    success: true,
                    aimsg: result,
                    type: "question",
                    mode: mode,
                    quizTyp: quizType
                })
            }
        }
        console.log("normal chat type wala chalega");
        const result = await ChatAi(query, sessionid, documentId,quota)
        res.json({
            success: true,
            aimsg: result,
            mode: mode,
            quiztype: quizType
        })

    } catch (error) {
        res.json({
            success: false
        })
        console.log("error aa rha hai kuch to sendmsg api mai ", error);

    }
})


async function SummaryAi(sessionid, documentId, quota,  offset = 0) {
    try {
     
         const result = await getSummaryChunks(
    sessionid,
    documentId,
    offset
  );
  const chunks = result.chunks
  const totalChunks = result.totalChunks;
console.log("OFFSET:", offset);
console.log("CHUNKS:", chunks.length);

      if (chunks.length === 0) {
      console.log("✅ PDF SUMMARY FINISHED");

      return {
        success: true,
        summary: "",
        nextOffset: offset,
        completed: true
      };
    }


  const text = chunks
  .map(chunk => chunk.payload.text)
  .join("\n\n");

  const response = await groq.chat.completions.create({
  model: "openai/gpt-oss-20b",

messages: [
  {
    role: "system",
content: `
You are a PDF summarization AI.

Your ONLY task is to summarize the provided PDF text.
The provided text is PDF content, NOT a question or conversation.

Do NOT answer questions, ask for clarification, or say:
"I don't know", "I don't have that information", "I'm sorry", or similar phrases.

Summarize ONLY the information present in the PDF.
Never invent, assume, or add outside information.

Keep the most important facts, policies, findings, conclusions, and key details.
Remove repetition, filler, minor details, and unnecessary examples.
Make the summary significantly shorter than the provided text.

Use simple, clear, natural language.
Use short paragraphs by default and bullets only when useful.
Do not rewrite the entire PDF.

Even if the provided text is short or incomplete, summarize whatever information is available.
Never refuse to summarize.

Return ONLY the final summary.
`
  },
  {
    role: "user",
    content: text
  }
]
});

  const usedTokens =
      response.usage?.total_tokens || 0;

    await updateQuota(
      quota,
      usedTokens
    );

const answer =
  response.choices[0].message.content;

const summary = answer
  .replace(/\*\*/g, "")
  .replace(/^[-*]\s+/gm, "")
  .replace(/^#+\s+/gm, "")
  .replace(/^\d+\.\s+/gm, "")
  .trim();

  const nextOffset =
      offset + chunks.length;

      const progress = Math.round(
  (nextOffset / totalChunks) * 100
);

   const completed =
  nextOffset >= totalChunks;

return {
  success: true,
  summary,
  progress,
  nextOffset,
  completed
};


    } catch (error) {
          console.log("summary generate mai error:", error);

        return {
            error: "summary nhi ho payi kuch error ki bajah se."
        };
    }
}

async function QuizAi(sessionid, documentId, quota, retrycount = 0) {
    if (retrycount >= 3) {
        return {
            error: true,
            message:  "You've covered all the available topics from this PDF. We couldn't find a fresh quiz question right now. Try another PDF or come back with new content."
        };
    }
    const oldquestions = await redis.get(`quiz:pdf:${sessionid}`) || []
    console.log(retrycount);
    const quizs = await getquizs(sessionid, documentId)
    console.log(quizs);

    const context = quizs
        .map((item, index) => `SOURCE ${index + 1}:\n${item.payload.text}`)
        .join("\n\n");


    const message = [
        {
            role: "system",
            content: `
You are a quiz generator.

Your job is to create ONE multiple-choice quiz question from the provided PDF text.

RULES:
- Use ONLY the provided PDF text.
- Do not use outside knowledge.
- Do not invent facts.
- The correct answer must be directly supported by the PDF text.
- Choose one useful fact/topic from the provided text and turn it into a clear question.
- Generate exactly 4 options.
- Exactly ONE option must be correct.
- The other 3 options must be incorrect but closely related to the question and believable.
- Do not create unrelated distractors.
- Do not make multiple options partially correct.
- Keep the question and options concise.
- Randomly choose a suitable topic from the provided text.
- Return ONLY valid JSON. No markdown, no explanation.

OUTPUT FORMAT:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctOption": "string",
  "topic":"pdf"
}

* Randomly place the correct answer in any one of the 4 options.
* Do not always put the correct answer in the first option.
* Change the correct answer position between questions.

`
        },
        {
            role: "user",
            content: `PDF TEXT:\n\n${context}`
        }
    ];
    try {
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: message,
            temperature: 0.7,
            response_format: {
                type: "json_object"
            }
        });

    const usedTokens = response.usage.total_tokens;
        await updateQuota(quota, usedTokens)

        const quiz = JSON.parse(
            response.choices[0].message.content
        );
        console.log("Generated Quiz:", quiz);
        function isDuplicateQuestion(quiz, oldquestions) {
            for (const oldquestion of oldquestions) {
                const score = stringSimilarity(
                    quiz.question.toLowerCase(),
                    oldquestion.question.toLowerCase()
                );
                console.log(score);


                if (score >= 0.7) {
                    return true;
                }
            }

            return false;
        }

        let duplicate = isDuplicateQuestion(quiz, oldquestions)

        if (duplicate) {
            return QuizAi(sessionid, documentId,quota, retrycount + 1)
        }



        // Redis mein quiz save karo
        else {
            oldquestions.push(quiz)
            await redis.set(
                `quiz:pdf:${sessionid}`,
                JSON.stringify(oldquestions),
                {
                    ex: 60 * 60 * 24
                }
            );

            return quiz
        }


    } catch (error) {
        console.log("Quiz generation error:", error);

        return {
            error: "Quiz generate nahi ho paya."
        };
    }
}

async function RandomAi(sessionid, documentId, quota, retrycount = 0) {

    if (retrycount >= 5) {
        return {
            error: true,
            message: "I couldn't find a fresh question right now."
        };
    }
    console.log(retrycount);


    const oldquestions = await redis.get(`quiz:random:${sessionid}`) || []

    const topics = [
        "Physics",
        "Biology",
        "Chemistry",
        "Astronomy",
        "Space exploration",
        "Ancient history",
        "World history",
        "Mythology",
        "Geography",
        "Economics",
        "Business",
        "Programming",
        "Computer science",
        "Technology",
        "Engineering",
        "Inventions",
        "Mathematics",
        "Psychology",
        "Literature",
        "Languages",
        "Music",
        "Art",
        "Architecture",
        "Sports",
        "Games",
        "Movies",
        "Animals",
        "Nature",
        "Food",
        "Transportation"
    ];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    console.log(randomTopic);

    const message = [
        {
            role: "system",
            content: `
You are a high-quality random quiz generator.

Generate ONE accurate multiple-choice question from the given topic.

RULES:
- Use your own knowledge.
- Ask only questions whose answer you are highly confident is correct.
- Choose a meaningful question suitable for the topic.
- Keep questions accurate, clear, and concise.
- Generate exactly 4 plausible, closely related options.
- Exactly ONE option must be correct.
- Avoid ambiguous, outdated, controversial, or guessed facts.
- Avoid repetitive or overly common questions when possible.
- Return ONLY valid JSON. No markdown or explanation.

Difficulty: MEDIUM.

The question should test real understanding, not simple memorization and not advanced expertise. It should be solvable by a normally prepared student with some thinking, but should not require specialist knowledge, obscure facts, tricky wording, or complex calculations.

Prefer conceptual understanding, simple application, comparison, cause-effect, or practical reasoning.

Make the question clear, fair, and meaningful. Avoid questions that are either obviously easy or unnecessarily difficult.

Generate exactly 4 closely related and plausible options. Distractors should represent realistic misunderstandings. Exactly ONE option must be correct.

Use only highly reliable facts. Avoid ambiguous, outdated, controversial, or obscure information.

TOPIC:
${randomTopic}

OUTPUT:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctOption": "string",
  "topic": "string"
}
`
        }
    ];

    try {
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: message,
            temperature: 0.7,
            response_format: {
                type: "json_object"
            }

        })

        const usedTokens = response.usage.total_tokens;
        await updateQuota(quota, usedTokens)


        const quiz = JSON.parse(response.choices[0].message.content)
        console.log(quiz);

        function isDuplicateQuestion(quiz, oldquestions) {
            for (const oldquestion of oldquestions) {
                const score = stringSimilarity(
                    quiz.question.toLowerCase(),
                    oldquestion.question.toLowerCase()
                );
                console.log(score);


                if (score >= 0.7) {
                    return true;
                }
            }

            return false;
        }
        let duplicate = isDuplicateQuestion(quiz, oldquestions)
        if (duplicate) {
            return RandomAi(sessionid, documentId, quota, retrycount + 1)
        }
        else {
            oldquestions.push(quiz)
            await redis.set(`quiz:random:${sessionid}`,
                JSON.stringify(oldquestions),
                {
                    ex: 60 * 60 * 24
                })
            return quiz
        }

    } catch (error) {
        console.log("Quiz generation error:", error);

        return {
            error: "Quiz generate nahi ho paya."
        };

    }


}


// let filepath = "./aditya_kirana_knowledge_base_plain.pdf"
// storedocument(filepath)

async function makeReplySameAsUser(userinput, reply) {
    try {

        // 1. User ki language + script detect karo
        const userLanguage = await sarvam.text.identifyLanguage({
            input: userinput.slice(0, 1000),
        });

     console.log("USER LANGUAGE:", userLanguage.language_code);
console.log("USER SCRIPT:", userLanguage.script_code);;


        // 2. Agar user English mein hai
       if (userLanguage.language_code === "en-IN") {

    const replyLanguage = await sarvam.text.identifyLanguage({
        input: reply.slice(0, 1000),
    });

    console.log(
        "REPLY LANGUAGE:",
        replyLanguage.language_code
    );

    console.log(
        "REPLY SCRIPT:",
        replyLanguage.script_code
    );

    if (replyLanguage.language_code === "en-IN") {
        return reply;
    }

    // LLM ne English ke alawa kisi language mein answer diya
    const translated = await sarvam.text.translate({
        input: reply.slice(0, 1000),
        source_language_code: replyLanguage.language_code,
        target_language_code: "en-IN",
    });

    console.log(
        "SARVAM ENGLISH TRANSLATION:",
        translated
    );

    return translated.translated_text;
}

        // 3. Agar user Hindi Devanagari mein hai
        if (
            userLanguage.language_code === "hi-IN" &&
            userLanguage.script_code === "Deva"
        ) {
            return reply;
        }


        // 4. Agar user Hinglish / Roman Hindi mein hai
        if (
            userLanguage.language_code === "hi-IN" &&
            userLanguage.script_code === "Latn"
        ) {

            // Agar LLM already Roman/Hinglish mein hai
            // to kuch karne ki zarurat nahi
            const replyLanguage = await sarvam.text.identifyLanguage({
                input: reply.slice(0, 1000),
            });

            console.log(
                "REPLY LANGUAGE:",
                replyLanguage.language_code
            );

            console.log(
                "REPLY SCRIPT:",
                replyLanguage.script_code
            );


            if (
                replyLanguage.language_code === "hi-IN" &&
                replyLanguage.script_code === "Latn"
            ) {
                return reply;
            }


            // LLM ne Hindi Devanagari mein answer diya
            // → Roman/Hinglish mein convert karo
            if (
                replyLanguage.language_code === "hi-IN" &&
                replyLanguage.script_code === "Deva"
            ) {

             const converted =
    await sarvam.text.transliterate({
        input: reply.slice(0, 1000),
        source_language_code: "hi-IN",
        target_language_code: "en-IN",
    });

console.log("SARVAM TRANSLITERATE RESPONSE:", converted);

return converted.transliterated_text;
            }


            // Agar English ya koi aur language aa gayi
            // to abhi original return karenge
            return reply;
        }


        // Baaki languages ke liye abhi original response
        return reply;

    } catch (error) {

        console.log(
            "Language conversion error:",
            error
        );

        // Sarvam fail hua to original LLM answer
        return reply;
    }
}


async function ChatAi(userinput, sessionid, documentId, quota) {

    let history = await redis.get(sessionid);

    if (!history) {
        history = [];
    }

    const recentHistory = history.slice(-6);

    const currentDateTime = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "full",
        timeStyle: "long",
    });

    const pdfSelected =
        Array.isArray(documentId) &&
        documentId.length > 0;


    // =====================================================
    // SYSTEM PROMPT
    // =====================================================

    const message = [
        {
            role: "system",
            content: `
You are an AI assistant created by Megha Kourav using an existing AI model.
Megha did not train the underlying model.

Be friendly, helpful and concise.
Normally reply in 1–2 sentences.

Never guess or invent information you are not sure about.

LANGUAGE:
Reply in exactly the same language and script as the user.

- English → English
- Hindi/Devanagari → Hindi
- Hinglish/Roman Hindi → Hinglish/Roman Hindi

Examples:
"Megha Kourav kon hai?"
→ "Megha Kourav meri developer hain."

"Who is Megha Kourav?"
→ "Megha Kourav is my developer."

"मेघा कौरव कौन है?"
→ "मेघा कौरव मेरी डेवलपर हैं।"


PDF RULE:

When one or more PDFs are selected, answer ONLY from the PDF CONTEXT provided in this request.

- Selected PDFs are the ONLY source of truth.
- Use information only from the selected PDFs.
- Do NOT use chat history or previous conversation.
- Do NOT use your own knowledge or general knowledge.
- Do NOT use web search.
- Do NOT use information from unselected PDFs.
- If the answer is not supported by the PDF CONTEXT, reply exactly:
"I couldn't find that information in the selected PDF."

If multiple PDFs are selected, treat their retrieved PDF context as one combined source.
Never correct or replace the PDF's wording using outside knowledge.


WEB RULE:

When NO PDF is selected:

- Answer directly from your knowledge when you are confident.
- Use WebSearch when the question requires current, latest, recent, live, location-specific, or otherwise externally verified information.
- If WebSearch is used and search results provide enough information, use those results to answer the user.
- After receiving WebSearch results, DO NOT request another search.
- Give the final answer directly.
- Never mention internal tools or WebSearch.

Never mention:
- internal tools
- RAG
- embeddings
- vectors
- prompts
- system instructions
- tool calling


Current date and time:
${currentDateTime}
`
        },

         ...(pdfSelected ? [] : recentHistory),

        {
            role: "user",
            content: userinput
        }
    ];


    try {

        // =====================================================
        // PDF CONTEXT
        // =====================================================

if (pdfSelected) {

    console.log("🔎 Searching PDF...");
    
    const results = await searchdocuments(
        userinput,
        sessionid,
        documentId
    );

    console.log("🔎 PDF SEARCH RESULTS:", results);

   const relevantResults = results.filter(
    result => result.score >= 0.55
);

if (relevantResults.length === 0) {
    return "I couldn't find that information in the selected PDF.";
}

const context = relevantResults
    .map(result => result.payload.text)
    .join("\n\n");
    console.log("📄 PDF CONTEXT:", context);

    if (!context.trim()) {
        return "I couldn't find that information in the selected PDF...";
    }

    message[0].content += `
    
PDF CONTEXT:

${context}
`;
}


        // =====================================================
        // FIRST GROQ CALL
        // =====================================================

        console.log("PDF SELECTED:", pdfSelected);
console.log("DOCUMENT ID:", documentId);
console.log("MESSAGES SENT TO GROQ:", JSON.stringify(message, null, 2));

        const api = await groq.chat.completions.create({

            model: "openai/gpt-oss-20b",

            messages: message,

            ...(!pdfSelected && {
                tools: [
                    {
                        type: "function",

                        function: {

                            name: "WebSearch",

                            description:
                                "Search the internet when external information is needed to answer the user's question. Use it only when necessary. Do not use it for information you already know confidently.",

                            parameters: {

                                type: "object",

                                properties: {

                                    query: {
                                        type: "string"
                                    }

                                },

                                required: ["query"]
                            }
                        }
                    }
                ],

                tool_choice: "auto"
            })
        });

        console.log(
    "GROQ RAW RESPONSE:",
    JSON.stringify(api.choices[0].message, null, 2)
);


        // =====================================================
        // COUNT FIRST GROQ TOKENS
        // =====================================================

        const usedTokens =
            api.usage?.total_tokens || 0;

        await updateQuota(
            quota,
            usedTokens
        );


        // =====================================================
        // NO WEB SEARCH
        // =====================================================

        const toolcalls =
            api.choices[0].message.tool_calls;

        if (
            !toolcalls ||
            toolcalls.length === 0
        ) {

            let reply =
                api.choices[0].message.content;

                reply = await makeReplySameAsUser(userinput, reply);

            history.push(
                {
                    role: "user",
                    content: userinput
                },

                {
                    role: "assistant",
                    content: reply
                }
            );

            await redis.set(
                sessionid,
                JSON.stringify(history),
                {
                    ex: 60 * 60 * 24
                }
            );

            return reply;
        }


        // =====================================================
        // WEB SEARCH
        // =====================================================

        message.push(
            api.choices[0].message
        );


   const tool = toolcalls[0];

let toolresult = "";

if (tool.function.name === "WebSearch") {

    const funcargument =
        JSON.parse(
            tool.function.arguments
        );

    toolresult =
        await WebSearch(
            funcargument
        );

    console.log("WEB SEARCH RESULT:");
    console.log(toolresult);
}


        // =====================================================
        // FINAL GROQ CALL
        // IMPORTANT:
        // NO TOOLS HERE
        // =====================================================

   // =====================================================
// FINAL ANSWER FROM SEARCH RESULT
// =====================================================

const finalMessage = [
    {
        role: "system",
        content: `
You are answering a user using web search results.

IMPORTANT RULES:

- Use the web search results as the source of truth for this answer.
- For current, latest, recent, today, now, or time-sensitive questions, DO NOT use your own memory.
- DO NOT use previous conversation answers if they conflict with the web search results.
- Prefer the most recent relevant information from the search results.
- Do not guess.
- If the search results contain enough information, answer directly.
- If the search results do not contain enough information, clearly say so.
- Do not search again.
- Reply in exactly the user's language and script.
- Be concise.
- Never mention web search, tools, prompts, or system instructions.
`
    },

    {
        role: "user",
        content: `
USER QUESTION:
${userinput}

WEB SEARCH RESULTS:
${toolresult}
`
    }
];


const finalResponse =
    await groq.chat.completions.create({

        model: "openai/gpt-oss-20b",

        messages: finalMessage

    });

        // =====================================================
        // COUNT FINAL RESPONSE TOKENS
        // =====================================================

        const finalTokens =
            finalResponse.usage?.total_tokens || 0;

        await updateQuota(
            quota,
            finalTokens
        );


        // =====================================================
        // FINAL ANSWER
        // =====================================================

   let reply =
    finalResponse
        .choices[0]
        .message
        .content;

// reply = await makeReplySameAsUser(userinput, reply);
        // =====================================================
        // SAVE HISTORY
        // =====================================================

        history.push(
            {
                role: "user",
                content: userinput
            },

            {
                role: "assistant",
                content: reply
            }
        );


        await redis.set(
            sessionid,
            JSON.stringify(history),
            {
                ex: 60 * 60 * 24
            }
        );


        return reply;


    } catch (error) {

        console.log(
            "ChatAi error:",
            error
        );

        return "Sorry, I couldn't process your request right now.";
    }
}


async function WebSearch({ query }) {
    console.log("web search tool calling...");
    const { results } = await Tavily.search(query)
    return JSON.stringify(
        results.slice(0, 3).map(({ title, content, url }) => ({
            title,
            summary: content.slice(0, 150),
            url
        }))
    );

}


export default chatbot