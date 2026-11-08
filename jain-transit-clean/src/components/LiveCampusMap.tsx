import React from 'react';
import { GoogleCampusMap } from './GoogleCampusMap';
import { ShuttleBus } from '../types/transit';

interface LiveCampusMapProps {
  buses?: ShuttleBus[];
  onSelectBus?: (busId: number) => void;
  compact?: boolean;
  focusBus?: string;
}

export const LiveCampusMap: React.FC<LiveCampusMapProps> = (props) => {
  return <GoogleCampusMap {...props} />;
};
