import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Dashboard } from "@/pages/Dashboard";
import { Threats } from "@/pages/Threats";
import { News } from "@/pages/News";
import { Analytics } from "@/pages/Analytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 2,
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <Dashboard />;
      case "threats": return <Threats />;
      case "news": return <News />;
      case "analytics": return <Analytics />;
      default: return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ minHeight: "100vh", background: "hsl(220, 20%, 6%)", color: "hsl(210, 40%, 92%)" }}>
        <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
        <main style={{ maxWidth: "1600px", margin: "0 auto" }}>
          {renderPage()}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
