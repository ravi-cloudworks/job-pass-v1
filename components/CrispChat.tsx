"use client";
import { useEffect } from 'react';

// Add TypeScript interfaces
declare global {
  interface Window {
    $crisp?: any[];
    CRISP_WEBSITE_ID?: string;
  }
}

const CRISP_WEBSITE_ID = "790b5a55-f4a5-4f4f-8533-b948be48e1ea"; // Replace with your actual Website ID

export default function CrispChat() {
  useEffect(() => {
    // Initialize Crisp
    // console.log("Initializing Crisp");
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;
    
    // Load Crisp script
    (function() {
      const d = document;
      const s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = true;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
    
    return () => {
      // Clean up
      delete window.$crisp;
      delete window.CRISP_WEBSITE_ID;
    };
  }, []);
  
  return null;
}