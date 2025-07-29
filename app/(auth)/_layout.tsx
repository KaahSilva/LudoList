import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f5f5f5' },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{
            title: 'Login',
          }}
        />
        <Stack.Screen 
          name="register" 
          options={{
            title: 'Cadastro',
          }}
        />
      </Stack>
    </>
  );
}