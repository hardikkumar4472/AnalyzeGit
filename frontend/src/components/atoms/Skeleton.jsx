import React from 'react';

const Skeleton = ({ className = "" }) => {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />
  );
};

export default Skeleton;
