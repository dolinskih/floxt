"use client";

import React, { useEffect, useState } from "react";

// Props definition for the AnimatedDialog component
interface AnimatedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedDialog({
  isOpen,
  onClose,
  children,
  className = "max-w-md",
}: AnimatedDialogProps) {
  // Keeps the dialog mounted in the DOM while the exit animation is playing
  const [shouldRender, setShouldRender] = useState(isOpen);
  // Controls when to apply exit CSS animation classes
  const [isClosing, setIsClosing] = useState(false);

  // Synchronize internal animation lifecycle with external isOpen prop changes
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      // Trigger exit animation and defer unmounting until the animation completes
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 160); // Matches exit keyframe duration (160ms)
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  // Handle closing the dialog via the "Escape" key for keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Do not render anything if the dialog is closed and exit animations have finished
  if (!shouldRender) return null;

  return (
    <>
      {/* Global CSS animations for backdrop blur/opacity and modal scale/translation transitions */}
      <style jsx global>{`
        @keyframes dialogBackdropIn {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(4px);
          }
        }
        @keyframes dialogBackdropOut {
          from {
            opacity: 1;
            backdrop-filter: blur(4px);
          }
          to {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
        }
        @keyframes dialogContentIn {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes dialogContentOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.96) translateY(4px);
          }
        }

        .anim-dialog-backdrop-in {
          animation: dialogBackdropIn 200ms ease-out forwards;
        }
        .anim-dialog-backdrop-out {
          animation: dialogBackdropOut 160ms ease-in forwards;
        }
        .anim-dialog-content-in {
          animation: dialogContentIn 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-dialog-content-out {
          animation: dialogContentOut 160ms ease-in forwards;
        }
      `}</style>

      {/* Backdrop overlay container: handles click-outside to dismiss */}
      <div
        className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 ${isClosing ? "anim-dialog-backdrop-out" : "anim-dialog-backdrop-in"
          }`}
        onClick={(e) => {
          // Close only when clicking directly on the backdrop, not when bubbling from modal content
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Modal content container with entrance/exit scaling and pointer-events disabled during close */}
        <div
          className={`w-full ${className} ${isClosing ? "anim-dialog-content-out pointer-events-none" : "anim-dialog-content-in"
            }`}
        >
          {children}
        </div>
      </div>
    </>
  );
}