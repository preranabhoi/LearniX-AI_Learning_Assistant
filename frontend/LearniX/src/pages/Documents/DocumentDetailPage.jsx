import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import documentService from "../../services/documentService";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import { ArrowLeft, ExternalLink } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Tabs from "../../components/common/Tabs";
import ChatInterface from "../../components/chat/ChatInterface"
import AIActions from "../../components/ai/AIActions";
import FlashcardManager from "../../components/flashcards/FlashcardManager";
import QuizManager from "../../components/quizzes/QuizManager";

const DocumentDetailPage = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Content");

  useEffect(() => {
    const fetchDocumentsDetails = async () => {
      try {
        const data = await documentService.getDocumentById(id);
        setDocument(data);
      } catch (error) {
        toast.error("Failed to fetch document details.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentsDetails();
  }, [id]);

  //Helper function to get the full PDF URL

  const getPdfUrl = () => {
    if (!document?.data?.filePath) return null;
    const filePath = document.data.filePath;

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }

    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
    return `${baseUrl}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
  };

  const renderContent = () => {
    if (!document?.data?.filePath) {
      return (
        <div className="text-center py-12 text-slate-500">
          PDF not available.
        </div>
      );
    }
  
    const pdfUrl = getPdfUrl();
  
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b">
          <span className="text-sm font-semibold text-slate-700">
            Document Viewer
          </span>
  
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <ExternalLink size={16} />
            Open in new tab
          </a>
        </div>
  
        <iframe
          src={pdfUrl}
          className="w-full h-[75vh]"
          title="PDF Viewer"
        />
      </div>
    );
  };
  
  const renderChat = () => {
    return <ChatInterface documentId={id}/>
  };

  const renderAIActions = () => {
    return <AIActions/>
  };

  const renderFlashcardsTab = () => {
    return <FlashcardManager documentId={id}/>
  };

  const renderQuizzesTab = () => {
    return <QuizManager documentId={id}/>
  };

  const tabs = [
    { name: "Content", label: "Content", content: renderContent() },
    { name: "Chat", label: "Chat", content: renderChat() },
    { name: "AI Actions", label: "AI Actions", content: renderAIActions() },
    {
      name: "Flashcards",
      label: "Flashcards",
      content: renderFlashcardsTab(),
    },
    { name: "Quizzes", label: "Quizzes", content: renderQuizzesTab() },
  ];

  if (loading) {
    return <Spinner />;
  }

  if (!document) {
    return <div className="text-center p-8">Document not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} />
          Back to Documents
        </Link>
      </div>
  
      {/* Title */}
      <div className="mb-8">
        <PageHeader title={document.data.title} />
      </div>
  
      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
}

export default DocumentDetailPage;