/**
 * Estilos do mapa no Android (Google Maps), no tom do app: papel creme no claro,
 * grafite no escuro, sem pontos comerciais nem transporte. No iOS o Apple Maps
 * usa `mapType="mutedStandard"`, que já tem esse ar discreto.
 */
type Style = { elementType?: string; featureType?: string; stylers: Record<string, string | number>[] }[];

const base = (g: string, label: string, halo: string, water: string, road: string, park: string): Style => [
  { elementType: 'geometry', stylers: [{ color: g }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: label }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: halo }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: park }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: road }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: water }] },
];

export const mapStyle = {
  light: base('#EDEAE1', '#6B675E', '#F2EFE6', '#D5DAD7', '#FFFFFF', '#E1E3D3'),
  dark: base('#1B1B1A', '#8E8A80', '#121212', '#242A2D', '#2C2C2A', '#20241F'),
};
