'use client';

import React from 'react';
import { hueFromString } from '@/lib/colorHash';

interface AssigneeAvatarProps {
  name: string;
  size?: number;
  ring?: boolean;
  style?: React.CSSProperties;
}

export default function AssigneeAvatar({ name, size = 18, ring = false, style }: AssigneeAvatarProps) {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const hue = hueFromString(name);
  return (
    <span
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `hsl(${hue} 70% 45%)`,
        color: '#fff',
        fontSize: Math.max(8, Math.round(size * 0.5)),
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: ring ? '0 0 0 2px rgba(255,255,255,0.7)' : undefined,
        ...style,
      }}
    >
      {initials || '?'}
    </span>
  );
}
