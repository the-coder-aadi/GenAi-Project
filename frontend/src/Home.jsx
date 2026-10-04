import { useState, useRef, useEffect } from "react";
import { v4 as uuid } from "uuid";
import {
  UploadCloud,
  FileText,
  Send,
  X,
  Menu,
  Check,
  Sparkles,
  Trash2,
  Loader2,
  Bot,
  User,
  MessageCircle,
  Brain,
  ClipboardList,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SmallToast from "./SmallToast";
import QuizResultPopup from "./QuizResultPopup";



function Home() {
  // =========================================================
  // DOCUMENT STATES
  // =========================================================
const navigate = useNavigate()
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [quiztype, setquizetype] = useState(
    () => localStorage.getItem("quizType") || null
  );
  const [isModeLoading, setIsModeLoading] = useState(false);

  const [quizResultOpen, setQuizResultOpen] = useState(false);
const [quizCorrect, setQuizCorrect] = useState(false);

const [toastOpen, setToastOpen] = useState(false);
const [toastMessage, setToastMessage] = useState("");

  function ModeSkeleton({ mode }) {
  if (mode === "chat") {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-start">
          <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
          <div className="ml-2 w-56 h-12 rounded-2xl bg-gray-200" />
        </div>

        <div className="flex justify-end">
          <div className="w-48 h-10 rounded-2xl bg-gray-200" />
        </div>

        <div className="flex justify-start">
          <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
          <div className="ml-2 w-72 h-16 rounded-2xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (mode === "quiz") {
    return (
      <div className="flex justify-start animate-pulse">
        <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />

        <div className="ml-2 w-full max-w-[650px] bg-white border border-gray-100 rounded-2xl p-5">
          <div className="w-24 h-3 bg-gray-200 rounded mb-4" />

          <div className="w-3/4 h-5 bg-gray-200 rounded mb-6" />

          <div className="space-y-2.5">
            <div className="w-full h-12 bg-gray-200 rounded-xl" />
            <div className="w-full h-12 bg-gray-200 rounded-xl" />
            <div className="w-full h-12 bg-gray-200 rounded-xl" />
            <div className="w-full h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (mode === "summary") {
    return (
      <div className="flex justify-start animate-pulse">
        <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />

        <div className="ml-2 w-full max-w-[600px] bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gray-200" />

            <div>
              <div className="w-28 h-4 bg-gray-200 rounded mb-2" />
              <div className="w-48 h-3 bg-gray-200 rounded" />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="w-full h-3 bg-gray-200 rounded" />
            <div className="w-11/12 h-3 bg-gray-200 rounded" />
            <div className="w-4/5 h-3 bg-gray-200 rounded" />
            <div className="w-full h-3 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

  // =========================================================
  // MODE STATES
  // =========================================================

  const [mode, setMode] = useState(
    () => localStorage.getItem("mode") || "chat"
  );

  const modes = [
    {
      id: "chat",
      label: "Chat",
      description: "Ask anything",
      icon: MessageCircle,
    },
    {
      id: "quiz",
      label: "Quiz",
      description: "Test your knowledge",
      icon: Brain,
    },
    {
      id: "summary",
      label: "Summary",
      description: "Summarize content",
      icon: ClipboardList,
    },
  ];

  // =========================================================
  // CHAT STATES
  // =========================================================

  const [messages, setmessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // =========================================================
  // PDF UPLOAD STATES
  // =========================================================

  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // =========================================================
  // MOBILE SIDEBAR
  // =========================================================

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSummarising, setIsSummarising] = useState(false);
  const [summaryProgress, setSummaryProgress] = useState(0);
  // =========================================================
  // REFS
  // =========================================================

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const modeRef = useRef("chat");

  // =========================================================
  // SESSION ID
  // =========================================================
  let sessionid = localStorage.getItem("chatid");

  if (!sessionid) {
    sessionid = uuid();
    localStorage.setItem("chatid", sessionid);
  }
  
  useEffect(()=>{
UsersInfo()
  },[])

  useEffect(()=>{
planinfo()
},[])

async function planinfo() {
  try {
    const api = await fetch(`${import.meta.env.VITE_API_URL}/user/planinfo/${sessionid}`)
    const res = await api.json()
    console.log(res);
     if (res.success) {
      localStorage.setItem("currentPlan", res.data.plan);

      localStorage.setItem(
        "planExpiresAt",
        res.data.planExpiresAt || ""
      );
    }
  } catch (error) {
    console.log(error);
    
  }
}

  async function UsersInfo() {
    try {
      const api = await fetch(`${import.meta.env.VITE_API_URL}/user/session`,{
        method:"POST",
        headers:{
          "Content-Type" : "application/json"
        },
        body:JSON.stringify({
          sessionId :sessionid
        })
      })
    } catch (error) {
      console.log(error);
      
    }
  }


  useEffect(() => {
    async function loadSession() {
      try {
        // =========================
        // CHAT
        // =========================

        if (mode === "chat") {
          await loadChatHistory();
          return;
        }

        // =========================
        // QUIZ
        // =========================

        if (mode === "quiz") {
          const savedQuizType =
            localStorage.getItem("quizType");

          // Quiz type hi nahi hai
          if (!savedQuizType) {
            setmessages([
              getModeWelcomeMessage("quiz")
            ]);
            return;
          }

          const history =
            await loadQuizHistory(savedQuizType);

          if (history.length > 0) {
            const historyMessages =
              history.map((quiz, index) => ({
                sender: "bot",
                type: "quiz-question",
                quiztype: savedQuizType,
                question: quiz.question,
                options: quiz.options,
                topic: quiz.topic,
                correctOption: quiz.correctOption,

                answered: true,
                selectedOption: null,
                isCorrect: null,

                showNextActions:
                  index === history.length - 1,

                time: "",
              }));

            setmessages(historyMessages);
          } else {
            setmessages([
              getModeWelcomeMessage("quiz")
            ]);
          }

          return;
        }

        // =========================
        // SUMMARY
        // =========================

        if (mode === "summary") {
          setmessages([
            getModeWelcomeMessage("summary")
          ]);
        }

      } catch (error) {
        console.log("Session history error:", error);
      }
    }

    loadSession();
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function updateDocumentSelection(documentId, selected) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/documents/${documentId}/select`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selected: selected,
          }),
        }
      );

      const data = await response.json();

      console.log("Selection updated:", data);

    } catch (error) {
      console.log("Selection update error:", error);
    }
  }

  function formatSize(bytes) {
    if (!bytes) return "";

    const kb = bytes / 1024;

    return kb > 1024
      ? `${(kb / 1024).toFixed(1)} MB`
      : `${Math.round(kb)} KB`;
  }

  // =========================================================
  // SELECTED DOCUMENTS
  // =========================================================

  const selectedDocs = documents.filter((doc) =>
    selectedDocIds.includes(doc.id)
  );

  const selectedDocLabel =
    selectedDocs.length === 0
      ? "General mode"
      : selectedDocs.length === 1
        ? selectedDocs[0].name
        : `${selectedDocs.length} PDFs selected`;

  // =========================================================
  // MODE WELCOME MESSAGE
  // =========================================================

  function getModeWelcomeMessage(currentMode) {
    const selectedDocuments = documents.filter((doc) =>
      selectedDocIds.includes(doc.id)
    );

    const selectedNames = selectedDocuments
      .map((doc) => doc.name)
      .join(", ");

    // -------------------------------------------------------
    // QUIZ
    // -------------------------------------------------------

    if (currentMode === "quiz") {
      return {
        sender: "bot",
        type: "quiz-options",
        text: "Great choice! 🧠 How would you like to start your quiz?",
        time: formatTime(new Date()),
      };
    }

    // -------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------

    if (currentMode === "summary") {

      if (selectedDocIds.length === 0) {
        return {
          sender: "bot",
          type: "summary-welcome",
          text: "📝 Please Select one pdf.",
          showStartSummaryButton: false,
          time: formatTime(new Date()),
        };
      }

      if (selectedDocIds.length > 1) {
        return {
          sender: "bot",
          type: "summary-welcome",
          text: "📝 Please Select only one pdf.",
          showStartSummaryButton: false,
          time: formatTime(new Date()),
        };
      }

      return {
        sender: "bot",
        type: "summary-welcome",
        text: `Sure! 📝 I’m ready to summarize your selected PDF: ${selectedNames}.`,
        showStartSummaryButton: true,
        time: formatTime(new Date()),
      };
    }

    // -------------------------------------------------------
    // CHAT
    // -------------------------------------------------------

    return {
      sender: "bot",
      type: "chat-welcome",
      text:
        selectedDocIds.length > 0
          ? `Hi! 👋 I’m your AI assistant. I’m currently answering based on the selected PDF${selectedDocIds.length > 1 ? "s" : ""
          }: ${selectedNames}.`
          : "Hi! 👋 I’m your AI assistant. Feel free to ask me anything, and I’ll do my best to help you.",
      time: formatTime(new Date()),
    };
  }


  async function loadChatHistory() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/session/${sessionid}?mode=chat`
      );

      const data = await response.json();

      if (data.success && data.history.length > 0) {
        setmessages(
          data.history.map(item => ({
            sender: item.role === "user" ? "user" : "bot",
            text: item.content,
            time: item.time || ""
          }))
        );
      } else {
        setmessages([
          getModeWelcomeMessage("chat")
        ]);
      }

    } catch (error) {
      console.log("Chat history load error:", error);

      setmessages([
        getModeWelcomeMessage("chat")
      ]);
    }
  }
  // =========================================================
  // HANDLE MODE CHANGE
  // =========================================================

 async function handleModeChange(newMode) {
  modeRef.current = newMode;

  setIsModeLoading(true);
  setMode(newMode);
  localStorage.setItem("mode", newMode);

  setInput("");
  setIsTyping(false);

  if (newMode === "quiz") {
    setquizetype(null);

    setmessages([
      {
        sender: "bot",
        type: "quiz-options",
        text: "Great choice! 🧠 How would you like to start your quiz?",
        time: formatTime(new Date()),
      },
    ]);

    setIsModeLoading(false);
    return;
  }

  if (newMode === "summary") {
    setmessages([]);
    return;
  }

  // Chat
  await loadChatHistory();
  setIsModeLoading(false);
}

  // =========================================================
  // INITIAL CHAT SCREEN
  // =========================================================

  // // =========================================================
  // // DOCUMENT CHANGE
  // // =========================================================
// useEffect(() => {
//   if (mode === "summary") {
//     return;
//   }

//   if (mode === "quiz") {
//     return;
//   }

//   loadChatHistory();
// }, [mode, selectedDocIds, documents]);

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  // =========================================================
  // FILE VALIDATION
  // =========================================================

function validateAndSetFile(file) {
  if (file && file.type === "application/pdf") {
    setPdfFile(file);
  } else {
    setToastMessage("Please select a PDF file.");
    setToastOpen(true);
  }
}
  // =========================================================
  // FILE SELECT
  // =========================================================

  function handlePdfUpload(e) {
    validateAndSetFile(e.target.files?.[0]);
  }

  // =========================================================
  // DRAG & DROP
  // =========================================================

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);

    validateAndSetFile(e.dataTransfer.files?.[0]);
  }



  // =========================================================
  // PDF UPLOAD
  // =========================================================

  async function uploadPdf() {
    if (!pdfFile) return;

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("pdf", pdfFile);
      formData.append("sessionid", sessionid);

      const api = await fetch(`${import.meta.env.VITE_API_URL}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const res = await api.json();

      if (res.success) {
        const newDoc = {
          id: res.documentId,
          name: pdfFile.name,
          size: pdfFile.size,
          uploadedAt: new Date(),
        };

        setDocuments((prev) => [newDoc, ...prev]);


        setPdfFile(null);
      } else {
        alert(res.message || "PDF upload failed");
      }
    } catch (error) {
      console.log(
        error,
        "error aa raha hai PDF upload karne par"
      );

      alert(
        "Could not reach the server. Is the backend running?"
      );
    } finally {
      setUploading(false);
    }
  }

  // =========================================================
  // REMOVE DOCUMENT
  // =========================================================

async function removeDocument(documentId) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/documents/${sessionid}/${documentId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!data.success) {
      console.log("Document delete failed:", data.message);
      return;
    }

    // Frontend se document remove
    setDocuments((prev) =>
      prev.filter((doc) => doc.id !== documentId)
    );

    // Selected hai to selection se bhi hatao
    setSelectedDocIds((prev) =>
      prev.filter((id) => id !== documentId)
    );

  } catch (error) {
    console.log("Document delete error:", error);
  }
}

  async function loadQuizHistory(type) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/session/${sessionid}?mode=quiz&quizType=${type}`
      );

      const data = await response.json();

      console.log("Quiz history:", data);

      return data.history || [];

    } catch (error) {
      console.log("Quiz history load error:", error);

      return [];
    }
  }

  async function loadDocuments() {
    try {
       console.log("FRONTEND SESSION ID:", sessionid);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/documents/${sessionid}`
      );

      const data = await response.json();

      console.log("Documents from MongoDB:", data);

      if (data.success) {

        // PDFs frontend mein load karo
        setDocuments(
          data.documents.map((doc) => ({
            id: doc.documentId,
            name: doc.name,
            size: doc.size,
            cloudinaryUrl: doc.cloudinaryUrl,
          }))
        );

        // MongoDB se selected PDFs nikalo
        const selectedIds = data.documents
          .filter((doc) => doc.selected === true)
          .map((doc) => doc.documentId);

        // Selected PDFs ko frontend state mein restore karo
        setSelectedDocIds(selectedIds);
      }

    } catch (error) {
      console.log("Documents load error:", error);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);
  // =========================================================
  // START QUIZ
  // =========================================================

  async function handleQuizStart(type) {
  if (type === "pdf" && selectedDocIds.length === 0) {
  setToastMessage("Please select at least one PDF before starting the quiz.");
  setToastOpen(true);
  return;
}

    setquizetype(type);
    localStorage.setItem("quizType", type);

    const history = await loadQuizHistory(type);

    console.log("Loaded quiz history:", history);

    if (history.length > 0) {
      console.log("Quiz history mil gayi:", history);

      const historyMessages = history.map((quiz, index) => ({
        sender: "bot",
        type: "quiz-question",

        quiztype: type,

        question: quiz.question,

        options: quiz.options,

        topic: quiz.topic,

        correctOption: quiz.correctOption,

        // Purani questions already answered maanenge
        answered: true,

        selectedOption: null,

        isCorrect: null,

        // Sirf LAST question par buttons dikhenge
        showNextActions: index === history.length - 1,

        time: "",
      }));

      setmessages(historyMessages);

      return;
    }

    // Remove quiz option card
    setmessages((prev) =>
      prev.filter(
        (message) => message.type !== "quiz-options"
      )
    );

    // Add selected option as user message
    setmessages((prev) => [
      ...prev,
      {
        sender: "user",
        text:
          type === "pdf"
            ? "Start Quiz from PDF"
            : "Start Quiz Random",
        time: formatTime(new Date()),
      },
    ]);

    // Ask backend for first question
    await sendmsg(type);
  }

  // =========================================================
  // HANDLE QUIZ ANSWER
  // =========================================================

  function handleQuizAnswer(
    messageIndex,
    selectedOption
  ) {
    const targetMessage = messages[messageIndex];

    // Safety check
    if (
      !targetMessage ||
      targetMessage.type !== "quiz-question"
    ) {
      return;
    }

    // Already answered -> don't allow second click
    if (targetMessage.answered) {
      return;
    }

    const correctOption = targetMessage.correctOption;

    // Exact match
    const isCorrect =
      selectedOption === correctOption;

    // Browser alert
  setQuizCorrect(isCorrect);
  setQuizResultOpen(true);

    // Update this question permanently
    setmessages((prev) =>
      prev.map((message, index) => {
        if (index !== messageIndex) {
          return message;
        }

        return {
          ...message,
          answered: true,
          selectedOption: selectedOption,
          isCorrect: isCorrect,
          showNextActions: true,
        };
      })
    );
  }
  async function handleNextQuizQuestion() {
    setmessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        showNextActions: false,
      }))
    );

    await sendmsg(quiztype);
  }
  function handleStopQuiz() {
    setquizetype(null);
    setIsTyping(false);
    setInput("");

    setMode("quiz");

    setmessages([
      getModeWelcomeMessage("quiz")
    ]);

  }

  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [quotaReason, setQuotaReason] = useState(null);
  const [quotaSeconds, setQuotaSeconds] = useState(0);
  const [summaryWaitingForQuota, setSummaryWaitingForQuota] = useState(false);

  useEffect(() => {
    if (!quotaBlocked || quotaSeconds <= 0) return;

    const timer = setInterval(() => {
      setQuotaSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setQuotaBlocked(false);
          setQuotaReason(null);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quotaBlocked, quotaSeconds]);

  function formatQuotaTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }

    return `${minutes}m ${secs}s`;
  }

 async function startSummarisation() {
  setIsSummarising(true);
  setIsTyping(true);

  const summaryDocument = documents.find(
    doc => doc.id === selectedDocIds[0]
  );

  const summaryDocumentName =
    summaryDocument?.name || "selected PDF";

  try {
    let offset = 0;

    while (true) {
      const api = await fetch(
        `${import.meta.env.VITE_API_URL}/summaries`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            sessionid,
            documentId: selectedDocIds[0],
            offset
          })
        }
      );

      const res = await api.json();

      console.log("Summary response:", res);

      // =========================
      // QUOTA HIT
      // =========================

      if (!res.success && res.quotaExceeded) {
        const seconds = Math.max(
          1,
          res.remainingSeconds || 1
        );

            setIsTyping(false);
        setQuotaBlocked(true);
        setQuotaReason(res.reason);
        setQuotaSeconds(seconds);
        setSummaryWaitingForQuota(true);

        setmessages(prev => {
          const alreadyShown = prev.some(
            message => message.type === "summary-retry"
          );

          if (alreadyShown) {
            return prev;
          }

          return [
            ...prev,
            {
              sender: "bot",
              type: "summary-retry",
              text: res.message,
              quotaBlocked: true,
              quotaReason: res.reason,
              time: formatTime(new Date())
            }
          ];
        });

        // Quota khatam hone tak wait
        await new Promise(resolve =>
          setTimeout(
            resolve,
            (seconds + 1) * 1000
          )
        );

        // Quota ke baad same loop dobara chalega
        continue;
      }

      // =========================
      // SUCCESS
      // =========================
 setIsTyping(true);
      setQuotaBlocked(false);
      setQuotaReason(null);
      setQuotaSeconds(0);
      setSummaryWaitingForQuota(false);

      // Waiting message hata do
      setmessages(prev =>
        prev.filter(
          message => message.type !== "summary-retry"
        )
      );

      const result = res.summary;

      if (offset === 0) {
  setmessages(prev => [
    ...prev,
    {
      sender: "bot",
      type: "summary-status",
      text: `Summarisation started for "${summaryDocumentName}".`,
      time: formatTime(new Date())
    }
  ]);
}

      // =========================
      // PROGRESS
      // =========================

      if (result?.progress !== undefined) {
        setSummaryProgress(result.progress);
      }

      // =========================
      // SUMMARY SHOW
      // =========================

      if (result?.summary) {
        setmessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: result.summary,
            time: formatTime(new Date())
          }
        ]);
      }

      // =========================
      // PDF COMPLETE
      // =========================

    if (result?.completed) {

  // Start Summarisation button ko immediately hide karo
 setmessages(prev =>
  prev.filter(message => message.type !== "summary-welcome")
);

  setmessages(prev => [
    ...prev,
    {
      sender: "bot",
      type: "summary-status",
      text: `Summarisation completed for "${summaryDocumentName}".`,
      time: formatTime(new Date())
    },
    {
      sender: "bot",
      type: "clear-summary",
      text: "Remove All Your Summary.",
      documentId: selectedDocIds[0],
      time: formatTime(new Date())
    }
  ]);

  console.log("✅ PDF SUMMARY FINISHED");

  break;
}

      // =========================
      // NEXT CHUNKS
      // =========================

      offset = result.nextOffset;

      console.log(
        "⏳ Next 2 chunks 1 minute baad..."
      );

      await new Promise(resolve =>
        setTimeout(resolve, 60 * 1000)
      );
    }

  } catch (error) {
    console.log("Summary error:", error);

  } finally {
    setIsSummarising(false);
    setIsTyping(false);
    setSummaryWaitingForQuota(false);
  }
}

  async function loadSummaries() {
    try {
      if (!selectedDocIds.length) {

        const welcome = getModeWelcomeMessage("summary");

        setmessages(welcome ? [welcome] : []);

        return;
      }


      const documentId = selectedDocIds[0];

      const selectedDocument = documents.find(
        doc => doc.id === documentId
      );

      const pdfName = selectedDocument?.name || "Selected PDF";

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/summaries/${sessionid}/${documentId}`
      );

      const data = await response.json();

      if (!data.success) return;

      if (data.summaries.length === 0) {
        const welcome = getModeWelcomeMessage("summary");

        setmessages(welcome ? [welcome] : []);

        return;
      }

      const pdfMessage = {
        sender: "bot",
        type: "summary-status",
        text: `Summary of "${pdfName}"`,
        time: formatTime(new Date())
      };

      const savedMessages = data.summaries.map(summary => ({
        sender: "bot",
        text: summary.text,
        time: formatTime(new Date(summary.createdAt))
      }));

      setmessages([
        pdfMessage,
        ...savedMessages,
        {
          sender: "bot",
          type: "clear-summary",
          text: "Remove All Your Summary.",
          documentId: documentId,
          time: formatTime(new Date())
        }
      ]);

    } catch (error) {
      console.log("Summary load error:", error);
    }
  }

 useEffect(() => {
  if (mode !== "summary") return;

  async function loadSummaryData() {
    setIsModeLoading(true);

    await loadSummaries();

    setIsModeLoading(false);
  }

  loadSummaryData();
}, [mode, selectedDocIds, documents]);
  // ========================================================
  // SEND MESSAGE
  // =========================================================

  async function sendmsg(selectedQuizType = quiztype) {
    // Chat/Summary mode
   if (isTyping || quotaBlocked) {
    return;
  }

  // Chat/Summary mode
  if (mode !== "quiz" && !input.trim()) {
    return;
  }

    const userMessage = input;

    // -------------------------------------------------------
    // NORMAL CHAT MESSAGE
    // -------------------------------------------------------

    if (mode !== "quiz") {
      setmessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: userMessage,
          time: formatTime(new Date()),
        },
      ]);

      setInput("");
    }

    setIsTyping(true);

    try {
      const api = await fetch(
        `${import.meta.env.VITE_API_URL}/sendmsg`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            query:
              mode === "quiz"
                ? null
                : userMessage,

            sessionid: sessionid,

            documentId: selectedDocIds,

            mode: mode,

            quizType: selectedQuizType,
          }),
        }
      );

      const res = await api.json();

      console.log("Backend response:", res);

      if (!res.success && res.quotaExceeded) {
        // let seconds = 0;

        // if (
        //   res.reason === "requests_per_minute" ||
        //   res.reason === "tokens_per_minute"
        // ) {
        //   seconds = 60;
        // }

        // if (
        //   res.reason === "requests_per_day" ||
        //   res.reason === "tokens_per_day"
        // ) {
        //   seconds = 24 * 60 * 60;
        // }

        setQuotaBlocked(true);
        setQuotaReason(res.reason);
        setQuotaSeconds(res.remainingSeconds);

        // Quiz ke liye retry message
        if (mode === "quiz") {
          setmessages((prev) => [
            ...prev,
            {
              sender: "bot",
              type: "quiz-retry",
              text: res.message,
              quiztype: selectedQuizType,
              quotaBlocked: true,
              quotaReason: res.reason,
              time: formatTime(new Date()),
            },
          ]);
        }

        return;
      }

      // =====================================================
      // CHAT RESPONSE
      // =====================================================

      if (
        res.success &&
        res.mode === "chat"
      ) {
        setmessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: res.aimsg,
            time: formatTime(new Date()),
          },
        ]);
      }

      // =====================================================
      // SUMMARY RESPONSE
      // =====================================================

      else if (
        res.success &&
        res.mode === "summary"
      ) {
        setmessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: res.aimsg,
            time: formatTime(new Date()),
          },
        ]);
      }

      // =====================================================
      // QUIZ RESPONSE
      // =====================================================

      else if (
        res.success &&
        res.mode === "quiz"
      ) {
        /*
          Backend expected:

          {
            success: true,
            mode: "quiz",
            question: "...",
            options: [
              "...",
              "...",
              "...",
              "..."
            ],
            correctOption: "..."
          }

          Also supports:

          {
            success: true,
            mode: "quiz",
            quiz: {
              question: "...",
              options: [...],
              correctOption: "..."
            }
          }
        */

        if (res.type === "retry") {

          setmessages((prev) => [
            ...prev,
            {
              sender: "bot",
              type: "quiz-retry",
              text: res.aimsg,
              quiztype: res.quizType,
              time: formatTime(new Date()),
            },
          ]);

          return;
        }

        else if (res.type === "question") {

          const quizData =
            res.quiz || res.aimsg || res;

          const question =
            quizData.question;

          const options =
            quizData.options;

          const correctOption =
            quizData.correctOption;

          const topic = quizData.topic

          // Validate backend data
          if (
            question &&
            Array.isArray(options) &&
            options.length > 0 &&
            correctOption
          ) {
            setmessages((prev) => [
              ...prev,
              {
                sender: "bot",

                type: "quiz-question",

                quiztype: res.quizType,

                question: question,

                options: options,

                topic: topic,

                correctOption:
                  correctOption,

                // Answer state
                answered: false,

                selectedOption: null,

                isCorrect: null,

                showNextActions: false,

                time: formatTime(
                  new Date()
                ),
              },
            ]);
          }
        } else {
          console.error(
            "Invalid quiz response:",
            res
          );

          setmessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text:
                "I received an invalid quiz question from the server. Please try again.",
              time: formatTime(
                new Date()
              ),
            },
          ]);
        }
      }

      // =====================================================
      // QUIZ ERROR
      // =====================================================

  else if (
  !res.success &&
  res.mode === "quiz"
) {
  setToastMessage(
    res.message ||
    "Please select at least one PDF or choose random."
  );

  setToastOpen(true);
}

      // =====================================================
      // GENERAL ERROR
      // =====================================================

      else {
        setmessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text:
              "Sorry, I couldn't process that. Please try again.",
            time: formatTime(
              new Date()
            ),
          },
        ]);
      }
    } catch (error) {
      console.log(
        error,
        "error aa raha hai msg send karne par"
      );

      setmessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            "I'm having trouble reaching the server right now.",
          time: formatTime(
            new Date()
          ),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  async function clearSummary(documenId) {
    try {
      const api = await fetch(`${import.meta.env.VITE_API_URL}/clearsummary/${sessionid}/${documenId}`, {
        method: "DELETE"
      })
      const res = await api.json()
      console.log(res);
      if (res.success) {
        loadSummaries()
      }

    } catch (error) {
      console.log(error);

    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="h-screen w-full flex bg-[#F7F7FB] font-sans overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

        .font-sans {
          font-family: 'Inter', system-ui, sans-serif;
        }

        .font-display {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        }

        ::-webkit-scrollbar {
          width: 7px;
          height: 7px;
        }

        ::-webkit-scrollbar-thumb {
          background: #D9D9E8;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .msg-in {
          animation: fadeUp .28s ease-out;
        }

        @keyframes bounce-dot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: .4;
          }

          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        .dot {
          animation: bounce-dot 1.1s infinite;
        }

        .dot:nth-child(2) {
          animation-delay: .15s;
        }

        .dot:nth-child(3) {
          animation-delay: .3s;
        }

        @keyframes modeIn {
          from {
            opacity: 0;
            transform: scale(.97);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .mode-in {
          animation: modeIn .2s ease-out;
        }

        .scrollbar-none {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* ===================================================== */}
      {/* MOBILE SIDEBAR BACKDROP                               */}
      {/* ===================================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===================================================== */}
      {/* SIDEBAR                                                */}
      {/* ===================================================== */}

      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-full w-[85%] max-w-[320px] lg:w-80 bg-white border-r border-gray-100 flex flex-col shadow-xl lg:shadow-none transition-transform duration-300 ${sidebarOpen
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Sidebar header */}

        <div className="px-5 pt-6 pb-5 border-b border-gray-100 flex items-center justify-between">
         <div className="flex items-center gap-2.5">
  <img
    src="/medhaai.png"
    alt="Medhā AI"
    className="w-10 h-10 object-contain rounded-xl"
  />

            <div>
              <h1 className="font-display font-bold text-[15px] text-gray-900 leading-none">
               Medha Ai
              </h1>

              <p className="text-[11px] text-gray-400 mt-1">
           Your AI Study Saathi
              </p>
            </div>
          </div>

          <button
            className="lg:hidden text-gray-400 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* ================================================= */}
        {/* UPLOAD DROPZONE                                   */}
        {/* ================================================= */}

        <div className="px-5 pt-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() =>
              setDragActive(false)
            }
            onDrop={handleDrop}
            onClick={() =>
              fileInputRef.current?.click()
            }
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 flex flex-col items-center text-center gap-2 transition-colors ${dragActive
              ? "border-indigo-400 bg-indigo-50/60"
              : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
              }`}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud size={18} />
            </div>

        <p className="w-full truncate text-[13px] font-medium text-gray-700">
  {pdfFile 
    ? pdfFile.name 
    : "Drop a PDF or click to browse"} 
</p>

            <p className="text-[11px] text-gray-400">
              PDF only, up to 20MB
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
          </div>

          {pdfFile && (
            <button
              onClick={uploadPdf}
              disabled={uploading}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white text-[13px] font-semibold py-2.5 shadow-md shadow-indigo-200 transition"
            >
              {uploading ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadCloud size={15} />
                  Upload & Index
                </>
              )}
            </button>
          )}
        </div>

        {/* ================================================= */}
        {/* DOCUMENT LIST                                     */}
        {/* ================================================= */}

        <div className="flex items-center justify-between px-5 pt-6 pb-2">
          <span className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
            Your documents
          </span>

          <span className="text-[11px] text-gray-300">
            {documents.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
          {documents.length === 0 && (
            <div className="text-center px-4 pt-6">
              <p className="text-[12.5px] text-gray-400 leading-relaxed">
                No documents yet. Upload one to switch into
                document-only mode.
              </p>
            </div>
          )}

          {documents.map((doc) => {
            const active =
              selectedDocIds.includes(doc.id);

            return (
              <div
                key={doc.id}
                onClick={() => {
                  const newSelected = !selectedDocIds.includes(doc.id);

                  setSelectedDocIds((prev) =>
                    newSelected
                      ? [...prev, doc.id]
                      : prev.filter((id) => id !== doc.id)
                  );

                  updateDocumentSelection(doc.id, newSelected);
                }}
                className={`group cursor-pointer rounded-xl px-3 py-2.5 flex items-center gap-3 border transition-colors ${active
                  ? "bg-indigo-50 border-indigo-200"
                  : "border-transparent hover:bg-gray-50"
                  }`}
              >
                <div
                  className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${active
                    ? "bg-indigo-600 text-white"
                    : "bg-red-50 text-red-500"
                    }`}
                >
                  <FileText size={15} />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[13px] truncate font-medium ${active
                      ? "text-indigo-900"
                      : "text-gray-700"
                      }`}
                  >
                    {doc.name}
                  </p>

                  <p className="text-[10.5px] pt-1 text-gray-400">
                    {formatSize(doc.size)} 
                   
                  </p>
                </div>

                {active ? (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Check size={12} />
                  </div>
                ) : (
                  <Trash2 
  size={14} 
  className="text-red-300 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
  onClick={(e) => {
    e.stopPropagation();
    removeDocument(doc.id);
  }}
/>
                )}
              </div>
            );
          })}
        </div>

<button
  onClick={() => navigate("/plans")}
  className="
    mt-4 mx-auto
    mb-2
    flex items-center justify-center gap-2
    px-5 py-2
    rounded-lg
    bg-gradient-to-r from-indigo-500 to-violet-500
    text-white text-sm font-semibold
    shadow-sm
    hover:from-indigo-600 hover:to-violet-600
    hover:shadow-md
    transition-all duration-200
  "
>
  <Sparkles size={14} />
  <span>Upgrade Plan</span>
</button>


        {/* Sidebar footer */}

        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-[10.5px] text-gray-400 leading-relaxed">
            {selectedDocs.length > 0
              ? "Responses are grounded only in the selected document."
              : "No document selected — responses use general knowledge."}
          </p>
        </div>
      </aside>

      {/* ===================================================== */}
      {/* CHAT COLUMN                                            */}
      {/* ===================================================== */}

      <div className="flex-1 flex flex-col min-w-0">
        {/* ================================================= */}
        {/* HEADER                                            */}
        {/* ================================================= */}

      <div className="min-h-16 shrink-0 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 py-2.5">

  {/* LEFT: Menu + Sales Assistant */}
  <div className="flex items-center gap-2 min-w-0 shrink-0">

    <button
      className="lg:hidden text-gray-500 hover:text-gray-800 shrink-0"
      onClick={() => setSidebarOpen(true)}
    >
      <Menu size={22} />
    </button>

    <div className="shrink-0">
      <h2 className="font-display font-semibold text-[15px] text-gray-900 truncate">
         AI Study Saathi
      </h2>

      <p className="text-[11px] text-emerald-600 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Online
      </p>
    </div>

  </div>


  {/* RIGHT: Mode Selector */}
  <div className="min-w-0 max-w-full overflow-hidden">

    <div className="flex items-center gap-1.5 max-w-full overflow-x-auto scrollbar-none">

      <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-xl border border-gray-200/70 shrink-0">

        {modes.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleModeChange(item.id)}
              title={item.description}
              className={`
                group relative
                flex items-center justify-center
                min-[450px]:gap-1.5
                px-2.5 sm:px-3
                py-1.5
                rounded-lg
                text-[11.5px]
                font-semibold
                transition-all duration-200
                whitespace-nowrap

                ${
                  active
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-gray-200/80"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white/70"
                }
              `}
            >

              <Icon
                size={14}
                className={`
                  shrink-0 transition-colors
                  min-[400px]:w-[14px] min-[400px]:h-[14px]
                  ${
                    active
                      ? "text-indigo-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  }
                `}
              />

              {/* TEXT ONLY ON TABLET/DESKTOP */}
              <span className="hidden min-[450px]:inline">
                {item.label}
              </span>

              {/* DOT ONLY ON TABLET/DESKTOP */}
              {active && (
                <span className="hidden min-[450px]:block ml-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm" />
              )}

            </button>
          );
        })}

      </div>

    </div>

  </div>






          {/* Selected document */}

          <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-gray-200 pl-1 pr-3 py-1 max-w-[230px] shrink-0">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${selectedDocs.length > 0
                ? "bg-indigo-100 text-indigo-600"
                : "bg-gray-100 text-gray-400"
                }`}
            >
              <FileText size={12} />
            </span>

            <span className="text-[12px] text-gray-600 truncate">
              {selectedDocLabel}
            </span>
          </div>
        </div>

        {/* ================================================= */}
        {/* MESSAGE SCREEN                                    */}
        {/* ================================================= */}

        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-5 space-y-4">

  {isModeLoading ? (
    <ModeSkeleton mode={mode} />
  ) : (
    messages.map((message, ind) => {
            if (!message) return null;

            const isUser =
              message.sender === "user";

            // =================================================
            // QUIZ START OPTIONS
            // =================================================

            if (
              mode === "quiz" &&
              message.type === "quiz-options"
            ) {
              return (
                <div
                  key={ind}
                  className="flex justify-start msg-in"
                >
                  <div className="flex items-end gap-2 max-w-[95%] sm:max-w-[560px] min-w-0">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 text-white flex items-center justify-center">
                      <Bot size={13} />
                    </div>

                    <div className="flex flex-col items-start">
                      <div className="bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm w-full min-w-0 max-w-full">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Brain size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-gray-900">
                              Ready for a quiz?
                            </p>

                            <p className="text-[12px] truncate font-semibold text-gray-900 break-all whitespace-normal">
                              {message.text}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* PDF QUIZ */}

                          <button
                            type="button"
                            onClick={() =>
                              handleQuizStart(
                                "pdf"
                              )
                            }
                            className="group flex items-center gap-3 text-left rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-200 px-3 py-3 transition-all duration-200"
                          >
                            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <FileText size={16} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] font-semibold text-indigo-900">
                                Start Quiz from PDF
                              </p>

                              <p className="text-[10.5px] text-indigo-600/70 mt-0.5">
                                Use your selected documents
                              </p>
                            </div>

                            <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                              →
                            </span>
                          </button>

                          {/* RANDOM QUIZ */}

                          <button
                            type="button"
                            onClick={() =>
                              handleQuizStart(
                                "random"
                              )
                            }
                            className="group flex items-center gap-3 text-left rounded-xl border border-violet-100 bg-violet-50/50 hover:bg-violet-50 hover:border-violet-200 px-3 py-3 transition-all duration-200"
                          >
                            <div className="w-9 h-9 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <Sparkles size={16} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] font-semibold text-violet-900">
                                Start Quiz Random
                              </p>

                              <p className="text-[10.5px] text-violet-600/70 mt-0.5">
                                Test yourself on anything
                              </p>
                            </div>

                            <span className="text-violet-400 group-hover:translate-x-0.5 transition-transform">
                              →
                            </span>
                          </button>
                        </div>
                      </div>

                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {message.time}
                      </span>
                    </div>
                  </div>
    <SmallToast
  isOpen={toastOpen}
  message={toastMessage}
  onClose={() => setToastOpen(false)}
/>
                </div>
              );
            }

            // =================================================
            // QUIZ QUESTION CARD
            // =================================================
            if (
              mode === "quiz" &&
              message.type === "quiz-retry"
            ) {
              return (
                <div
                  key={ind}
                  className="flex justify-start msg-in"
                >
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-sm text-gray-700 mb-3">
                      {message.text}
                    </p>

                    <button
                      type="button"
                      disabled={quotaBlocked}
                      onClick={() => {
                        if (quotaBlocked) return;

                        setmessages((prev) =>
                          prev.filter((_, i) => i !== ind)
                        );

                        sendmsg(message.quiztype);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold ${quotaBlocked
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-indigo-600 text-white"
                        }`}
                    >
                      {quotaBlocked
                        ? `Try Again in ${formatQuotaTime(quotaSeconds)}`
                        : "Try Again"}
                    </button>
                  </div>
                </div>
              );
            }

            if (
              mode === "quiz" &&
              message.type === "quiz-question"
            ) {
              return (
                <div
                  key={ind}
                  className="flex justify-start msg-in"
                >
                  <div className="flex items-end gap-2 w-full max-w-[95%] sm:max-w-[650px]">
                    {/* BOT ICON */}

                    <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 text-white flex items-center justify-center">
                      <Bot size={13} />
                    </div>

                    <div className="flex flex-col items-start w-full">
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm p-4 sm:p-5 shadow-sm w-full">
                        {/* QUESTION HEADER */}

                        <div className="flex items-start gap-3 mb-5">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Brain size={19} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                                Quiz type {message.topic}
                              </span>

                              {message.answered && (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${message.isCorrect
                                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                                    : "bg-red-50 text-red-600 border border-red-100"
                                    }`}
                                >
                                  {message.isCorrect ? (
                                    <>
                                      <CircleCheck
                                        size={11}
                                      />
                                      Correct
                                    </>
                                  ) : (
                                    <>
                                      <CircleX
                                        size={11}
                                      />
                                      Incorrect
                                    </>
                                  )}
                                </span>
                              )}
                            </div>

                            <p className="text-[14px] sm:text-[15px] font-semibold text-gray-900 leading-relaxed mt-1.5">
                              {message.question}
                            </p>
                          </div>
                        </div>

                        {/* OPTIONS */}

                        <div className="space-y-2.5">
                          {message.options.map(
                            (
                              option,
                              optionIndex
                            ) => {
                              const isSelected =
                                message.selectedOption ===
                                option;

                              const isCorrectOption =
                                option ===
                                message.correctOption;

                              let optionClass =
                                "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300";

                              let iconClass =
                                "bg-white border-gray-300 text-gray-400";

                              let textClass =
                                "text-gray-700";

                              // -------------------------------------------------
                              // AFTER ANSWER
                              // -------------------------------------------------

                              if (
                                message.answered
                              ) {
                                if (
                                  isCorrectOption
                                ) {
                                  // Correct answer = BLUE
                                  optionClass =
                                    "border-blue-200 bg-blue-50";

                                  iconClass =
                                    "bg-blue-600 border-blue-600 text-white";

                                  textClass =
                                    "text-blue-900";
                                } else {
                                  // Every wrong option = RED-ish
                                  optionClass =
                                    "border-red-100 bg-red-50/70";

                                  iconClass =
                                    "bg-red-100 border-red-200 text-red-500";

                                  textClass =
                                    "text-red-800";
                                }
                              }

                              // -------------------------------------------------
                              // CURRENT SELECTED WRONG OPTION
                              // -------------------------------------------------

                              if (
                                message.answered &&
                                isSelected &&
                                !isCorrectOption
                              ) {
                                optionClass =
                                  "border-red-300 bg-red-50";

                                iconClass =
                                  "bg-red-500 border-red-500 text-white";

                                textClass =
                                  "text-red-900";
                              }

                              return (
                                <button
                                  key={optionIndex}
                                  type="button"
                                  disabled={
                                    message.answered
                                  }
                                  onClick={() =>
                                    handleQuizAnswer(
                                      ind,
                                      option
                                    )
                                  }
                                  className={`w-full flex items-center gap-3 text-left rounded-xl border px-3.5 py-3 transition-all duration-200 ${message.answered
                                    ? "cursor-not-allowed"
                                    : "cursor-pointer"
                                    } ${optionClass}`}
                                >
                                  {/* OPTION LETTER */}

                                  <div
                                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 text-[12px] font-bold transition-colors ${iconClass}`}
                                  >
                                    {message.answered &&
                                      isCorrectOption ? (
                                      <Check
                                        size={15}
                                      />
                                    ) : message.answered &&
                                      isSelected &&
                                      !isCorrectOption ? (
                                      <X
                                        size={15}
                                      />
                                    ) : (
                                      String.fromCharCode(
                                        65 +
                                        optionIndex
                                      )
                                    )}
                                  </div>

                                  {/* OPTION TEXT */}

                                  <span
                                    className={`flex-1 text-[12.5px] sm:text-[13px] font-medium leading-relaxed ${textClass}`}
                                  >
                                    {option}
                                  </span>

                                  {/* RIGHT INDICATOR */}

                                  {message.answered &&
                                    isCorrectOption && (
                                      <span className="text-[10px] font-bold text-blue-600 shrink-0">
                                        Correct
                                      </span>
                                    )}

                                  {message.answered &&
                                    isSelected &&
                                    !isCorrectOption && (
                                      <span className="text-[10px] font-bold text-red-600 shrink-0">
                                        Your answer
                                      </span>
                                    )}
                                </button>
                              );
                            }
                          )}
                        </div>



                        {/* RESULT MESSAGE */}

                        {/* {message.answered && (
                          <div
                            className={`mt-4 rounded-xl px-3.5 py-3 border ${
                              message.isCorrect
                                ? "bg-blue-50 border-blue-100"
                                : "bg-red-50 border-red-100"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {message.isCorrect ? (
                                <CircleCheck
                                  size={16}
                                  className="text-blue-600 shrink-0 mt-0.5"
                                />
                              ) : (
                                <CircleX
                                  size={16}
                                  className="text-red-500 shrink-0 mt-0.5"
                                />
                              )}

                            </div>
                          </div>
                        )} */}

                        {/* NEXT / STOP QUIZ ACTIONS */}

                        {message.showNextActions && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex flex-col sm:flex-row gap-2.5">

                              {/* NEXT QUESTION */}

                              <button
                                type="button"
                                onClick={handleNextQuizQuestion}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-[12.5px] font-semibold py-2.5 px-4 shadow-sm shadow-indigo-200 transition-all duration-200"
                              >
                                <Brain size={15} />
                                Next Question
                              </button>

                              {/* STOP QUIZ */}

                              <button
                                type="button"
                                onClick={handleStopQuiz}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 text-[12.5px] font-semibold py-2.5 px-4 transition-all duration-200"
                              >
                                <X size={15} />
                                Stop Quiz
                              </button>

                            </div>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {message.time}
                      </span>
                    </div>
                  </div>
                 <QuizResultPopup
      isOpen={quizResultOpen}
      isCorrect={quizCorrect}
      onClose={() => setQuizResultOpen(false)}
    />
                </div>

              );


            }

            // =================================================
            // SUMMARY WELCOME
            // =================================================

            if (
              mode === "summary" &&
              message.type === "summary-welcome"
            ) {
              return (
                <div
                  key={ind}
                  className="flex justify-start msg-in"
                >
                  <div className="flex items-end gap-2 w-full max-w-[90%] sm:max-w-[70%] min-w-0">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 text-white flex items-center justify-center">
                      <Bot size={13} />
                    </div>

                    <div className="flex flex-col items-start min-w-0 max-w-full">
                      <div className="bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                            <ClipboardList size={17} />
                          </div>

                          <div>
                            <p className="text-[14px] font-semibold text-gray-900">
                              Summary Mode
                            </p>

                            <p className="text-[13px] leading-relaxed text-gray-600 mt-1 truncate max-w-[200px] sm:max-w-[100%]">
                              {message.text}
                            </p>
                            {message.showStartSummaryButton && (
                            <button
  onClick={startSummarisation}
  disabled={isSummarising || summaryWaitingForQuota}
  className={`mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition active:scale-95 ${
    isSummarising || summaryWaitingForQuota
      ? "bg-indigo-400 cursor-not-allowed"
      : "bg-indigo-600 hover:bg-indigo-700"
  }`}
>
  {isSummarising
    ? "Generating Summary..."
    : "Start Summarisation"
  }
</button>
                            )}
                            {isSummarising && summaryProgress > 0 && (
                              <div className="w-full max-w-lg mt-4 px-4">

                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>

                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                      Building your summary...
                                    </span>
                                  </div>

                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {summaryProgress}%
                                  </span>
                                </div>

                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                                    style={{
                                      width: `${summaryProgress}%`
                                    }}
                                  />
                                </div>
                                <div className="mt-3 flex items-start gap-2 border-t border-gray-100 pt-3">

                                  <span className="text-indigo-500 text-xs mt-[1px]">
                                    ⏱
                                  </span>

                                  <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                                    Please don't refresh this page. Your next summary
                                    will be generated in about 1 minute.
                                  </p>

                                </div>

                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {message.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (
  mode === "summary" &&
  message.type === "summary-retry"
) {
  return (
    <div
      key={ind}
      className="flex justify-start msg-in"
    >
      <div className="flex items-end gap-2 max-w-[90%] sm:max-w-[70%]">
        
        <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 text-white flex items-center justify-center">
          <Bot size={13} />
        </div>

        <div className="flex flex-col items-start">
          
          <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">

            <p className="text-[13px] text-gray-600 mb-3">
              {message.text}
            </p>

            {message.quotaBlocked && (
              <p className="text-[12px] text-gray-500">
                Try again in{" "}
                <span className="font-semibold text-indigo-600">
                  {formatQuotaTime(quotaSeconds)}
                </span>
              </p>
            )}

          </div>

          <span className="text-[10px] text-gray-400 mt-1 px-1">
            {message.time}
          </span>

        </div>
      </div>
    </div>
  );
}

            // =================================================
// SUMMARY STATUS
// =================================================

if (
  mode === "summary" &&
  message.type === "summary-status"
) {
  return (
    <div
      key={ind}
      className="flex justify-start msg-in min-w-0 w-full"
    >
      <div className="flex items-end gap-2 min-w-0 max-w-[90%] sm:max-w-[70%]">
        
        <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 text-white flex items-center justify-center">
          <Bot size={13} />
        </div>

        <div className="flex flex-col items-start min-w-0 max-w-full">
          
          <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm min-w-0 max-w-full">
            
            <p
              className="text-[13px] text-gray-700 min-w-0 max-w-full truncate"
              title={message.text}
            >
              {message.text}
            </p>

          </div>

          <span className="text-[10px] text-gray-400 mt-1 px-1">
            {message.time}
          </span>

        </div>
      </div>
    </div>
  );
}

            // =================================================
            // CLEAR SUMMARY BUTTON
            // =================================================

            if (
              mode === "summary" &&
              message.type === "clear-summary"
            ) {
              return (
                <div
                  key={ind}
                  className="flex justify-start msg-in"
                >
                  <div className="flex items-end gap-2 max-w-[90%] sm:max-w-[70%]">

                    <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 text-white flex items-center justify-center">
                      <Bot size={13} />
                    </div>

                    <div className="flex flex-col items-start">

                      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">

                        <p className="text-[13px] text-gray-600 mb-3">
                          Remove All Your Summary
                        </p>

                        <button
                          type="button"
                          onClick={() => clearSummary(message.documentId)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 active:scale-95"
                        >
                          <X size={15} />
                          Clear Summary
                        </button>

                      </div>

                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {message.time}
                      </span>

                    </div>

                  </div>
                </div>
              );
            }

            // =================================================
            // NORMAL CHAT MESSAGE
            // =================================================

            return (
              <div
                key={ind}
                className={`flex msg-in ${isUser
                  ? "justify-end"
                  : "justify-start"
                  }`}
              >
                <div
                  className={`flex items-end gap-2 max-w-[90%] sm:max-w-[70%] ${isUser
                    ? "flex-row-reverse"
                    : ""
                    }`}
                >
                  <div
                    className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center ${isUser
                      ? "bg-gray-200 text-gray-600"
                      : "bg-gradient-to-br from-indigo-600 to-violet-500 text-white"
                      }`}
                  >
                    {isUser ? (
                      <User size={13} />
                    ) : (
                      <Bot size={13} />
                    )}
                  </div>

                  <div
                    className={`flex flex-col ${isUser
                      ? "items-end"
                      : "items-start"
                      }`}
                  >
                    <div
                      className={`px-4 py-2.5 text-[13.5px] leading-relaxed break-words shadow-sm ${isUser
                        ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-br-sm"
                        : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm"
                        }`}
                    >
                      {message.text}
                    </div>

                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {message.time}
                    </span>
                  </div>
                </div>

              </div>
            );
                   })
  )}

          {/* ================================================= */}
          {/* TYPING INDICATOR                                  */}
          {/* ================================================= */}

          {isTyping && (
            <div className="flex justify-start msg-in">
              <div className="flex items-end gap-2 max-w-[70%]">
                <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-500 text-white flex items-center justify-center">
                  <Bot size={13} />
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
                  <span className="dot w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <span className="dot w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <span className="dot w-1.5 h-1.5 rounded-full bg-gray-400" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ================================================= */}
        {/* MOBILE INFO BAR                                   */}
        {/* ================================================= */}

        <div className="sm:hidden px-4 pb-1 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white pl-1 pr-3 py-1 min-w-0">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${selectedDocs.length > 0
                ? "bg-indigo-100 text-indigo-600"
                : "bg-gray-100 text-gray-400"
                }`}
            >
              <FileText size={11} />
            </span>

            <span className="text-[11px] text-gray-600 truncate max-w-[180px]">
              {selectedDocLabel}
            </span>
          </div>

          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 text-[10.5px] font-semibold">
            {mode === "chat" && (
              <MessageCircle size={11} />
            )}

            {mode === "quiz" && (
              <Brain size={11} />
            )}

            {mode === "summary" && (
              <ClipboardList size={11} />
            )}

            {mode === "chat" && "Chat"}
            {mode === "quiz" && "Quiz"}
            {mode === "summary" && "Summary"}
          </span>
        </div>

        {/* ================================================= */}
        {/* COMPOSER                                           */}
        {/* ================================================= */}


        <div className="border-t border-gray-100 bg-white p-3 sm:p-4">
          {mode == "chat" && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-1.5 border border-transparent focus-within:border-indigo-300 focus-within:bg-white transition">
              <input
                type="text"
                placeholder={
                  quotaBlocked
                    ? `Chat locked. Try again in ${formatQuotaTime(quotaSeconds)}`
                    : "Ask something..."
                }
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendmsg();
                  }
                }}
                className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-[13.5px] text-gray-800 outline-none placeholder:text-gray-400"
              />

              <button
                onClick={sendmsg}
                disabled={!input.trim() || isTyping || quotaBlocked}
                className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-200 transition"
              >
                <Send size={16} />
              </button>
            </div>
          )}
          <p className="text-center text-[10.5px] text-gray-400 mt-2">
            AI responses may contain mistakes. Please
            review important information carefully.
          </p>
        </div>

      </div>
    </div>
  );
}


export default Home;