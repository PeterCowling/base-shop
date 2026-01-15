// src/components/Statistics.tsx
import React, { useCallback, useState } from "react";

/**
 * Statistics component provides a button to test connection
 * to the Google Apps Script endpoint with a fixed booking reference.
 *
 * @returns {JSX.Element} The Statistics component.
 */
const Statistics: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const handleTestConnection = useCallback(async () => {
    setLoading(true);
    try {
      // The deployed Google Apps Script URL with a valid booking reference.
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwzKYZ0FxoAgSlt98OruRKSaW8OAe4Ug3e1VZ2YGEttgWrRZyAWX8VRHG3Abf_OrXGM/exec?bookingRef=7763-566257509"
      );
      const text = await response.text();
      setMessage(text);
    } catch (error) {
      if (error instanceof Error && error.message) {
        setMessage(`Test Connection Failed: ${error.message}`);
      } else {
        setMessage("Test Connection Failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="p-6 text-center bg-gray-50 rounded border border-gray-200 dark:bg-darkSurface dark:text-darkAccentGreen">
      <h2 className="text-2xl font-semibold mb-2">Connection Test</h2>
      <p className="text-gray-700 mb-4 dark:text-darkAccentGreen">
        {message ||
          "Press the button to test connection to the Google Apps Script endpoint with bookingRef 4382244000."}
      </p>
      <button
        type="button"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={handleTestConnection}
        disabled={loading}
      >
        {loading ? "Testing..." : "Test Connection"}
      </button>
    </div>
  );
};

export default React.memo(Statistics);
