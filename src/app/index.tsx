import { Redirect } from 'expo-router';
import { useState } from 'react';
import { getStoredMemberId } from '@/lib/storage';

export default function GatewayRoute() {
  const [hasMember] = useState(() => !!getStoredMemberId());

  return <Redirect href={hasMember ? '/(tabs)/(schedule)' : '/onboarding'} />;
}
