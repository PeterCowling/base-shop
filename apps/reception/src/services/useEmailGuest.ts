// src/service/useEmailGuest.ts
import { useCallback, useState } from "react";

type UseEmailGuestConfig = {
  enableEmail?: boolean;
};

/**
 * useEmailGuest
 * Sends an email to the guest identified by the bookingRef.
 * If email sending is disabled via config, simulates a successful send without making a request.
 *
 * @param {object} [config] - Configuration object
 * @param {boolean} [config.enableEmail] - Indicates whether emails are actually sent
 * @returns {object} - { loading, message, sendEmailGuest }
 */
function useEmailGuest({ enableEmail = false }: UseEmailGuestConfig = {}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sendEmailGuest = useCallback(
    async (bookingRef: string) => {
      setLoading(true);

      // If email sending is disabled, simulate success and return early
      if (!enableEmail) {
        console.log("Email sending is disabled. Simulating successful send.");
        setMessage("Email Guest Connection Successful (simulated).");
        setLoading(false);
        return;
      }

      // Otherwise, proceed with the actual API call
      try {
        const response = await fetch(
          `https://script.google.com/macros/s/AKfycbzEPvmqFeK1wW8VAid-cs6dhlQ49QDDOQR48whSU_jRQkbTQiNN38yjZSUVu9gYvlIx/exec?bookingRef=${bookingRef}`
        );
        const text = await response.text();
        console.log("Email Guest Connection Successful:", text);
        setMessage(text);
      } catch (error) {
        console.error("Email Guest Connection Failed:", error);
        setMessage("Test Connection Failed. Check console for details.");
      } finally {
        setLoading(false);
      }
    },
    [enableEmail]
  );

  return { loading, message, sendEmailGuest };
}

export default useEmailGuest;
