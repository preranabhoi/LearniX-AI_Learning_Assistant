import React from "react";

const Tabs = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="w-full">
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name;

            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`relative py-3 text-sm font-semibold transition ${
                  isActive
                    ? "text-emerald-600"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}

                {isActive && (
                  <span className="absolute left-0 -bottom-px h-0.5 w-full bg-emerald-600 rounded-full transition-all duration-300" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="py-6">
        {tabs.find((tab) => tab.name === activeTab)?.content}
      </div>
    </div>
  );
};

export default Tabs;
