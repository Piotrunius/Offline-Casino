import { motion } from 'framer-motion';
import { Check, Copy, Shield, X } from 'lucide-react';
import { useState } from 'react';
import { useCasino } from '../../context/CasinoContext';
import { generateOutcome, generateSeed, hashServerSeed } from '../../utils/provablyFair';

const ProvablyFairModal = ({ isOpen, onClose }) => {
  const { state } = useCasino();
  const [copied, setCopied] = useState('');

  if (!isOpen) return null;

  // Get or generate provably fair data
  const serverSeed = state.serverSeed || generateSeed(32);
  const clientSeed = state.clientSeed || generateSeed(16);
  const nonce = state.nonce || 0;
  const serverSeedHash = hashServerSeed(serverSeed);
  const hash = generateOutcome(serverSeed, clientSeed, nonce);

  const data = {
    serverSeed: serverSeedHash,
    clientSeed,
    hash,
    nonce
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] overflow-y-auto z-50 rounded-2xl"
      >
        <div className="bg-casino-card border border-casino-border overflow-hidden shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="sticky top-0 px-6 py-4 border-b border-casino-border flex items-center justify-between bg-casino-card/90 backdrop-blur">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-casino-green" />
              <h2 className="text-xl font-bold text-white">Provably Fair</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-casino-border rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="p-4 rounded-lg bg-casino-green/10 border border-casino-green/30">
              <p className="text-sm text-casino-green">
                ✓ All games use cryptographically secure random number generation with SHA-256 hashing
              </p>
            </div>

            {/* Server Seed */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Server Seed
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={data.serverSeed}
                  readOnly
                  className="w-full px-4 py-3 rounded-lg bg-casino-bg border border-casino-border text-gray-300 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(data.serverSeed, 'server')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-casino-border rounded transition"
                >
                  {copied === 'server' ? (
                    <Check className="w-4 h-4 text-casino-green" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Client Seed */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Client Seed
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={data.clientSeed}
                  readOnly
                  className="w-full px-4 py-3 rounded-lg bg-casino-bg border border-casino-border text-gray-300 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(data.clientSeed, 'client')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-casino-border rounded transition"
                >
                  {copied === 'client' ? (
                    <Check className="w-4 h-4 text-casino-green" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Hash */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                SHA-256 Hash
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={data.hash}
                  readOnly
                  className="w-full px-4 py-3 rounded-lg bg-casino-bg border border-casino-border text-gray-300 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(data.hash, 'hash')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-casino-border rounded transition"
                >
                  {copied === 'hash' ? (
                    <Check className="w-4 h-4 text-casino-green" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-casino-bg border border-casino-border">
              <div>
                <div className="text-xs text-gray-400 font-semibold uppercase">Nonce</div>
                <div className="font-mono text-gray-300">{data.nonce}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-semibold uppercase">Algorithm</div>
                <div className="font-mono text-gray-300">SHA-256</div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 p-4 rounded-lg bg-casino-bg border border-casino-border">
              <h3 className="font-semibold text-white text-sm">How it works:</h3>
              <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside">
                <li>Server seed is hashed and hidden before game starts</li>
                <li>You can set your own client seed for additional randomness</li>
                <li>After game ends, server seed is revealed for verification</li>
                <li>Any user can verify the outcome was not manipulated</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-casino-border">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-lg bg-casino-cyan hover:brightness-110 text-casino-bg font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ProvablyFairModal;
