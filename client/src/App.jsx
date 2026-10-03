import { useI18nHTMLAttributes } from "./hooks/useI18nHTMLAttributes.tsx";
import { AppRoutes } from "./routes";
import { Lightbox } from "@components/common";

function App() {
  useI18nHTMLAttributes();

  return (
    <>
      <AppRoutes />
      {/* Click any image/video anywhere → fullscreen viewer (work order §6) */}
      <Lightbox />
    </>
  );
}

export default App;
