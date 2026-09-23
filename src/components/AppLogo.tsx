import React, { useEffect, useState } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../services/db';
import { AppConfig } from '../types';
import { INITIAL_APP_CONFIG } from '../services/seedData';
import { updateFavicon } from '../lib/favicon';
import { Activity, Trophy, Medal, Flame, Dribbble, Dumbbell } from 'lucide-react';

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg';
  whiteText?: boolean;
  extraSubtitle?: React.ReactNode;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  textSize = 'md',
  whiteText = false,
  extraSubtitle
}) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const stored = localStorage.getItem('pjok_data_app_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          if (!parsed.appName || parsed.appName === 'PENILAIAN ANTAR TEMAN PJOK') {
            parsed.appName = 'e-PJOK';
          }
          return { ...INITIAL_APP_CONFIG, ...parsed };
        }
      }
    } catch {}
    return INITIAL_APP_CONFIG;
  });

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [config.logoUrl]);

  useEffect(() => {
    let mounted = true;
    const fetchConfig = async () => {
      const data = await DatabaseService.getAppConfig();
      if (mounted) {
        setConfig(data);
        updateFavicon(data.logoUrl, data.logoIconPreset);
      }
    };
    fetchConfig();
    const unsub = subscribeToDataChanges(fetchConfig);
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl',
    xl: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl'
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5 sm:w-6 sm:h-6',
    lg: 'w-7 h-7 sm:w-8 sm:h-8',
    xl: 'w-11 h-11 sm:w-13 sm:h-13'
  }[size];

  const renderIcon = () => {
    switch (config.logoIconPreset) {
      case 'trophy':
        return <Trophy className={iconSizes} />;
      case 'medal':
        return <Medal className={iconSizes} />;
      case 'flame':
        return <Flame className={iconSizes} />;
      case 'basketball':
        return <Dribbble className={iconSizes} />;
      case 'activity':
      default:
        return <Activity className={iconSizes} />;
    }
  };

  const hasImage = Boolean(config.logoUrl && !imageError);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses} overflow-hidden shrink-0 flex items-center justify-center font-bold transition-transform shadow-md ${
          hasImage
            ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-slate-200/60 dark:shadow-none p-1.5'
            : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-emerald-600/25'
        }`}
      >
        {hasImage ? (
          <img
            src={config.logoUrl}
            alt={config.appName || 'Logo Sekolah'}
            className="w-full h-full object-contain rounded-xl"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          renderIcon()
        )}
      </div>

      {showText && (
        <div className="min-w-0">
          <h1
            className={`font-black tracking-tight leading-tight font-heading truncate ${
              whiteText ? 'text-white' : 'text-slate-900 dark:text-white'
            } ${
              textSize === 'sm'
                ? 'text-xs sm:text-sm md:text-base'
                : textSize === 'lg'
                ? 'text-base sm:text-xl md:text-2xl'
                : 'text-xs sm:text-base md:text-lg'
            }`}
          >
            {config.appName && config.appName !== 'PENILAIAN ANTAR TEMAN PJOK' ? config.appName : 'e-PJOK'}
          </h1>
          <p
            className={`text-[10px] sm:text-xs truncate font-semibold ${
              whiteText ? 'text-emerald-200' : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {config.schoolName ? `${config.schoolName} — ${config.motto || 'Sportif, Jujur, dan Menghargai Gerak Teman'}` : (config.motto || 'Sportif, Jujur, dan Menghargai Gerak Teman')}
          </p>
          {extraSubtitle}
        </div>
      )}
    </div>
  );
};
