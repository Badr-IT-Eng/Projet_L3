"use client"

import { motion } from "framer-motion"

export function FloatingShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Floating circles */}
      <motion.div
        className="absolute w-32 h-32 bg-blue-200/20 rounded-full blur-xl"
        style={{ top: "10%", left: "10%" }}
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute w-24 h-24 bg-purple-200/20 rounded-full blur-xl"
        style={{ top: "60%", right: "15%" }}
        animate={{
          y: [0, 15, 0],
          x: [0, -15, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      
      <motion.div
        className="absolute w-20 h-20 bg-indigo-200/20 rounded-full blur-xl"
        style={{ bottom: "20%", left: "20%" }}
        animate={{
          y: [0, -10, 0],
          x: [0, 20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      
      <motion.div
        className="absolute w-16 h-16 bg-blue-300/20 rounded-full blur-xl"
        style={{ top: "30%", right: "30%" }}
        animate={{
          y: [0, 25, 0],
          x: [0, -10, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
      
      {/* Floating squares */}
      <motion.div
        className="absolute w-12 h-12 bg-purple-300/15 rounded-lg blur-lg rotate-45"
        style={{ top: "80%", right: "10%" }}
        animate={{
          y: [0, -30, 0],
          rotate: [45, 90, 45],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      
      <motion.div
        className="absolute w-8 h-8 bg-indigo-300/15 rounded-lg blur-lg rotate-12"
        style={{ top: "15%", right: "5%" }}
        animate={{
          y: [0, 20, 0],
          rotate: [12, 57, 12],
          scale: [1, 0.8, 1],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />
    </div>
  )
}