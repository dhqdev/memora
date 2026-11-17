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
  | 'send'
  | 'sliders'
  | 'book'
  | 'chat'
  | 'share'
  | 'edit'
  | 'grid'
  | 'locate'
  | 'arrow'
  | 'sparkle'
  | 'calendar';

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
      {name === 'sliders' && (
        <>
          <Path d="M4 7h2.9M11.1 7H20M4 12h8.9M17.1 12H20M4 17h3.9M12.1 17H20" {...s} strokeWidth={1.5} />
          <Circle cx="9" cy="7" r="2.1" {...s} />
          <Circle cx="15" cy="12" r="2.1" {...s} />
          <Circle cx="10" cy="17" r="2.1" {...s} />
        </>
      )}
      {name === 'book' && <Path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5v13" {...s} />}
      {name === 'chat' && <Path d="M5 5h14v10H10l-4 3.5V15H5z" {...s} />}
      {name === 'share' && <Path d="M12 15V4M8 8l4-4 4 4M6 12v7h12v-7" {...s} />}
      {name === 'edit' && <Path d="M5 19l1-4L16 5l3 3L9 18zM14 7l3 3" {...s} />}
      {name === 'grid' && <Path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" {...s} />}
      {name === 'locate' && (
        <>
          <Circle cx="12" cy="12" r="6" {...s} />
          <Path d="M12 3v3M12 18v3M3 12h3M18 12h3" {...s} />
        </>
      )}
      {name === 'arrow' && <Path d="M5 12h14M13 6l6 6-6 6" {...s} />}
      {name === 'sparkle' && (
        <Path d="M12 3c.6 4.6 3.4 7.4 9 9-5.6 1.6-8.4 4.4-9 9-.6-4.6-3.4-7.4-9-9 5.6-1.6 8.4-4.4 9-9z" fill={color} stroke="none" />
      )}
      {name === 'calendar' && (
        <>
          <Path d="M4.5 6.5h15v13h-15z" {...s} />
          <Path d="M4.5 10.5h15M8.5 4v4M15.5 4v4" {...s} />
        </>
      )}
      {name === 'send' && <Path d="M12 19V5M6 11l6-6 6 6" {...s} strokeWidth={2.2} />}
    </Svg>
  );
}
