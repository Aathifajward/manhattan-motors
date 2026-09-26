"use client";

import { motion } from "framer-motion";
import { ReactNode, ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

export function MotionCard({ children, href, className, style, delay = 0 }: { children: ReactNode, href: string, className?: string, style?: any, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(45,127,249,0.3)" }}
      whileTap={{ scale: 0.98 }}
      className={className}
      style={style}
    >
      <Link href={href} className="block w-full h-full">
        {children}
      </Link>
    </motion.div>
  );
}

export function MotionButton({ children, className, style, ...props }: any) {
  return (
    <motion.button 
      whileHover={{ scale: 1.02 }} 
      whileTap={{ scale: 0.97 }} 
      transition={{ duration: 0.2 }}
      className={className} 
      style={style} 
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function MotionLink({ children, href, className, style, fullWidth, ...props }: any) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }} className="inline-block" style={{ width: fullWidth ? '100%' : 'auto' }}>
      <Link href={href} className={className} style={style} {...props}>
        {children}
      </Link>
    </motion.div>
  );
}

export function MotionExternalLink({ children, href, className, style, ...props }: any) {
  return (
    <motion.a 
      href={href} 
      whileHover={{ scale: 1.02 }} 
      whileTap={{ scale: 0.97 }} 
      transition={{ duration: 0.2 }}
      className={className} 
      style={style} 
      {...props}
    >
      {children}
    </motion.a>
  );
}
