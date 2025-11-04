import React from 'react';
import { cn } from '@/lib/utils';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface CustomTitleBarProps {
  children?: React.ReactNode;
  className?: string;
}

const CustomTitleBar: React.FC<CustomTitleBarProps> = ({
  children,
  className
}) => {
  return (
    <div
      className={cn(
        'h-10 text-foreground flex items-center shrink-0 border-b border-white/5',
        'px-4',
        IS_MACOS ? 'pl-20' : '',
        children === undefined && 'border-none',
        className
      )}
      style={{ 
        backgroundColor: 'var(--app-bg)',
        color: 'var(--app-bg-fg)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="flex items-center w-full gap-3">
        <div className="flex-1 min-w-0">
          {children}
        </div>
        
        {!IS_MACOS && (
          <WindowControls />
        )}
      </div>
    </div>
  );
};

const WindowControls: React.FC = () => {
  const minimize = async () => {
    try {
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const maximize = async () => {
    try {
      const window = getCurrentWindow();
      await window.toggleMaximize();
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  };

  const close = async () => {
    try {
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={minimize}
        className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
        title="Minimize"
        aria-label="Minimize window"
      />
      <button 
        onClick={maximize}
        className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
        title="Maximize"
        aria-label="Maximize window"
      />
      <button 
        onClick={close}
        className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
        title="Close"
        aria-label="Close window"
      />
    </div>
  );
};

export default CustomTitleBar;

