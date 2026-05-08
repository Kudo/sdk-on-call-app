import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as AC from '@bacons/apple-colors';
import { getStoredMemberId } from '@/lib/storage';

export default function GatewayRoute() {
  const [ready, setReady] = useState(false);
  const [hasMember, setHasMember] = useState(false);

  useEffect(() => {
    setHasMember(!!getStoredMemberId());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={AC.systemBlue as unknown as string} />
      </View>
    );
  }

  return <Redirect href={hasMember ? '/(tabs)/(schedule)' : '/onboarding'} />;
}
