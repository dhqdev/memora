import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type IconName =
  | 'search'
  | 'menu'
  | 'plus'
  | 'back'
  | 'close'
  | 'more'
  | 'chevLeft'
  | 'chevRight'
  | 'camera'
  | 'image'
  | 'pin'
  | 'send';

/** Ícones de traço fino, desenhados em SVG (24×24). */
export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color: string }) {
  const s = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'search' && (
        <>
          <Circle cx="11" cy="11" r="6.5" {...s} />
          <Path d="M16 16l4.5 4.5" {...s} />
        </>
      )}
      {name === 'menu' && <Path d="M4 7h16M4 12h16M4 17h16" {...s} />}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...s} strokeWidth={2.2} />}
      {name === 'back' && <Path d="M19 12H5M11 6l-6 6 6 6" {...s} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...s} />}
      {name === 'more' && (
        <>
          <Circle cx="5.5" cy="12" r="1.4" fill={color} />
          <Circle cx="12" cy="12" r="1.4" fill={color} />
          <Circle cx="18.5" cy="12" r="1.4" fill={color} />
        </>
      )}
      {name === 'chevLeft' && <Path d="M15 5l-7 7 7 7" {...s} />}
      {name === 'chevRight' && <Path d="M9 5l7 7-7 7" {...s} />}
      {name === 'camera' && (
        <>
          <Path d="M4 8h3l2-2.5h6L17 8h3v11H4z" {...s} />
          <Circle cx="12" cy="13" r="3.5" {...s} />
        </>
      )}
      {name === 'image' && (
        <>
          <Path d="M4 5h16v14H4z" {...s} />
          <Path d="M4 16l5-5 4 4 2-2 5 5" {...s} />
          <Circle cx="15.5" cy="9" r="1.5" {...s} />
        </>
      )}
      {name === 'pin' && (
        <>
          <Path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0113 0c0 4.8-6.5 11-6.5 11z" {...s} />
          <Circle cx="12" cy="10" r="2.3" {...s} />
        </>
      )}
      {name === 'send' && <Path d="M12 19V5M6 11l6-6 6 6" {...s} strokeWidth={2.2} />}
    </Svg>
  );
}
