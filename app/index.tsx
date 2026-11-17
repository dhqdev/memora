import { Redirect } from 'expo-router';
import { useStore } from '@/store';

export default function Index() {
  const { profile } = useStore();
  return <Redirect href={profile.onboarded ? '/(tabs)' : '/onboarding'} />;
}
