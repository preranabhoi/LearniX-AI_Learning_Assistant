import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import { Home, FileQuestion } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <PageHeader title="Page Not Found" />

      <div className="mt-8 bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-8 max-w-md shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-slate-100 mb-4">
          <FileQuestion className="w-8 h-8 text-slate-600" strokeWidth={2} />
        </div>

        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Oops! Page not found
        </h2>

        <p className="text-sm text-slate-600 mb-6">
          The page you’re looking for doesn’t exist or may have been moved.
          Let’s get you back on track.
        </p>

        <Link to="/dashboard">
          <Button className="w-full flex items-center justify-center gap-2">
            <Home size={16} />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
