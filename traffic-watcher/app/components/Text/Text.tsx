import React from 'react';

export const HeadingH1: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <h1 className={`text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 ${className}`}>
    {children}
  </h1>
);

export const HeadingH2: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <h2 className={`text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 ${className}`}>
    {children}
  </h2>
);

export const HeadingH3: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <h3 className={`text-2xl font-medium tracking-tight text-gray-900 dark:text-gray-100 ${className}`}>
    {children}
  </h3>
);

export const HeadingH4: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <h4 className={`text-xl font-medium text-gray-900 dark:text-gray-100 ${className}`}>
    {children}
  </h4>
);

export const HeadingH5: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <h5 className={`text-lg font-medium text-gray-900 dark:text-gray-100 ${className}`}>
    {children}
  </h5>
);

export const LargeParagraph: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <p className={`text-lg leading-relaxed text-gray-700 dark:text-gray-300 ${className}`}>
    {children}
  </p>
);

export const Paragraph: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <p className={`text-base leading-relaxed text-gray-700 dark:text-gray-300 ${className}`}>
    {children}
  </p>
);

export const SmallParagraph: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <p className={`text-sm leading-relaxed text-gray-700 dark:text-gray-300 ${className}`}>
    {children}
  </p>
);

// Special text components
export const Lead: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <p className={`text-xl font-medium leading-relaxed text-gray-600 dark:text-gray-300 ${className}`}>
    {children}
  </p>
);

export const Subtitle: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <p className={`text-lg text-gray-600 dark:text-gray-400 ${className}`}>
    {children}
  </p>
);

// Inline text components
export const Strong: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <strong className={`font-semibold text-gray-900 dark:text-gray-100 ${className}`}>
    {children}
  </strong>
);

export const Emphasis: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <em className={`italic text-gray-900 dark:text-gray-100 ${className}`}>
    {children}
  </em>
);

export const InlineCode: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <code className={`rounded bg-gray-100 px-1 py-0.5 font-mono text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100 ${className}`}>
    {children}
  </code>
);

// Helper components
export const Caption: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
    {children}
  </p>
);

export const Label: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <span className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}>
    {children}
  </span>
);

export const Quote: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
  <blockquote className={`border-l-4 border-gray-200 pl-4 italic text-gray-900 dark:border-gray-700 dark:text-gray-100 ${className}`}>
    {children}
  </blockquote>
);

export const Link: React.FC<{children: React.ReactNode, className?: string, href: string}> = ({ href, children, className = '' }) => (
  <a 
    href={href}
    className={`text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline ${className}`}
  >
    {children}
  </a>
);