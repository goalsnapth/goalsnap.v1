"use client";

import { useState } from "react";
import axios from "axios";
import { X, Copy, CheckCircle, AlertCircle, Loader2, Wallet } from "lucide-react";
import { clsx } from "clsx";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [txHash, setTxHash] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const WALLET_ADDRESS = "T9yX...MockWalletAddressTRC20"; // Replace with real address

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(WALLET_ADDRESS);
    alert("Address copied!");
  };

  const handleVerify = async () => {
    if (!txHash) return;
    setStatus("loading");
    setErrorMessage("");

    try {
      // Call Backend
      await axios.post("http://127.0.0.1:8000/api/v1/payment/verify", {
        tx_hash: txHash,
        user_id: "current_user_id"
      });

      setStatus("success");
      setTimeout(() => {
        onSuccess();
        onClose();
        setStatus("idle");
        setTxHash("");
      }, 2000); // Close after 2s success message
      
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.response?.data?.detail || "Verification failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-dark-800 border border-dark-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-blue/20 to-dark-800 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-accent-blue" />
              Unlock Premium
            </h2>
            <p className="text-text-secondary text-sm mt-1">Get full access to AI Predictions</p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Price & QR Placeholder */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
              {/* Replace with <img src="/qr.png" /> */}
              <span className="text-black font-bold text-xs">QR CODE HERE</span>
            </div>
            <div className="text-2xl font-bold text-accent-green">10 USDT <span className="text-sm text-text-secondary font-normal">/ month</span></div>
          </div>

          {/* Wallet Address */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-text-secondary">Send USDT (TRC20) to:</label>
            <div className="flex items-center gap-2 bg-dark-900 p-3 rounded-lg border border-dark-700">
              <code className="text-sm text-text-primary flex-1 truncate">{WALLET_ADDRESS}</code>
              <button onClick={handleCopy} className="p-2 hover:bg-dark-700 rounded-md transition-colors">
                <Copy className="w-4 h-4 text-accent-blue" />
              </button>
            </div>
          </div>

          {/* Verification Input */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-text-secondary">Transaction Hash (TxID):</label>
            <input 
              type="text" 
              placeholder="Paste your TxID here..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>

          {/* Status Messages */}
          {status === "error" && (
            <div className="flex items-center gap-2 text-accent-red text-sm bg-accent-red/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}
          {status === "success" && (
            <div className="flex items-center gap-2 text-accent-green text-sm bg-accent-green/10 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              Payment Verified! Unlocking...
            </div>
          )}

          {/* Action Button */}
          <button 
            onClick={handleVerify}
            disabled={status === "loading" || status === "success"}
            className={clsx(
              "w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2",
              status === "success" ? "bg-accent-green" : "bg-accent-blue hover:bg-accent-blue/90"
            )}
          >
            {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Payment"}
          </button>

        </div>
      </div>
    </div>
  );
}