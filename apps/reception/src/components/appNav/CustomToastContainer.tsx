/* /src/components/CustomToastContainer.tsx */
import { FC } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDarkMode } from "../../context/DarkModeContext";

/**
 * Single, memoized ToastContainer to display all toast notifications.
 * Render once in the application root (e.g., in App.tsx).
 */
const CustomToastContainer: FC = function CustomToastContainer() {
  const { mode } = useDarkMode();

  return (
    <ToastContainer
      position="top-center"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick={true}
      rtl={false}
      pauseOnFocusLoss={true}
      draggable={true}
      pauseOnHover={true}
      theme={mode}
      className={mode === "dark" ? "dark" : undefined}
    />
  );
};

CustomToastContainer.displayName = "CustomToastContainer";

export default CustomToastContainer;
