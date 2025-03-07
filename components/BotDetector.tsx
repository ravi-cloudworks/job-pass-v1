import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BotDetector = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const now = Date.now();
    const historyKey = "visit_history";
    const banKey = "bot_ban_until";
    const timeLimit = 30000; // 30 seconds
    const maxVisits = 5; // Max allowed visits in timeLimit

    // Check if the user is already banned
    const banTime = localStorage.getItem(banKey);
    if (banTime && now < parseInt(banTime)) {
      navigate("/bot-error");
      return;
    }

    // Get visit history and filter out old timestamps
    const historyData = localStorage.getItem(historyKey);
    let history: number[] = historyData ? JSON.parse(historyData) : [];
    history = history.filter((timestamp: number) => now - timestamp < timeLimit);
    history.push(now); // Add current visit

    // Save updated history
    localStorage.setItem(historyKey, JSON.stringify(history));

    // Check if visits exceed limit
    if (history.length > maxVisits) {
      // Ban user for exponential random minutes
      const banMinutes = Math.exp(Math.random() * 3); // Random time
      const banUntil = now + banMinutes * 60000;
      localStorage.setItem(banKey, banUntil.toString());

      navigate("/bot-error");
    }
  }, [navigate]);

  return null;
};

export default BotDetector;